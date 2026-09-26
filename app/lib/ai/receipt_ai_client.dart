import 'dart:io';

import '../receipts/receipt_extraction.dart';
import 'ai_provider.dart';

abstract interface class ReceiptAiClient {
  Future<void> validateKey({required String apiKey, required String model});

  Future<ReceiptExtraction> extractReceipt({
    required String apiKey,
    required String model,
    required File image,
  });
}

class AiNetworkError implements Exception {
  const AiNetworkError(this.message);

  final String message;
}

class AiRequestError implements Exception {
  const AiRequestError({
    required this.provider,
    required this.statusCode,
    this.requestId,
  });

  final AiProvider provider;
  final String? requestId;
  final int statusCode;

  String get thaiMessage => switch (statusCode) {
    400 => '${provider.displayName} ปฏิเสธ API key โมเดล หรือข้อมูลคำขอ',
    401 => 'API key ไม่ถูกต้อง',
    403 => 'API key นี้ไม่มีสิทธิ์ใช้โมเดลที่เลือก',
    429 => '${provider.displayName} ปฏิเสธคำขอเนื่องจากโควต้าหรือคำขอมากเกินไป',
    >= 500 => '${provider.displayName} ขัดข้องชั่วคราว',
    _ => '${provider.displayName} ไม่สามารถประมวลผลคำขอนี้ได้',
  };
}

class AiInvalidImage implements Exception {
  const AiInvalidImage();
}

class AiInvalidResponse implements Exception {
  const AiInvalidResponse({required this.provider, this.requestId});

  final AiProvider provider;
  final String? requestId;
}
