import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:googleapis_auth/googleapis_auth.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ngern_pai_nai/auth/google_auth_service.dart';
import 'package:ngern_pai_nai/sheets/sheets_gateway.dart';
import 'package:ngern_pai_nai/storage/spreadsheet_store.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

TransactionInput _input(
  String source, {
  bool transfer = false,
  bool move = false,
}) => TransactionInput.fromJson({
  'date': move ? '2025-10-01' : '2025-09-17',
  'time': '05:30:00',
  'type': transfer ? 'transfer' : 'expense',
  'category': transfer ? 'Transfer' : 'Food',
  'tag': transfer ? null : 'Trip',
  'amount': 120.5,
  'note': 'Lunch',
  'destination': transfer ? 'Savings' : 'Restaurant',
  'transactionNumber': source == 'receipt_ai' ? 'TX-123' : null,
  'source': source,
  'dateInferred': false,
});

TransactionRecord _record(String id, TransactionInput input) =>
    TransactionRecord(
      id: id,
      input: input,
      createdAt: DateTime.utc(2025, 9, 17),
      updatedAt: DateTime.utc(2025, 9, 17),
    );

void main() {
  for (final source in ['manual', 'receipt_ai']) {
    for (final move in [false, true]) {
      test(
        'changes a $source expense to transfer ${move ? 'in a new month' : 'in place'}',
        () async {
          final original = _record('tx-1', _input(source));
          final transport = _SheetTransport([original]);
          final gateway = SheetsGateway(
            auth: _Auth(transport),
            store: _Store(),
          );
          final input = _input(source, transfer: true, move: move);
          final result = await gateway.updateTransaction(
            id: 'tx-1',
            sourceUtcMonth: '2025_09',
            input: input,
          );
          expect(result.id, original.id);
          expect(result.createdAt, original.createdAt);
          expect(result.updatedAt.isAfter(original.updatedAt), isTrue);
          final target = move ? 'Transactions_2025_10' : 'Transactions_2025_09';
          final row = transport.tabs[target]!.single;
          expect(
            TransactionRecord.fromSheetRow(row).input.toJson(),
            input.toJson(),
          );
          expect(
            [row[3], row[4], row[5], row[8], row[9], row[10], row[11]],
            [
              'transfer',
              'Transfer',
              '',
              'Savings',
              source == 'receipt_ai' ? 'TX-123' : '',
              source,
              false,
            ],
          );
          if (move) {
            expect(transport.tabs['Transactions_2025_09'], isEmpty);
            expect(transport.mutations, [
              'add Transactions_2025_10',
              'header Transactions_2025_10',
              'append Transactions_2025_10',
              'delete Transactions_2025_09 2',
            ]);
          } else {
            expect(transport.mutations, ['update Transactions_2025_09 2']);
          }
        },
      );
    }
  }

  test(
    'rejects changing receipt provenance to bypass the installed parser',
    () async {
      final transport = _SheetTransport([
        _record('tx-1', _input('receipt_ai')),
      ]);
      final gateway = SheetsGateway(auth: _Auth(transport), store: _Store());
      await expectLater(
        gateway.updateTransaction(
          id: 'tx-1',
          sourceUtcMonth: '2025_09',
          input: _input('manual', transfer: true),
        ),
        throwsA(
          isA<FormatException>().having(
            (error) => error.message,
            'message',
            'Transaction source cannot change.',
          ),
        ),
      );
      expect(transport.mutations, isEmpty);
    },
  );

  test(
    'checks receipt duplicates before updating even when the new type is transfer',
    () async {
      final transport = _SheetTransport([
        _record('tx-1', _input('receipt_ai')),
        _record('duplicate', _input('receipt_ai')),
      ]);
      final gateway = SheetsGateway(auth: _Auth(transport), store: _Store());
      await expectLater(
        gateway.updateTransaction(
          id: 'tx-1',
          sourceUtcMonth: '2025_09',
          input: _input('receipt_ai', transfer: true),
        ),
        throwsA(
          isA<ReceiptDuplicate>().having(
            (error) => error.record.id,
            'duplicate ID',
            'duplicate',
          ),
        ),
      );
      expect(transport.mutations, isEmpty);
    },
  );

  test('looks for the ID only in the supplied source month', () async {
    final transport = _SheetTransport([_record('tx-1', _input('manual'))]);
    transport.tabs['Transactions_2025_08'] = [];
    final gateway = SheetsGateway(auth: _Auth(transport), store: _Store());
    await expectLater(
      gateway.updateTransaction(
        id: 'tx-1',
        sourceUtcMonth: '2025_08',
        input: _input('manual', transfer: true),
      ),
      throwsA(isA<TransactionNotFound>()),
    );
    expect(transport.mutations, isEmpty);
  });
}

