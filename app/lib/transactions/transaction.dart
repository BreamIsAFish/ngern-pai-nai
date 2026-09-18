enum TransactionType {
  income,
  expense;

  static TransactionType parse(String value) {
    return switch (value) {
      'income' => TransactionType.income,
      'expense' => TransactionType.expense,
      _ => throw const FormatException('Unsupported transaction type.'),
    };
  }
}

class TransactionInput {
  const TransactionInput({
    required this.occurredAt,
    required this.type,
    required this.amount,
    required this.currency,
    required this.category,
    required this.note,
  });

  factory TransactionInput.fromJson(Map<String, dynamic> json) {
    final occurredAt = DateTime.tryParse(json['occurredAt'] as String? ?? '');
    final amount = (json['amount'] as num?)?.toDouble();
    final category = (json['category'] as String? ?? '').trim();

    if (occurredAt == null ||
        amount == null ||
        amount <= 0 ||
        category.isEmpty) {
      throw const FormatException('Invalid transaction fields.');
    }

    return TransactionInput(
      occurredAt: occurredAt,
      type: TransactionType.parse(json['type'] as String? ?? ''),
      amount: amount,
      currency: (json['currency'] as String? ?? 'THB').trim().toUpperCase(),
      category: category,
      note: (json['note'] as String? ?? '').trim(),
    );
  }

  final double amount;
  final String category;
  final String currency;
  final String note;
  final DateTime occurredAt;
  final TransactionType type;

  Map<String, dynamic> toJson() => {
    'occurredAt': _dateOnly(occurredAt),
    'type': type.name,
    'amount': amount,
    'currency': currency,
    'category': category,
    'note': note,
  };
}

class TransactionRecord {
  const TransactionRecord({
    required this.id,
    required this.input,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TransactionRecord.fromSheetRow(List<Object?> row) {
    if (row.length < 9) throw const FormatException('Incomplete sheet row.');

    return TransactionRecord(
      id: row[0].toString(),
      input: TransactionInput.fromJson({
        'occurredAt': row[1].toString(),
        'type': row[2].toString(),
        'amount': double.tryParse(row[3].toString()),
        'currency': row[4].toString(),
        'category': row[5].toString(),
        'note': row[6].toString(),
      }),
      createdAt: DateTime.parse(row[7].toString()).toUtc(),
      updatedAt: DateTime.parse(row[8].toString()).toUtc(),
    );
  }

  final DateTime createdAt;
  final String id;
  final TransactionInput input;
  final DateTime updatedAt;

  List<Object?> toSheetRow() => [
    id,
    _dateOnly(input.occurredAt),
    input.type.name,
    input.amount,
    input.currency,
    input.category,
    input.note,
    createdAt.toUtc().toIso8601String(),
    updatedAt.toUtc().toIso8601String(),
  ];

  Map<String, dynamic> toJson() => {
    'id': id,
    ...input.toJson(),
    'createdAt': createdAt.toUtc().toIso8601String(),
    'updatedAt': updatedAt.toUtc().toIso8601String(),
  };
}

String _dateOnly(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}
