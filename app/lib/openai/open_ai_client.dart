import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../receipts/receipt_extraction.dart';

class OpenAiClient {
  OpenAiClient({http.Client? client}) : _client = client ?? http.Client();

  static final _responsesUri = Uri.parse('https://api.openai.com/v1/responses');
  final http.Client _client;

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

  Future<ReceiptExtraction> extractReceipt({
    required String apiKey,
    required String model,
    required File image,
  }) async {
    final mimeType = _imageMimeType(image.path);
    if (mimeType == null) throw const OpenAiInvalidImage();
    final imageData = base64Encode(await image.readAsBytes());
    final response = await _postResponse(
      apiKey: apiKey,
      body: {
        'model': model,
        'store': false,
        'max_output_tokens': 800,
        'instructions': _receiptInstructions,
        'input': [
          {
            'role': 'user',
            'content': [
              {
                'type': 'input_text',
                'text': 'อ่านใบเสร็จภาษาไทยหนึ่งใบจากรูปนี้',
              },
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
            'schema': _receiptSchema,
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
      throw OpenAiInvalidResponse(requestId: response.requestId);
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
      throw const OpenAiNetworkError('หมดเวลารอการตอบกลับจาก OpenAI');
    } on SocketException {
      throw const OpenAiNetworkError('เชื่อมต่อ OpenAI ไม่ได้');
    } on http.ClientException {
      throw const OpenAiNetworkError('เชื่อมต่อ OpenAI ไม่ได้');
    }
    final requestId = response.headers['x-request-id'];
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw OpenAiRequestError(
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
      throw OpenAiInvalidResponse(requestId: requestId);
    }
  }
}

const _receiptInstructions = '''
อ่านเฉพาะใบเสร็จซื้อสินค้าหรือบริการภาษาไทยหนึ่งใบจากรูป ห้ามเดาข้อมูลที่อ่านไม่ออก
- valid_purchase เป็น true เฉพาะใบเสร็จซื้อปกติที่มีเงินรวมสุทธิเป็นเงินบาทชัดเจน
- amount คือยอดสุทธิที่จ่ายจริงหลังส่วนลด ภาษี และค่าบริการ ห้ามใช้ยอดก่อนรวม เงินสดรับ เงินทอน รหัสอนุมัติ หรือคะแนนสะสม
- currency ต้องเป็น THB เมื่อระบุสกุลเงินได้ชัดเจน มิฉะนั้นเป็น null
- receipt_date ใช้รูปแบบ YYYY-MM-DD และแปลงปีพุทธศักราชเป็นคริสต์ศักราช หากอ่านไม่ได้หรือกำกวมให้เป็น null
- receipt_time ใช้รูปแบบ HH:mm:ss หากไม่มีเวลาให้เป็น null
- transaction_number ใช้เฉพาะเลขที่รายการ ห้ามใช้เลขใบกำกับภาษี เลขใบเสร็จ รหัสอนุมัติ เลขผู้เสียภาษี เบอร์โทร หรือเลขบัตร
- merchant_name คือชื่อร้านหรือผู้ขาย
- note เป็นสรุปรายการสินค้าที่มองเห็นได้เป็นภาษาไทยไม่เกิน 100 ตัวอักษร หากอ่านรายการไม่ได้ให้เป็น null
- หากเป็นเอกสารคืนเงิน ยกเลิก หลายใบในรูปเดียว หรือไม่ใช่ใบเสร็จซื้อปกติ ให้ valid_purchase เป็น false
''';

const _receiptSchema = {
  'type': 'object',
  'additionalProperties': false,
  'properties': {
    'valid_purchase': {'type': 'boolean'},
    'unsupported_reason': {
      'type': ['string', 'null'],
    },
    'merchant_name': {
      'type': ['string', 'null'],
    },
    'note': {
      'type': ['string', 'null'],
    },
    'amount': {
      'type': ['number', 'null'],
    },
    'currency': {
      'type': ['string', 'null'],
    },
    'receipt_date': {
      'type': ['string', 'null'],
    },
    'receipt_time': {
      'type': ['string', 'null'],
    },
    'transaction_number': {
      'type': ['string', 'null'],
    },
  },
  'required': [
    'valid_purchase',
    'unsupported_reason',
    'merchant_name',
    'note',
    'amount',
    'currency',
    'receipt_date',
    'receipt_time',
    'transaction_number',
  ],
};

String? _imageMimeType(String path) {
  final extension = path.split('.').last.toLowerCase();
  return const {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  }[extension];
}

class _OpenAiResponse {
  const _OpenAiResponse({required this.body, required this.requestId});
  final Map<String, dynamic> body;
  final String? requestId;
}

class OpenAiNetworkError implements Exception {
  const OpenAiNetworkError(this.message);
  final String message;
}

class OpenAiRequestError implements Exception {
  const OpenAiRequestError({required this.statusCode, this.requestId});
  final String? requestId;
  final int statusCode;

  String get thaiMessage => switch (statusCode) {
    401 => 'API key ไม่ถูกต้อง',
    403 => 'บัญชีนี้ไม่มีสิทธิ์ใช้โมเดลที่เลือก',
    429 => 'OpenAI ปฏิเสธคำขอเนื่องจากโควต้าหรือคำขอมากเกินไป',
    >= 500 => 'OpenAI ขัดข้องชั่วคราว',
    _ => 'OpenAI ไม่สามารถประมวลผลคำขอนี้ได้',
  };
}

class OpenAiInvalidImage implements Exception {
  const OpenAiInvalidImage();
}

class OpenAiInvalidResponse implements Exception {
  const OpenAiInvalidResponse({this.requestId});
  final String? requestId;
}
