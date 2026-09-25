import 'package:characters/characters.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/receipts/prepare_receipt_transaction.dart';
import 'package:ngern_pai_nai/receipts/receipt_extraction.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  group('prepareReceiptTransaction', () {
    test('maps a valid receipt to an uncategorized expense', () {
      final prepared = prepareReceiptTransaction(
        extraction: receipt(
          merchantName: 'ร้านทดสอบ',
          note: 'ข้าวและน้ำ',
          amount: 125.5,
          receiptDate: '2026-09-20',
          receiptTime: '13:45:12',
          transactionNumber: 'TX-123',
        ),
        now: DateTime(2026, 9, 25, 10),
      );

      final expected = DateTime(2026, 9, 20, 13, 45, 12).toUtc();
      expect(prepared.transaction.type, TransactionType.expense);
      expect(prepared.transaction.source, TransactionSource.receiptAi);
      expect(prepared.transaction.category, isNull);
      expect(prepared.transaction.destination, 'ร้านทดสอบ');
      expect(prepared.transaction.transactionNumber, 'TX-123');
      expect(prepared.transaction.utcDateTime, expected);
      expect(prepared.transaction.dateInferred, isFalse);
      expect(prepared.warnings, isEmpty);
    });

    test('converts a Buddhist year and uses local noon without a time', () {
      final prepared = prepareReceiptTransaction(
        extraction: receipt(receiptDate: '2569-09-20', transactionNumber: '42'),
        now: DateTime(2026, 9, 25, 10),
      );

      expect(
        prepared.transaction.utcDateTime,
        DateTime(2026, 9, 20, 12).toUtc(),
      );
    });

    test('accepts a date-only receipt from this morning and stores noon', () {
      final prepared = prepareReceiptTransaction(
        extraction: receipt(receiptDate: '2026-09-25'),
        now: DateTime(2026, 9, 25, 9),
      );

      expect(
        prepared.transaction.utcDateTime,
        DateTime(2026, 9, 25, 12).toUtc(),
      );
    });

    test('uses the import time and warns when the receipt date is missing', () {
      final importedAt = DateTime(2026, 9, 25, 9, 30, 15);
      final prepared = prepareReceiptTransaction(
        extraction: receipt(receiptDate: null, transactionNumber: null),
        now: importedAt,
      );

      expect(prepared.transaction.utcDateTime, importedAt.toUtc());
      expect(prepared.transaction.dateInferred, isTrue);
      expect(prepared.warnings, contains('ไม่พบวันที่ จึงใช้เวลานำเข้า'));
      expect(
        prepared.warnings,
        contains('ไม่พบเลขที่รายการ จึงไม่ได้ตรวจรายการซ้ำ'),
      );
    });

    test('truncates notes to 100 user-visible characters', () {
      final prepared = prepareReceiptTransaction(
        extraction: receipt(
          note: List.filled(101, 'ก้').join(),
          receiptDate: '2026-09-20',
          transactionNumber: '42',
        ),
        now: DateTime(2026, 9, 25),
      );

      expect(prepared.transaction.note.characters.length, 100);
    });

    test('rejects unsupported, non-THB, malformed, and future receipts', () {
      expect(
        () => prepareReceiptTransaction(
          extraction: receipt(isValidPurchase: false),
        ),
        throwsA(isA<ReceiptDataInvalid>()),
      );
      expect(
        () => prepareReceiptTransaction(extraction: receipt(currency: 'USD')),
        throwsA(isA<ReceiptDataInvalid>()),
      );
      expect(
        () => prepareReceiptTransaction(
          extraction: receipt(receiptDate: '2026-02-30'),
        ),
        throwsA(isA<ReceiptDataInvalid>()),
      );
      expect(
        () => prepareReceiptTransaction(
          extraction: receipt(receiptDate: '2026-09-26'),
          now: DateTime(2026, 9, 25),
        ),
        throwsA(isA<ReceiptDataInvalid>()),
      );
    });
  });
}

ReceiptExtraction receipt({
  bool isValidPurchase = true,
  String? merchantName = 'ร้านค้า',
  String? note = 'สินค้า',
  double? amount = 100,
  String? currency = 'THB',
  String? receiptDate = '2026-09-20',
  String? receiptTime,
  String? transactionNumber = 'TX-1',
  String? unsupportedReason,
}) => ReceiptExtraction(
  isValidPurchase: isValidPurchase,
  merchantName: merchantName,
  note: note,
  amount: amount,
  currency: currency,
  receiptDate: receiptDate,
  receiptTime: receiptTime,
  transactionNumber: transactionNumber,
  unsupportedReason: unsupportedReason,
);
