import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/text/is_within_character_limit.dart';

void main() {
  test(
    'counts Thai letters and combining tone marks as visible characters',
    () {
      final twentyThaiCharacters = List.filled(20, 'ก้').join();

      expect(
        isWithinCharacterLimit(value: twentyThaiCharacters, limit: 20),
        isTrue,
      );
      expect(
        isWithinCharacterLimit(
          value: '$twentyThaiCharacters\u{0E01}',
          limit: 20,
        ),
        isFalse,
      );
    },
  );
}
