import '../transactions/transaction.dart';

bool hasSameReceiptFingerprint(
  TransactionInput candidate,
  TransactionInput existing,
) {
  if (candidate.dateInferred || existing.dateInferred) return false;
  final candidateNumber = normalizeReceiptTransactionNumber(
    candidate.transactionNumber,
  );
  final existingNumber = normalizeReceiptTransactionNumber(
    existing.transactionNumber,
  );
  if (candidateNumber == null || existingNumber == null) return false;
  return candidateNumber == existingNumber &&
      localReceiptDate(candidate.utcDateTime) ==
          localReceiptDate(existing.utcDateTime) &&
      (candidate.amount * 100).round() == (existing.amount * 100).round();
}

String? normalizeReceiptTransactionNumber(String? value) {
  final normalized = value?.trim().toUpperCase().replaceAll(
    RegExp(r'[\s\-_.\\/]'),
    '',
  );
  return normalized == null || normalized.isEmpty ? null : normalized;
}

String localReceiptDate(DateTime instant) {
  final local = instant.toLocal();
  return '${local.year.toString().padLeft(4, '0')}-'
      '${local.month.toString().padLeft(2, '0')}-'
      '${local.day.toString().padLeft(2, '0')}';
}

List<String> utcMonthsCoveringLocalReceiptDate(DateTime instant) {
  final local = instant.toLocal();
  final start = DateTime(local.year, local.month, local.day).toUtc();
  final end = DateTime(
    local.year,
    local.month,
    local.day + 1,
  ).subtract(const Duration(microseconds: 1)).toUtc();
  return {_utcMonth(start), _utcMonth(end)}.toList();
}

String _utcMonth(DateTime instant) =>
    '${instant.year.toString().padLeft(4, '0')}_'
    '${instant.month.toString().padLeft(2, '0')}';
