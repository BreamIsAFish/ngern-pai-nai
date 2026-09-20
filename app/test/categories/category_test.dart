import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/categories/category.dart';

void main() {
  test('accepts a Thai category name', () {
    final category = CategoryInput.fromJson({
      'name': 'อาหารและเครื่องดื่ม',
      'type': 'expense',
      'iconUrl': null,
    });

    expect(category.name, 'อาหารและเครื่องดื่ม');
  });

  test('maps the Sheet icon_url column to bridge iconUrl JSON', () {
    final record = CategoryRecord.fromSheetRow([
      'category-1',
      'Food',
      'expense',
      'https://example.com/food.png',
      true,
      '2026-09-20T10:00:00.000Z',
      '2026-09-20T11:00:00.000Z',
    ]);

    expect(record.iconUrl, 'https://example.com/food.png');
    expect(record.toJson()['iconUrl'], 'https://example.com/food.png');
  });
}