class _SheetTransport {
  _SheetTransport(List<TransactionRecord> records)
    : tabs = {
        'Transactions_2025_09': records
            .map((record) => record.toSheetRow())
            .toList(),
      };
  final Map<String, List<List<Object?>>> tabs;
  final List<String> mutations = [];

  Future<http.Response> handle(http.Request request) async {
    final path = request.url.path;
    final body = request.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(request.body) as Map<String, dynamic>;
    Object response = {};
    if (path.endsWith(':batchUpdate')) {
      for (final change in body['requests'] as List) {
        if (change['addSheet'] != null) {
          final title = change['addSheet']['properties']['title'] as String;
          tabs[title] = [];
          mutations.add('add $title');
        } else if (change['deleteDimension'] != null) {
          final range = change['deleteDimension']['range'];
          final title = tabs.keys.elementAt(range['sheetId'] as int);
          final index = range['startIndex'] as int;
          tabs[title]!.removeAt(index - 1);
          mutations.add('delete $title ${index + 1}');
        } else {
          throw StateError('Unexpected Sheets mutation: $body');
        }
      }
    } else if (path.contains('/values/')) {
      final range = Uri.decodeComponent(path.split('/values/').last);
      final title = range.split('!').first;
      if (request.method == 'GET') {
        response = {
          'values': range.endsWith('A1:N1')
              ? [SheetsGateway.transactionHeaders]
              : tabs[title]!,
        };
      } else if (path.endsWith(':append')) {
        tabs[title]!.add(List<Object?>.from(body['values'][0]));
        mutations.add('append $title');
      } else if (range.endsWith('A1:N1')) {
        expect(body['values'], [SheetsGateway.transactionHeaders]);
        mutations.add('header $title');
      } else {
        final rowNumber = int.parse(
          RegExp(r'!A(\d+):N').firstMatch(range)!.group(1)!,
        );
        tabs[title]![rowNumber - 2] = List<Object?>.from(body['values'][0]);
        mutations.add('update $title $rowNumber');
      }
    } else if (request.method == 'GET' && path.endsWith('/sheet-1')) {
      response = {
        'sheets': [
          for (var index = 0; index < tabs.length; index++)
            {
              'properties': {
                'title': tabs.keys.elementAt(index),
                'sheetId': index,
              },
            },
        ],
      };
    } else {
      throw StateError('Unexpected Sheets request: ${request.method} $path');
    }
    return http.Response(
      jsonEncode(response),
      200,
      headers: {'content-type': 'application/json'},
    );
  }
}

class _Client extends MockClient implements AuthClient {
  _Client(super.handler);
  @override
  AccessCredentials get credentials => throw UnimplementedError();
}

class _Auth extends GoogleAuthService {
  _Auth(this.transport);
  final _SheetTransport transport;
  @override
  GoogleSignInAccount get currentAccount => _Account();
  @override
  Future<AuthClient> authenticatedClient() async => _Client(transport.handle);
}

class _Account implements GoogleSignInAccount {
  @override
  String get id => 'account-1';
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _Store extends SpreadsheetStore {
  @override
  Future<String?> read(String accountId) async => 'sheet-1';
}
