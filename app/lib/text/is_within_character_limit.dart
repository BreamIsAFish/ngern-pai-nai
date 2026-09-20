import 'package:characters/characters.dart';

/// Reports whether [value] fits within [limit] visible Unicode characters.
///
/// Thai tone marks and vowels that combine with a base letter count as part of
/// the same character instead of consuming separate slots.
bool isWithinCharacterLimit({required String value, required int limit}) =>
    value.characters.length <= limit;
