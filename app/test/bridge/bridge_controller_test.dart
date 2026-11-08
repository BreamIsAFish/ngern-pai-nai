import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/auth/google_auth_service.dart';
import 'package:ngern_pai_nai/bridge/bridge_controller.dart';
import 'package:ngern_pai_nai/sheets/sheets_gateway.dart';
import 'package:ngern_pai_nai/storage/spreadsheet_store.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

Map<String, dynamic> transferPayload(String source) => {
  'date': '2025-09-17',
  'time': '05:30:00',
  'type': 'transfer',
  'category': 'Transfer',
  'tag': null,
  'amount': 120.5,
  'note': 'Lunch',
  'destination': 'Savings',
  'transactionNumber': source == 'receipt_ai' ? 'TX-123' : null,
  'source': source,
  'dateInferred': false,
};

void main() {
  for (final source in ['manual', 'receipt_ai']) {
    test(
      'saves a $source expense changed to transfer through the bridge',
      () async {
        final sheets = _RecordingSheets();
        final controller = BridgeController(
          auth: GoogleAuthService(),
          sheets: sheets,
        );
        final response = await controller.handleMessage(
          jsonEncode({
            'id': 'request-1',
            'operation': 'transactions.update',
            'payload': {
              'id': 'tx-1',
              'sourceUtcMonth': '2025_09',
              'transaction': transferPayload(source),
            },
          }),
        );

        expect(response.toJson()['error'], isNull);
        expect(response.toJson()['ok'], isTrue);
        expect(sheets.receivedId, 'tx-1');
        expect(sheets.receivedMonth, '2025_09');
        final saved = TransactionRecord.fromSheetRow(
          sheets.saved!.toSheetRow(),
        );
        expect(saved.input.toJson(), transferPayload(source));
        expect(saved.id, 'tx-1');
      },
    );
  }

  test(
    'includes the native validation exception behind a short error message',
    () async {
      final sheets = _RecordingSheets();
      final controller = BridgeController(
        auth: GoogleAuthService(),
        sheets: sheets,
      );
      final response = await controller.handleMessage(
        jsonEncode({
          'id': 'request-invalid',
          'operation': 'transactions.update',
          'payload': {
            'id': 'tx-1',
            'sourceUtcMonth': '2025_09',
            'transaction': {...transferPayload('manual'), 'amount': 0},
          },
        }),
      );

      expect(response.toJson(), {
        'id': 'request-invalid',
        'ok': false,
        'error': {
          'code': 'INVALID_REQUEST',
          'message': 'Check the details and try again.',
          'data': {
            'type': 'FormatException',
            'message': 'FormatException: Invalid transaction fields.',
          },
        },
      });
      expect(sheets.saved, isNull);
    },
  );

  test(
    'carries an unexpected service exception without lengthening the toast',
    () async {
      final sheets = _RecordingSheets()
        ..failure = StateError('Sheet update failed.');
      final controller = BridgeController(
        auth: GoogleAuthService(),
        sheets: sheets,
      );
      final response = await controller.handleMessage(
        jsonEncode({
          'id': 'request-failed',
          'operation': 'transactions.update',
          'payload': {
            'id': 'tx-1',
            'sourceUtcMonth': '2025_09',
            'transaction': transferPayload('manual'),
          },
        }),
      );
      expect(response.toJson()['error'], {
        'code': 'UNEXPECTED',
        'message': 'Something went wrong. Please try again.',
        'data': {
          'type': 'StateError',
          'message': 'Bad state: Sheet update failed.',
        },
      });
    },
  );
}

class _RecordingSheets extends SheetsGateway {
  _RecordingSheets()
    : super(auth: GoogleAuthService(), store: SpreadsheetStore());

  String? receivedId;
  String? receivedMonth;
  TransactionRecord? saved;
  Object? failure;

  @override
  Future<TransactionRecord> updateTransaction({
    required String id,
    required String sourceUtcMonth,
    required TransactionInput input,
  }) async {
    if (failure != null) throw failure!;
    receivedId = id;
    receivedMonth = sourceUtcMonth;
    return saved = TransactionRecord(
      id: id,
      input: input,
      createdAt: DateTime.utc(2025, 9, 17),
      updatedAt: DateTime.utc(2025, 9, 18),
    );
  }
}
