import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/tags/tag.dart';

void main() {
  test('accepts a Thai tag name', () {
    final tag = TagInput.fromJson({'name': 'รายเดือน'});

    expect(tag.name, 'รายเดือน');
  });
}
