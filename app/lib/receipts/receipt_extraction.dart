class ReceiptExtraction {
  const ReceiptExtraction({
    required this.isValidPurchase,
    required this.merchantName,
    required this.note,
    required this.amount,
    required this.currency,
    required this.receiptDate,
    required this.receiptTime,
    required this.transactionNumber,
    required this.unsupportedReason,
  });

  factory ReceiptExtraction.fromJson(Map<String, dynamic> json) {
    return ReceiptExtraction(
      isValidPurchase: json['valid_purchase'] == true,
      merchantName: _nullableString(json['merchant_name']),
      note: _nullableString(json['note']),
      amount: (json['amount'] as num?)?.toDouble(),
      currency: _nullableString(json['currency']),
      receiptDate: _nullableString(json['receipt_date']),
      receiptTime: _nullableString(json['receipt_time']),
      transactionNumber: _nullableString(json['transaction_number']),
      unsupportedReason: _nullableString(json['unsupported_reason']),
    );
  }

  final double? amount;
  final String? currency;
  final bool isValidPurchase;
  final String? merchantName;
  final String? note;
  final String? receiptDate;
  final String? receiptTime;
  final String? transactionNumber;
  final String? unsupportedReason;
}

String? _nullableString(Object? value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}
