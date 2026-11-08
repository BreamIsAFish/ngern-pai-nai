import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  group('TransactionInput', () {
    test('maps a valid bridge payload to a typed transaction', () {
      final transaction = TransactionInput.fromJson({
        'date': '2025-09-17',
        'time': '05:30:00',
        'type': 'expense',
        'amount': 120.5,
        'category': 'Food',
        'tag': '',
        'note': 'Lunch',
        'destination': '',
      });

      expect(transaction.amount, 120.5);
      expect(transaction.type, TransactionType.expense);
      expect(transaction.tag, isNull);
      expect(transaction.destination, isNull);
      expect(transaction.source, TransactionSource.manual);
      expect(transaction.dateInferred, isFalse);
    });

    test('allows a receipt import to have no category', () {
      final transaction = TransactionInput.fromJson({
        'date': '2025-09-17',
        'time': '05:30:00',
        'type': 'expense',
        'amount': 120.5,
        'category': null,
        'source': 'receipt_ai',
        'transactionNumber': 'TX-123',
        'dateInferred': true,
      });

      expect(transaction.category, isNull);
      expect(transaction.source, TransactionSource.receiptAi);
      expect(transaction.transactionNumber, 'TX-123');
      expect(transaction.dateInferred, isTrue);
    });

    for (final type in ['income', 'transfer']) {
      test('allows an existing receipt to become $type', () {
        final transaction = TransactionInput.fromJson({
          'date': '2025-09-17',
          'time': '05:30:00',
          'type': type,
          'amount': 120.5,
          'category': type == 'income' ? 'Refunds' : 'Transfer',
          'source': 'receipt_ai',
          'transactionNumber': 'TX-123',
        });

        expect(transaction.type.name, type);
        expect(transaction.amount, 120.5);
        expect(transaction.source, TransactionSource.receiptAi);
        expect(transaction.transactionNumber, 'TX-123');
        final record = TransactionRecord(
          id: 'receipt-1',
          input: transaction,
          createdAt: DateTime.utc(2025, 9, 17),
          updatedAt: DateTime.utc(2025, 9, 18),
        );
        final persisted = TransactionRecord.fromSheetRow(record.toSheetRow());
        expect(persisted.id, 'receipt-1');
        expect(persisted.input.type.name, type);
        expect(persisted.input.source, TransactionSource.receiptAi);
      });
    }

    test('rejects zero amounts and missing categories', () {
      expect(
        () => TransactionInput.fromJson({
          'date': '2025-09-17',
          'time': '05:30:00',
          'type': 'expense',
          'amount': 0,
          'category': '',
        }),
        throwsFormatException,
      );
    });

    test('preserves Thai category, tag, and note text', () {
      final transaction = TransactionInput.fromJson({
        'date': '2025-09-17',
        'time': '05:30:00',
        'type': 'expense',
        'amount': 120.5,
        'category': 'อาหาร',
        'tag': 'รายเดือน',
        'note': 'ข้าวกลางวันกับแม่',
        'destination': '',
      });

      expect(transaction.category, 'อาหาร');
      expect(transaction.tag, 'รายเดือน');
      expect(transaction.note, 'ข้าวกลางวันกับแม่');
      expect(transaction.toJson(), containsPair('note', 'ข้าวกลางวันกับแม่'));
    });
  });

  group('TransactionRecord', () {
    test('maps a sheet row to the safe web response shape', () {
      final record = TransactionRecord.fromSheetRow([
        'tx-1',
        '2025-09-17',
        '05:30:00',
        'income',
        'Gift',
        '',
        '500',
        'Birthday',
        '',
        '',
        'manual',
        false,
        '2025-09-17T01:00:00.000Z',
        '2025-09-17T02:00:00.000Z',
      ]);

      expect(record.toJson(), containsPair('id', 'tx-1'));
      expect(record.toJson(), containsPair('amount', 500.0));
      expect(record.toJson(), containsPair('type', 'income'));
    });
  });
}
