import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  group('TransactionInput', () {
    test('maps a valid bridge payload to a typed transaction', () {
      final transaction = TransactionInput.fromJson({
        'occurredAt': '2026-09-17',
        'type': 'expense',
        'amount': 120.5,
        'currency': 'thb',
        'category': 'Food',
        'note': 'Lunch',
      });

      expect(transaction.amount, 120.5);
      expect(transaction.currency, 'THB');
      expect(transaction.type, TransactionType.expense);
    });

    test('rejects zero amounts and missing categories', () {
      expect(
        () => TransactionInput.fromJson({
          'occurredAt': '2026-09-17',
          'type': 'expense',
          'amount': 0,
          'category': '',
        }),
        throwsFormatException,
      );
    });
  });

  group('TransactionRecord', () {
    test('maps a sheet row to the safe web response shape', () {
      final record = TransactionRecord.fromSheetRow([
        'tx-1',
        '2026-09-17',
        'income',
        '500',
        'THB',
        'Gift',
        'Birthday',
        '2026-09-17T01:00:00.000Z',
        '2026-09-17T02:00:00.000Z',
      ]);

      expect(record.toJson(), containsPair('id', 'tx-1'));
      expect(record.toJson(), containsPair('amount', 500.0));
      expect(record.toJson(), containsPair('type', 'income'));
    });
  });
}
