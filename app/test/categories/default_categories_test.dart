import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/categories/default_categories.dart';
import 'package:ngern_pai_nai/transactions/transaction.dart';

void main() {
  group('defaultCategoryDefinitions', () {
    test('provides a unique icon URL slot for every default category', () {
      final ids = defaultCategoryDefinitions.map((category) => category.id);

      expect(defaultCategoryDefinitions, hasLength(22));
      expect(ids.toSet(), hasLength(defaultCategoryDefinitions.length));
      expect(
        defaultCategoryDefinitions.where(
          (category) => category.type == TransactionType.expense,
        ),
        hasLength(15),
      );
      expect(
        defaultCategoryDefinitions.where(
          (category) => category.type == TransactionType.income,
        ),
        hasLength(6),
      );
      expect(
        defaultCategoryDefinitions.where(
          (category) => category.type == TransactionType.transfer,
        ),
        hasLength(1),
      );
    });

    test('provides a public HTTPS icon URL for every default category', () {
      for (final category in defaultCategoryDefinitions) {
        final uri = Uri.tryParse(category.iconUrl ?? '');
        expect(uri?.scheme, 'https', reason: '${category.id} must use HTTPS.');
        expect(uri?.host, isNotEmpty, reason: '${category.id} needs a host.');
      }
    });
  });

  group('createDefaultCategories', () {
    test('maps every definition to a locked Sheet record', () {
      final createdAt = DateTime.utc(2026, 9, 20, 12);
      final records = createDefaultCategories(createdAt);

      expect(records, hasLength(defaultCategoryDefinitions.length));
      for (var index = 0; index < records.length; index++) {
        final definition = defaultCategoryDefinitions[index];
        final record = records[index];
        expect(record.id, definition.id);
        expect(record.name, definition.name);
        expect(record.type, definition.type);
        expect(record.iconUrl, definition.iconUrl);
        expect(record.isDefault, isTrue);
        expect(record.createdAt, createdAt);
        expect(record.updatedAt, createdAt);
      }
    });
  });
}
