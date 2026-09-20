import '../text/is_within_character_limit.dart';

class TagInput {
  const TagInput({required this.name});

  factory TagInput.fromJson(Map<String, dynamic> json) {
    final name = (json['name'] as String? ?? '').trim();
    if (name.isEmpty || !isWithinCharacterLimit(value: name, limit: 20)) {
      throw const FormatException('Invalid tag name.');
    }
    return TagInput(name: name);
  }

  final String name;
}

class TagRecord {
  const TagRecord({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TagRecord.fromSheetRow(List<Object?> row) {
    if (row.length < 4) throw const FormatException('Incomplete tag row.');
    return TagRecord(
      id: row[0].toString(),
      name: row[1].toString(),
      createdAt: DateTime.parse(row[2].toString()).toUtc(),
      updatedAt: DateTime.parse(row[3].toString()).toUtc(),
    );
  }

  final DateTime createdAt;
  final String id;
  final String name;
  final DateTime updatedAt;

  List<Object?> toSheetRow() => [
    id,
    name,
    createdAt.toIso8601String(),
    updatedAt.toIso8601String(),
  ];

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
