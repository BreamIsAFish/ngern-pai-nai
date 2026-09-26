import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_client.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_prompt.dart';
import 'package:ngern_pai_nai/openai/open_ai_client.dart';

void main() {
  test('validates the selected model without storing the response', () async {
    late http.Request captured;
    final client = OpenAiClient(
      client: MockClient((request) async {
        captured = request;
        return http.Response('{}', 200);
      }),
    );

    await client.validateKey(apiKey: 'secret-key', model: 'gpt-6-luna');

    final body = jsonDecode(captured.body) as Map<String, dynamic>;
    expect(captured.url.path, '/v1/responses');
    expect(captured.headers['authorization'], 'Bearer secret-key');
    expect(body['model'], 'gpt-6-luna');
    expect(body['store'], isFalse);
  });

  test('sends a high-detail data URL and parses structured output', () async {
    late Map<String, dynamic> capturedBody;
    final client = OpenAiClient(
      client: MockClient((request) async {
        capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
        return http.Response.bytes(
          utf8.encode(
            jsonEncode({
              'output': [
                {
                  'type': 'message',
                  'content': [
                    {
                      'type': 'output_text',
                      'text': jsonEncode({
                        'valid_purchase': true,
                        'unsupported_reason': null,
                        'merchant_name': 'ร้านทดสอบ',
                        'note': 'กาแฟ',
                        'amount': 80,
                        'currency': 'THB',
                        'receipt_date': '2026-09-20',
                        'receipt_time': '08:15:00',
                        'transaction_number': 'TX-80',
                      }),
                    },
                  ],
                },
              ],
            }),
          ),
          200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'x-request-id': 'req-ok',
          },
        );
      }),
    );
    final directory = await Directory.systemTemp.createTemp('receipt-test-');
    addTearDown(() => directory.delete(recursive: true));
    final image = File('${directory.path}/receipt.jpg');
    await image.writeAsBytes([1, 2, 3]);

    final result = await client.extractReceipt(
      apiKey: 'secret-key',
      model: 'gpt-6-luna',
      image: image,
    );

    final input = capturedBody['input'] as List<dynamic>;
    final content =
        (input.single as Map<String, dynamic>)['content'] as List<dynamic>;
    final imagePart = content.cast<Map<String, dynamic>>().singleWhere(
      (part) => part['type'] == 'input_image',
    );
    final promptPart = content.cast<Map<String, dynamic>>().singleWhere(
      (part) => part['type'] == 'input_text',
    );
    final text = capturedBody['text'] as Map<String, dynamic>;
    final format = text['format'] as Map<String, dynamic>;
    expect(capturedBody['store'], isFalse);
    expect(capturedBody['instructions'], receiptInstructions);
    expect(promptPart['text'], receiptImagePrompt);
    expect(imagePart['detail'], 'high');
    expect(imagePart['image_url'], 'data:image/jpeg;base64,AQID');
    expect(format['type'], 'json_schema');
    expect(format['strict'], isTrue);
    expect(result.merchantName, 'ร้านทดสอบ');
    expect(result.amount, 80);
    expect(result.transactionNumber, 'TX-80');
  });

  test('preserves the request ID in sanitized API errors', () async {
    final client = OpenAiClient(
      client: MockClient(
        (_) async => http.Response(
          '{"error":{"message":"sensitive provider text"}}',
          429,
          headers: {'x-request-id': 'req-rate-limit'},
        ),
      ),
    );

    await expectLater(
      client.validateKey(apiKey: 'secret-key', model: 'gpt-6-luna'),
      throwsA(
        isA<AiRequestError>()
            .having((error) => error.requestId, 'requestId', 'req-rate-limit')
            .having(
              (error) => error.thaiMessage,
              'thaiMessage',
              contains('โควต้า'),
            ),
      ),
    );
  });
}
