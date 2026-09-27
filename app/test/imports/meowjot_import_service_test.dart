import 'dart:convert';

import 'package:file_selector/file_selector.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/imports/meowjot_import_service.dart';
import 'package:ngern_pai_nai/sheets/sheets_gateway.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  const headers =
      'Date,Time,Type,Category,Tag,Amount,Note,Payment method,Pay from,Receiving bank,Receiver';

  test(
    'converts the selected CSV and imports its records in one action',
    () async {
      List<TransactionRecord>? received;
      final service = MeowJotImportService(
        filePicker: () async => XFile.fromData(
          utf8.encode(
            '$headers\n'
            '12/02/2026,02:49,Spending,Save & invest,-,-0,-,Account,-,-,-\n'
            '12/02/2026,03:00,Spending,Food,-,-100,Lunch,Account,-,-,Restaurant\n',
          ),
          path: 'meowjot.csv',
        ),
        importTransactions: (records) async {
          received = records;
          return const TransactionImportResult(imported: 1, duplicates: 0);
        },
        now: () => DateTime.utc(2026, 3, 1),
      );

      final result = await service.pickAndImport();

      expect(received, hasLength(1));
      expect(received!.single.input.amount, 100);
      expect(result.cancelled, isFalse);
      expect(result.fileName, 'meowjot.csv');
      expect(result.sourceRows, 2);
      expect(result.imported, 1);
      expect(result.duplicates, 0);
      expect(result.skippedZeroAmount, 1);
    },
  );

  test('does not import when file selection is cancelled', () async {
    var importCalled = false;
    final service = MeowJotImportService(
      filePicker: () async => null,
      importTransactions: (records) async {
        importCalled = true;
        return const TransactionImportResult(imported: 0, duplicates: 0);
      },
    );

    final result = await service.pickAndImport();

    expect(importCalled, isFalse);
    expect(result.cancelled, isTrue);
    expect(result.toJson(), {
      'cancelled': true,
      'sourceRows': 0,
      'imported': 0,
      'duplicates': 0,
      'skippedZeroAmount': 0,
    });
  });
}
