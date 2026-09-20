import '../text/is_within_character_limit.dart';

enum TransactionType {
  income,
  expense,
  transfer;

  static TransactionType parse(String value) {
    return switch (value) {
      'income' => TransactionType.income,
      'expense' => TransactionType.expense,
      'transfer' => TransactionType.transfer,
      _ => throw const FormatException('Unsupported transaction type.'),
    };
  }
}

class TransactionInput {
  const TransactionInput({
    required this.date,
    required this.time,
    required this.type,
    required this.category,
    required this.tag,
    required this.amount,
    required this.note,
    required this.destination,
  });

  factory TransactionInput.fromJson(Map<String, dynamic> json) {
    final date = (json['date'] as String? ?? '').trim();
    final time = (json['time'] as String? ?? '').trim();
    final instant = DateTime.tryParse('${date}T${time}Z');
    final amount = (json['amount'] as num?)?.toDouble();
    final category = (json['category'] as String? ?? '').trim();
    final note = (json['note'] as String? ?? '').trim();
    if (instant == null ||
        !instant.isUtc ||
        instant.isAfter(DateTime.now().toUtc()) ||
        amount == null ||
        amount <= 0 ||
        category.isEmpty ||
        !isWithinCharacterLimit(value: note, limit: 160)) {
      throw const FormatException('Invalid transaction fields.');
    }

    final type = TransactionType.parse(json['type'] as String? ?? '');
    return TransactionInput(
      date: _dateOnly(instant),
      time: _timeOnly(instant),
      type: type,
      category: type == TransactionType.transfer ? 'Transfer' : category,
      tag: _nullableString(json['tag']),
      amount: amount,
      note: note,
      destination: _nullableString(json['destination']),
    );
  }

  final double amount;
  final String category;
  final String date;
  final String? destination;
  final String note;
  final String? tag;
  final String time;
  final TransactionType type;

  DateTime get utcDateTime => DateTime.parse('${date}T${time}Z').toUtc();

  String get utcMonth => '${date.substring(0, 4)}_${date.substring(5, 7)}';

  Map<String, dynamic> toJson() => {
    'date': date,
    'time': time,
    'type': type.name,
    'category': category,
    'tag': tag,
    'amount': amount,
    'note': note,
    'destination': destination,
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
    if (row.length < 11) throw const FormatException('Incomplete sheet row.');
    return TransactionRecord(
      id: row[0].toString(),
      input: TransactionInput.fromJson({
        'date': row[1].toString(),
        'time': row[2].toString(),
        'type': row[3].toString(),
        'category': row[4].toString(),
        'tag': row[5],
        'amount': double.tryParse(row[6].toString()),
        'note': row[7].toString(),
        'destination': row[8],
      }),
      createdAt: DateTime.parse(row[9].toString()).toUtc(),
      updatedAt: DateTime.parse(row[10].toString()).toUtc(),
    );
  }

  final DateTime createdAt;
  final String id;
  final TransactionInput input;
  final DateTime updatedAt;

  List<Object?> toSheetRow() => [
    id,
    input.date,
    input.time,
    input.type.name,
    input.category,
    input.tag ?? '',
    input.amount,
    input.note,
    input.destination ?? '',
    createdAt.toIso8601String(),
    updatedAt.toIso8601String(),
  ];

  Map<String, dynamic> toJson() => {
    'id': id,
    ...input.toJson(),
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

String _dateOnly(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

String _timeOnly(DateTime date) {
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  final second = date.second.toString().padLeft(2, '0');
  return '$hour:$minute:$second';
}

String? _nullableString(Object? value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}
