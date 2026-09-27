import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/imports/meowjot_csv_parser.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  const headers =
      'Date,Time,Type,Category,Tag,Amount,Note,Payment method,Pay from,Receiving bank,Receiver';

  test('converts the MeowJot example from Bangkok time to a sheet record', () {
    final result = parseMeowJotCsv(
      rawData:
          '$headers\r\n'
          '12/10/2025,03:21,Spending,-,-,-114,-,Account,Kasikorn Bank,-,ราเมงบอย สถานีเพชรบุรี\r\n',
      importedAt: DateTime.utc(2026, 1, 1),
    );

    expect(result.sourceRows, 1);
    expect(result.skippedZeroAmount, 0);
    expect(result.records, hasLength(1));
    final record = result.records.single;
    expect(record.input.date, '2025-10-11');
    expect(record.input.time, '20:21:00');
    expect(record.input.type, TransactionType.expense);
    expect(record.input.category, 'Other');
    expect(record.input.tag, isNull);
    expect(record.input.amount, 114);
    expect(record.input.note, isEmpty);
    expect(record.input.destination, 'ราเมงบอย สถานีเพชรบุรี');
    expect(record.input.source, TransactionSource.manual);
  });

  test('accepts plural transfers and assigns the Transfer category', () {
    final result = parseMeowJotCsv(
      rawData:
          '$headers\n'
          '12/10/2025,03:21,Transfers,-,-,500,-,Account,Kasikorn Bank,Siam Commercial Bank,-\n',
      importedAt: DateTime.utc(2026, 1, 1),
    );

    expect(result.records.single.input.type, TransactionType.transfer);
    expect(result.records.single.input.category, 'Transfer');
  });

  test('skips zero amounts without rejecting the rest of the file', () {
    final result = parseMeowJotCsv(
      rawData:
          '$headers\n'
          '12/02/2026,02:49,Spending,Save & invest,-,-0,-,Account,-,-,-\n'
          '12/02/2026,03:00,Spending,Food,-,-100,Lunch,Account,-,-,ร้านอาหาร\n',
      importedAt: DateTime.utc(2026, 3, 1),
    );

    expect(result.sourceRows, 2);
    expect(result.skippedZeroAmount, 1);
    expect(result.records.single.input.amount, 100);
  });

  test('generates stable unique IDs for repeated identical transactions', () {
    final rawData =
        '$headers\n'
        '12/02/2026,03:00,Spending,Food,-,-100,Lunch,Account,-,-,ร้านอาหาร\n'
        '12/02/2026,03:00,Spending,Food,-,-100,Lunch,Account,-,-,ร้านอาหาร\n';

    final first = parseMeowJotCsv(
      rawData: rawData,
      importedAt: DateTime.utc(2026, 3, 1),
    );
    final second = parseMeowJotCsv(
      rawData: rawData,
      importedAt: DateTime.utc(2026, 4, 1),
    );

    expect(first.records[0].id, second.records[0].id);
    expect(first.records[1].id, second.records[1].id);
    expect(first.records[0].id, isNot(first.records[1].id));
  });

  test('parses quoted commas without shifting columns', () {
    final result = parseMeowJotCsv(
      rawData:
          '$headers\n'
          '12/02/2026,03:00,Income,Salary,Monthly,"1,234.50","Payday, February",Account,-,-,Employer\n',
      importedAt: DateTime.utc(2026, 3, 1),
    );

    expect(result.records.single.input.amount, 1234.5);
    expect(result.records.single.input.note, 'Payday, February');
  });

  test('reports the row containing an unsupported transaction type', () {
    expect(
      () => parseMeowJotCsv(
        rawData:
            '$headers\n'
            '12/02/2026,03:00,Debt,Other,-,100,-,Account,-,-,-\n',
        importedAt: DateTime.utc(2026, 3, 1),
      ),
      throwsA(
        isA<MeowJotImportInvalid>().having(
          (error) => error.message,
          'message',
          contains("Row 2 has unsupported type 'Debt'"),
        ),
      ),
    );
  });

  test('rejects files missing required headers before creating records', () {
    expect(
      () => parseMeowJotCsv(
        rawData: 'Date,Time,Type\n12/02/2026,03:00,Spending\n',
        importedAt: DateTime.utc(2026, 3, 1),
      ),
      throwsA(
        isA<MeowJotImportInvalid>().having(
          (error) => error.message,
          'message',
          'Missing required columns: amount.',
        ),
      ),
    );
  });
}
