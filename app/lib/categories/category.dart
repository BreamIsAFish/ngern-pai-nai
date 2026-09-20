import '../transactions/transaction.dart';
import '../text/is_within_character_limit.dart';

class CategoryInput {
  const CategoryInput({
    required this.name,
    required this.type,
    required this.iconUrl,
  });

  factory CategoryInput.fromJson(Map<String, dynamic> json) {
    final name = (json['name'] as String? ?? '').trim();
    final iconUrl = _nullableString(json['iconUrl']);
    if (name.isEmpty || !isWithinCharacterLimit(value: name, limit: 20)) {
      throw const FormatException('Invalid category name.');
    }
    if (iconUrl != null && Uri.tryParse(iconUrl)?.scheme != 'https') {
      throw const FormatException('Category icons must use HTTPS.');
    }
    return CategoryInput(
      name: name,
      type: TransactionType.parse(json['type'] as String? ?? ''),
      iconUrl: iconUrl,
    );
  }

  final String? iconUrl;
  final String name;
  final TransactionType type;
}

class CategoryRecord {
  const CategoryRecord({
    required this.id,
    required this.name,
    required this.type,
    required this.iconUrl,
    required this.isDefault,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CategoryRecord.fromSheetRow(List<Object?> row) {
    if (row.length < 7) throw const FormatException('Incomplete category row.');
    return CategoryRecord(
      id: row[0].toString(),
      name: row[1].toString(),
      type: TransactionType.parse(row[2].toString()),
      iconUrl: _nullableString(row[3]),
      isDefault: row[4].toString().toLowerCase() == 'true',
      createdAt: DateTime.parse(row[5].toString()).toUtc(),
      updatedAt: DateTime.parse(row[6].toString()).toUtc(),
    );
  }

  final DateTime createdAt;
  final String? iconUrl;
  final String id;
  final bool isDefault;
  final String name;
  final TransactionType type;
  final DateTime updatedAt;

  List<Object?> toSheetRow() => [
    id,
    name,
    type.name,
    iconUrl ?? '',
    isDefault,
    createdAt.toIso8601String(),
    updatedAt.toIso8601String(),
  ];

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'type': type.name,
    'iconUrl': iconUrl,
    'isDefault': isDefault,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

String? _nullableString(Object? value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}
