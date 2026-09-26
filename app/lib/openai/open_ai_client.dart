import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../ai/ai_provider.dart';
import '../ai/receipt_ai_client.dart';
import '../ai/receipt_ai_prompt.dart';
import '../receipts/receipt_extraction.dart';

class OpenAiClient implements ReceiptAiClient {
  OpenAiClient({http.Client? client}) : _client = client ?? http.Client();

  static final _responsesUri = Uri.parse('https://api.openai.com/v1/responses');
  final http.Client _client;

  @override
  Future<void> validateKey({
    required String apiKey,
    required String model,
  }) async {
    await _postResponse(
      apiKey: apiKey,
      body: {
        'model': model,
        'store': false,
        'max_output_tokens': 16,
        'input': 'ตอบคำว่า OK เท่านั้น',
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
    final imageData = base64Encode(await image.readAsBytes());
    final response = await _postResponse(
      apiKey: apiKey,
      body: {
        'model': model,
        'store': false,
        'max_output_tokens': 800,
        'instructions': receiptInstructions,
        'input': [
          {
            'role': 'user',
            'content': [
              {'type': 'input_text', 'text': receiptImagePrompt},
              {
                'type': 'input_image',
                'image_url': 'data:$mimeType;base64,$imageData',
                'detail': 'high',
              },
            ],
          },
        ],
        'text': {
          'format': {
            'type': 'json_schema',
            'name': 'thai_receipt',
            'strict': true,
            'schema': receiptSchema,
          },
        },
      },
    );
    try {
      final output = response.body['output'] as List<dynamic>;
      final message = output.cast<Map<String, dynamic>>().firstWhere(
        (item) => item['type'] == 'message',
      );
      final content = message['content'] as List<dynamic>;
      final outputText = content.cast<Map<String, dynamic>>().firstWhere(
        (item) => item['type'] == 'output_text',
      );
      return ReceiptExtraction.fromJson(
        jsonDecode(outputText['text'] as String) as Map<String, dynamic>,
      );
    } catch (_) {
      throw AiInvalidResponse(
        provider: AiProvider.openAi,
        requestId: response.requestId,
      );
    }
  }

  Future<_OpenAiResponse> _postResponse({
    required String apiKey,
    required Map<String, dynamic> body,
  }) async {
    http.Response response;
    try {
      response = await _client
          .post(
            _responsesUri,
            headers: {
              HttpHeaders.authorizationHeader: 'Bearer $apiKey',
              HttpHeaders.contentTypeHeader: 'application/json',
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 60));
    } on TimeoutException {
      throw const AiNetworkError('หมดเวลารอการตอบกลับจาก OpenAI');
    } on SocketException {
      throw const AiNetworkError('เชื่อมต่อ OpenAI ไม่ได้');
    } on http.ClientException {
      throw const AiNetworkError('เชื่อมต่อ OpenAI ไม่ได้');
    }
    final requestId = response.headers['x-request-id'];
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AiRequestError(
        provider: AiProvider.openAi,
        statusCode: response.statusCode,
        requestId: requestId,
      );
    }
    try {
      return _OpenAiResponse(
        body: jsonDecode(response.body) as Map<String, dynamic>,
        requestId: requestId,
      );
    } catch (_) {
      throw AiInvalidResponse(
        provider: AiProvider.openAi,
        requestId: requestId,
      );
    }
  }
}

class _OpenAiResponse {
  const _OpenAiResponse({required this.body, required this.requestId});
  final Map<String, dynamic> body;
  final String? requestId;
}
