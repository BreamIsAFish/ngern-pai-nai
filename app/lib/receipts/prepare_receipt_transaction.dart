import 'package:characters/characters.dart';

import '../transactions/transaction.dart';
import 'receipt_extraction.dart';

class PreparedReceiptTransaction {
  const PreparedReceiptTransaction({
    required this.transaction,
    required this.warnings,
  });

  final TransactionInput transaction;
  final List<String> warnings;
}

PreparedReceiptTransaction prepareReceiptTransaction({
  required ReceiptExtraction extraction,
  DateTime? now,
}) {
  final amount = extraction.amount;
  if (!extraction.isValidPurchase) {
    throw ReceiptDataInvalid(
      extraction.unsupportedReason ?? 'รูปนี้ไม่ใช่ใบเสร็จซื้อที่รองรับ',
    );
  }
  if (amount == null || amount <= 0 || extraction.currency != 'THB') {
    throw const ReceiptDataInvalid('อ่านยอดเงินรวมสุทธิเป็นบาทไม่ได้');
  }
  final localNow = now ?? DateTime.now();
  final parsedDate = _parseReceiptDate(extraction.receiptDate);
  if (extraction.receiptDate != null && parsedDate == null) {
    throw const ReceiptDataInvalid('วันที่บนใบเสร็จไม่ชัดเจน');
  }
  final parsedTime = _parseReceiptTime(extraction.receiptTime);
  if (extraction.receiptTime != null && parsedTime == null) {
    throw const ReceiptDataInvalid('เวลาบนใบเสร็จไม่ชัดเจน');
  }
  final inferred = parsedDate == null;
  final localInstant = inferred
      ? localNow
      : DateTime(
          parsedDate.year,
          parsedDate.month,
          parsedDate.day,
          parsedTime?.hour ?? 12,
          parsedTime?.minute ?? 0,
          parsedTime?.second ?? 0,
        );
  final localToday = DateTime(localNow.year, localNow.month, localNow.day);
  final receiptDay = DateTime(
    localInstant.year,
    localInstant.month,
    localInstant.day,
  );
  if (!inferred &&
      (receiptDay.isAfter(localToday) ||
          (parsedTime != null && localInstant.isAfter(localNow)))) {
    throw const ReceiptDataInvalid('วันที่บนใบเสร็จเป็นเวลาในอนาคต');
  }
  final utc = localInstant.toUtc();
  final warnings = <String>[
    if (inferred) 'ไม่พบวันที่ จึงใช้เวลานำเข้า',
    if (extraction.transactionNumber == null)
      'ไม่พบเลขที่รายการ จึงไม่ได้ตรวจรายการซ้ำ',
    if (extraction.merchantName == null) 'ไม่พบชื่อร้าน',
  ];
  final note = extraction.note?.characters.take(100).toString() ?? '';
  return PreparedReceiptTransaction(
    transaction: TransactionInput(
      date: _dateOnly(utc),
      time: _timeOnly(utc),
      type: TransactionType.expense,
      category: null,
      tag: null,
      amount: amount,
      note: note,
      destination: extraction.merchantName,
      transactionNumber: extraction.transactionNumber,
      source: TransactionSource.receiptAi,
      dateInferred: inferred,
    ),
    warnings: warnings,
  );
}

class _ReceiptTime {
  const _ReceiptTime(this.hour, this.minute, this.second);
  final int hour;
  final int minute;
  final int second;
}

DateTime? _parseReceiptDate(String? value) {
  if (value == null) return null;
  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(value);
  if (match == null) return null;
  var year = int.parse(match.group(1)!);
  final month = int.parse(match.group(2)!);
  final day = int.parse(match.group(3)!);
  if (year >= 2400) year -= 543;
  final date = DateTime(year, month, day);
  if (date.year != year || date.month != month || date.day != day) return null;
  return date;
}

_ReceiptTime? _parseReceiptTime(String? value) {
  if (value == null) return null;
  final match = RegExp(r'^(\d{2}):(\d{2})(?::(\d{2}))?$').firstMatch(value);
  if (match == null) return null;
  final hour = int.parse(match.group(1)!);
  final minute = int.parse(match.group(2)!);
  final second = int.parse(match.group(3) ?? '0');
  if (hour > 23 || minute > 59 || second > 59) return null;
  return _ReceiptTime(hour, minute, second);
}

String _dateOnly(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-'
    '${date.month.toString().padLeft(2, '0')}-'
    '${date.day.toString().padLeft(2, '0')}';

String _timeOnly(DateTime date) =>
    '${date.hour.toString().padLeft(2, '0')}:'
    '${date.minute.toString().padLeft(2, '0')}:'
    '${date.second.toString().padLeft(2, '0')}';

class ReceiptDataInvalid implements Exception {
  const ReceiptDataInvalid(this.message);
  final String message;
}
