import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/categories/category.dart';
import 'package:ngern_pai_nai/categories/default_categories.dart';
import 'package:ngern_pai_nai/categories/reconcile_default_categories.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  test(
    'updates catalog fields and timestamps while preserving custom categories',
    () {
      final originalCreatedAt = DateTime.utc(2025, 1, 2);
      final originalUpdatedAt = DateTime.utc(2025, 2, 3);
      final reconciliationTime = DateTime.utc(2026, 9, 20);
      final staleDefault = CategoryRecord(
        id: defaultCategoryDefinitions.first.id,
        name: 'Old food name',
        type: TransactionType.income,
        iconUrl: null,
        isDefault: false,
        createdAt: originalCreatedAt,
        updatedAt: originalUpdatedAt,
      );
      final custom = CategoryRecord(
        id: 'custom-1',
        name: 'Coffee beans',
        type: TransactionType.expense,
        iconUrl: 'https://example.com/coffee.png',
        isDefault: false,
        createdAt: originalCreatedAt,
        updatedAt: originalUpdatedAt,
      );

      final result = reconcileDefaultCategories(
        existing: [staleDefault, custom],
        updatedAt: reconciliationTime,
      );

      final definition = defaultCategoryDefinitions.first;
      expect(result.records.first.id, definition.id);
      expect(result.records.first.name, definition.name);
      expect(result.records.first.type, definition.type);
      expect(result.records.first.iconUrl, definition.iconUrl);
      expect(result.records.first.isDefault, isTrue);
      expect(result.records.first.createdAt, originalCreatedAt);
      expect(result.records.first.updatedAt, reconciliationTime);
      expect(result.records[1], same(custom));
      expect(result.changedIndexes, containsAll({0}));
      expect(
        result.records.skip(2),
        hasLength(defaultCategoryDefinitions.length - 1),
      );
    },
  );

  test('does not rewrite current defaults or their timestamps', () {
    final createdAt = DateTime.utc(2025, 1, 2);
    final existing = createDefaultCategories(createdAt);

    final result = reconcileDefaultCategories(
      existing: existing,
      updatedAt: DateTime.utc(2026, 9, 20),
    );

    expect(result.records, orderedEquals(existing));
    expect(result.changedIndexes, isEmpty);
  });
}
