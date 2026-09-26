import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/receipts/receipt_duplicate.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  test('normalizes separators and case without changing other characters', () {
    expect(normalizeReceiptTransactionNumber(' tx-12 / 34.a '), 'TX1234A');
    expect(normalizeReceiptTransactionNumber('  '), isNull);
  });

  test(
    'requires transaction number, local date, and satang amount to match',
    () {
      final candidate = transaction(
        transactionNumber: 'tx-12/34',
        amount: 99.5,
      );

      expect(
        hasSameReceiptFingerprint(
          candidate,
          transaction(transactionNumber: 'TX 12-34', amount: 99.50),
        ),
        isTrue,
      );
      expect(
        hasSameReceiptFingerprint(candidate, transaction(amount: 99.51)),
        isFalse,
      );
      expect(
        hasSameReceiptFingerprint(candidate, transaction(date: '2026-09-21')),
        isFalse,
      );
      expect(
        hasSameReceiptFingerprint(candidate, transaction(dateInferred: true)),
        isFalse,
      );
    },
  );

  test('searches every UTC month touched by the candidate local date', () {
    final transaction = transactionInput();
    final months = utcMonthsCoveringLocalReceiptDate(transaction.utcDateTime);

    expect(months, contains(transaction.utcMonth));
    expect(months.length, lessThanOrEqualTo(2));
  });
}

TransactionInput transaction({
  String date = '2026-09-20',
  double amount = 99.5,
  String? transactionNumber = 'tx-12/34',
  bool dateInferred = false,
}) => transactionInput(
  date: date,
  amount: amount,
  transactionNumber: transactionNumber,
  dateInferred: dateInferred,
);

TransactionInput transactionInput({
  String date = '2026-09-20',
  double amount = 99.5,
  String? transactionNumber = 'tx-12/34',
  bool dateInferred = false,
}) => TransactionInput(
  date: date,
  time: '05:30:00',
  type: TransactionType.expense,
  category: null,
  tag: null,
  amount: amount,
  note: '',
  destination: null,
  transactionNumber: transactionNumber,
  source: TransactionSource.receiptAi,
  dateInferred: dateInferred,
);
