import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_client.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_prompt.dart';
import 'package:ngern_pai_nai/google_ai/google_ai_client.dart';

void main() {
  test(
    'validates the selected Gemini model without putting the key in the URL',
    () async {
      late http.Request captured;
      final client = GoogleAiClient(
        client: MockClient((request) async {
          captured = request;
          return http.Response('{}', 200);
        }),
      );

      await client.validateKey(
        apiKey: 'google-secret-key',
        model: 'gemini-3.8-flash',
      );

      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(
        captured.url.path,
        '/v1beta/models/gemini-3.8-flash:generateContent',
      );
      expect(captured.url.query, isEmpty);
      expect(captured.headers['x-goog-api-key'], 'google-secret-key');
      expect(body['generationConfig'], {'maxOutputTokens': 16});
    },
  );

  test(
    'sends inline image data with a JSON schema and parses the receipt',
    () async {
      late Map<String, dynamic> capturedBody;
      final client = GoogleAiClient(
        client: MockClient((request) async {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response.bytes(
            utf8.encode(
              jsonEncode({
                'candidates': [
                  {
                    'content': {
                      'parts': [
                        {'thoughtSignature': 'opaque-signature'},
                        {
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
                  },
                ],
              }),
            ),
            200,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'x-goog-request-id': 'google-request-id',
            },
          );
        }),
      );
      final directory = await Directory.systemTemp.createTemp('receipt-test-');
      addTearDown(() => directory.delete(recursive: true));
      final image = File('${directory.path}/receipt.png');
      await image.writeAsBytes([1, 2, 3]);

      final result = await client.extractReceipt(
        apiKey: 'google-secret-key',
        model: 'gemini-3.8-flash',
        image: image,
      );

      final contents = capturedBody['contents'] as List<dynamic>;
      final parts =
          (contents.single as Map<String, dynamic>)['parts'] as List<dynamic>;
      final imagePart = parts.cast<Map<String, dynamic>>().singleWhere(
        (part) => part.containsKey('inlineData'),
      );
      final inlineData = imagePart['inlineData'] as Map<String, dynamic>;
      final generationConfig =
          capturedBody['generationConfig'] as Map<String, dynamic>;
      final systemInstruction =
          capturedBody['systemInstruction'] as Map<String, dynamic>;
      final systemParts = systemInstruction['parts'] as List<dynamic>;
      final promptPart = parts.cast<Map<String, dynamic>>().singleWhere(
        (part) => part.containsKey('text'),
      );
      expect(
        (systemParts.single as Map<String, dynamic>)['text'],
        receiptInstructions,
      );
      expect(promptPart['text'], receiptImagePrompt);
      expect(generationConfig['maxOutputTokens'], 4096);
      expect(generationConfig['thinkingConfig'], {'thinkingLevel': 'low'});
      expect(inlineData['mimeType'], 'image/png');
      expect(inlineData['data'], 'AQID');
      expect(generationConfig['responseMimeType'], 'application/json');
      expect(
        generationConfig['responseJsonSchema'],
        isA<Map<String, dynamic>>(),
      );
      expect(result.merchantName, 'ร้านทดสอบ');
      expect(result.amount, 80);
      expect(result.transactionNumber, 'TX-80');
    },
  );

  test('returns sanitized provider errors with the request ID', () async {
    final client = GoogleAiClient(
      client: MockClient(
        (_) async => http.Response(
          '{"error":{"message":"sensitive provider text"}}',
          429,
          headers: {'x-goog-request-id': 'google-rate-limit'},
        ),
      ),
      retryDelays: const [],
    );

    await expectLater(
      client.validateKey(
        apiKey: 'google-secret-key',
        model: 'gemini-3.8-flash',
      ),
      throwsA(
        isA<AiRequestError>()
            .having(
              (error) => error.requestId,
              'requestId',
              'google-rate-limit',
            )
            .having(
              (error) => error.thaiMessage,
              'thaiMessage',
              contains('Google AI Studio'),
            ),
      ),
    );
  });

  test(
    'retries transient provider failures before returning the receipt',
    () async {
      var attempts = 0;
      final client = GoogleAiClient(
        client: MockClient((_) async {
          attempts++;
          if (attempts < 3) {
            return http.Response('{"error":{"status":"UNAVAILABLE"}}', 503);
          }
          return http.Response.bytes(
            utf8.encode(
              jsonEncode({
                'candidates': [
                  {
                    'content': {
                      'parts': [
                        {
                          'text': jsonEncode({
                            'valid_purchase': true,
                            'unsupported_reason': null,
                            'merchant_name': 'ร้านทดสอบ',
                            'note': null,
                            'amount': 80,
                            'currency': 'THB',
                            'receipt_date': null,
                            'receipt_time': null,
                            'transaction_number': null,
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
            ),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }),
        retryDelays: const [Duration.zero, Duration.zero],
      );
      final directory = await Directory.systemTemp.createTemp('receipt-test-');
      addTearDown(() => directory.delete(recursive: true));
      final image = File('${directory.path}/receipt.png');
      await image.writeAsBytes([1, 2, 3]);

      final result = await client.extractReceipt(
        apiKey: 'google-secret-key',
        model: 'gemini-3.8-flash',
        image: image,
      );

      expect(attempts, 3);
      expect(result.amount, 80);
    },
  );

  test('does not retry a malformed request', () async {
    var attempts = 0;
    final client = GoogleAiClient(
      client: MockClient((_) async {
        attempts++;
        return http.Response('{"error":{"status":"INVALID_ARGUMENT"}}', 400);
      }),
      retryDelays: const [Duration.zero, Duration.zero],
    );

    await expectLater(
      client.validateKey(
        apiKey: 'google-secret-key',
        model: 'gemini-3.8-flash',
      ),
      throwsA(isA<AiRequestError>()),
    );
    expect(attempts, 1);
  });
}
