import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_prompt.dart';

void main() {
  test('accepts completed outgoing KBank slip types as expenses', () {
    for (final supportedType in [
      'K PLUS',
      'พร้อมเพย์',
      'QR',
      'จ่ายบิล',
      'เติมเงิน',
    ]) {
      expect(receiptInstructions, contains(supportedType));
    }
    expect(receiptInstructions, contains('ธุรกรรมขาออกสำเร็จแล้ว'));
    expect(receiptInstructions, contains('เงินเข้า'));
    expect(receiptImagePrompt, contains('KBank/K PLUS'));
  });
}
