import 'category.dart';
import 'default_categories.dart';

class DefaultCategoryReconciliation {
  const DefaultCategoryReconciliation({
    required this.records,
    required this.changedIndexes,
  });

  final List<CategoryRecord> records;
  final Set<int> changedIndexes;
}

/// Replaces catalog-owned fields on default categories and adds missing ones.
///
/// [existing] remains in its original order, including every custom category.
/// [updatedAt] is used for changed defaults and as both timestamps for missing
/// defaults. Existing `created_at` values never change.
/// Returns the reconciled records and the indexes that require a Sheet write.
DefaultCategoryReconciliation reconcileDefaultCategories({
  required List<CategoryRecord> existing,
  required DateTime updatedAt,
}) {
  final definitionsById = {
    for (final definition in defaultCategoryDefinitions)
      definition.id: definition,
  };
  final seenDefaultIds = <String>{};
  final changedIndexes = <int>{};
  final records = <CategoryRecord>[];

  for (final record in existing) {
    final definition = definitionsById[record.id];
    if (definition == null || !seenDefaultIds.add(record.id)) {
      records.add(record);
      continue;
    }
    final needsUpdate =
        record.name != definition.name ||
        record.type != definition.type ||
        record.iconUrl != definition.iconUrl ||
        !record.isDefault;
    if (!needsUpdate) {
      records.add(record);
      continue;
    }
    changedIndexes.add(records.length);
    records.add(
      CategoryRecord(
        id: definition.id,
        name: definition.name,
        type: definition.type,
        iconUrl: definition.iconUrl,
        isDefault: true,
        createdAt: record.createdAt,
        updatedAt: updatedAt,
      ),
    );
  }

  for (final definition in defaultCategoryDefinitions) {
    if (seenDefaultIds.contains(definition.id)) continue;
    changedIndexes.add(records.length);
    records.add(
      CategoryRecord(
        id: definition.id,
        name: definition.name,
        type: definition.type,
        iconUrl: definition.iconUrl,
        isDefault: true,
        createdAt: updatedAt,
        updatedAt: updatedAt,
      ),
    );
  }

  return DefaultCategoryReconciliation(
    records: List.unmodifiable(records),
    changedIndexes: Set.unmodifiable(changedIndexes),
  );
}
