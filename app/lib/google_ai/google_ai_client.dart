import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../ai/ai_provider.dart';
import '../ai/receipt_ai_client.dart';
import '../ai/receipt_ai_prompt.dart';
import '../receipts/receipt_extraction.dart';

class GoogleAiClient implements ReceiptAiClient {
  GoogleAiClient({
    http.Client? client,
    List<Duration>? retryDelays,
  }) : _client = client ?? http.Client(),
       _retryDelays =
           retryDelays ??
           const [
             Duration(seconds: 1),
             Duration(seconds: 2),
             Duration(seconds: 4),
           ];

  final http.Client _client;
  final List<Duration> _retryDelays;

  @override
  Future<void> validateKey({
    required String apiKey,
    required String model,
  }) async {
    await _postGenerateContent(
      apiKey: apiKey,
      model: model,
      body: {
        'contents': [
          {
            'role': 'user',
            'parts': [
              {'text': 'ตอบคำว่า OK เท่านั้น'},
            ],
          },
        ],
        'generationConfig': {'maxOutputTokens': 16},
      },
    );
  }

  @override
  Future<ReceiptExtraction> extractReceipt({
    required String apiKey,
    required String model,
    required File image,
  }) async {
    final mimeType = receiptImageMimeType(image.path);
    if (mimeType == null) throw const AiInvalidImage();
    final response = await _postGenerateContent(
      apiKey: apiKey,
      model: model,
      body: {
        'systemInstruction': {
          'parts': [
            {'text': receiptInstructions},
          ],
        },
        'contents': [
          {
            'role': 'user',
            'parts': [
              {'text': receiptImagePrompt},
              {
                'inlineData': {
                  'mimeType': mimeType,
                  'data': base64Encode(await image.readAsBytes()),
                },
              },
            ],
          },
        ],
        'generationConfig': {
          'maxOutputTokens': 4096,
          'thinkingConfig': {'thinkingLevel': 'low'},
          'responseMimeType': 'application/json',
          'responseJsonSchema': receiptSchema,
        },
      },
    );

    try {
      final candidates = response.body['candidates'] as List<dynamic>;
      final content =
          (candidates.first as Map<String, dynamic>)['content']
              as Map<String, dynamic>;
      final parts = content['parts'] as List<dynamic>;
      final textPart = parts.cast<Map<String, dynamic>>().firstWhere(
        (part) => part['text'] is String,
      );
      final text = textPart['text'] as String;
      return ReceiptExtraction.fromJson(
        jsonDecode(text) as Map<String, dynamic>,
      );
    } catch (_) {
      throw AiInvalidResponse(
        provider: AiProvider.googleAiStudio,
        requestId: response.requestId,
      );
    }
  }

  Future<_GoogleAiResponse> _postGenerateContent({
    required String apiKey,
    required String model,
    required Map<String, dynamic> body,
  }) async {
    final uri = Uri.https(
      'generativelanguage.googleapis.com',
      '/v1beta/models/$model:generateContent',
    );
    http.Response response;
    try {
      response = await _postWithRetry(
        uri: uri,
        apiKey: apiKey,
        body: jsonEncode(body),
      );
    } on TimeoutException {
      throw const AiNetworkError('หมดเวลารอการตอบกลับจาก Google AI Studio');
    } on SocketException {
      throw const AiNetworkError('เชื่อมต่อ Google AI Studio ไม่ได้');
    } on http.ClientException {
      throw const AiNetworkError('เชื่อมต่อ Google AI Studio ไม่ได้');
    }
    final requestId =
        response.headers['x-goog-request-id'] ??
        response.headers['x-request-id'];
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AiRequestError(
        provider: AiProvider.googleAiStudio,
        statusCode: response.statusCode,
        requestId: requestId,
      );
    }
    try {
      return _GoogleAiResponse(
        body: jsonDecode(response.body) as Map<String, dynamic>,
        requestId: requestId,
      );
    } catch (_) {
      throw AiInvalidResponse(
        provider: AiProvider.googleAiStudio,
        requestId: requestId,
      );
    }
  }

  Future<http.Response> _postWithRetry({
    required Uri uri,
    required String apiKey,
    required String body,
  }) async {
    for (var attempt = 0; ; attempt++) {
      final response = await _client
          .post(
            uri,
            headers: {
              'x-goog-api-key': apiKey,
              HttpHeaders.contentTypeHeader: 'application/json',
            },
            body: body,
          )
          .timeout(const Duration(seconds: 60));
      if (!_isRetryable(response.statusCode) ||
          attempt >= _retryDelays.length) {
        return response;
      }
      await Future<void>.delayed(_retryDelays[attempt]);
    }
  }

  bool _isRetryable(int statusCode) =>
      statusCode == 408 || statusCode == 429 || statusCode >= 500;
}

class _GoogleAiResponse {
  const _GoogleAiResponse({required this.body, required this.requestId});

  final Map<String, dynamic> body;
  final String? requestId;
}
