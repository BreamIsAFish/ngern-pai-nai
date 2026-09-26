import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ngern_pai_nai/ai/ai_provider.dart';
import 'package:ngern_pai_nai/ai/ai_response_logger.dart';

void main() {
  test(
    'writes a timestamped provider response to the development endpoint',
    () async {
      late http.Request captured;
      final logger = AiResponseLogger.forDevelopment(
        webAppUri: Uri.parse('http://localhost:5173/app'),
        client: MockClient((request) async {
          captured = request;
          return http.Response('', 204);
        }),
      );

      await logger.write(
        provider: AiProvider.googleAiStudio,
        model: 'gemini-3.8-flash',
        responseBody: '{"candidates":[]}',
        statusCode: 200,
        requestId: 'google-request-id',
      );

      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(captured.url.path, '/__dev/ai-response-log');
      expect(DateTime.tryParse(body['timestamp'] as String), isNotNull);
      expect(body['provider'], 'google_ai_studio');
      expect(body['model'], 'gemini-3.8-flash');
      expect(body['statusCode'], 200);
      expect(body['requestId'], 'google-request-id');
      expect(body['response'], '{"candidates":[]}');
    },
  );

  test('does nothing when development logging is disabled', () async {
    var requests = 0;
    final logger = AiResponseLogger.forDevelopment(
      webAppUri: Uri.parse('http://localhost:5173'),
      client: MockClient((_) async {
        requests++;
        return http.Response('', 204);
      }),
      enabled: false,
    );

    await logger.write(
      provider: AiProvider.openAi,
      model: 'gpt-6-luna',
      responseBody: '{}',
      statusCode: 200,
    );

    expect(requests, 0);
  });
}
