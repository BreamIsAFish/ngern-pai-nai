import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/ai/ai_provider.dart';
import 'package:ngern_pai_nai/ai/ai_settings.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_client.dart';
import 'package:ngern_pai_nai/auth/google_auth_service.dart';
import 'package:ngern_pai_nai/receipts/receipt_batch_progress_store.dart';
import 'package:ngern_pai_nai/receipts/receipt_extraction.dart';
import 'package:ngern_pai_nai/receipts/receipt_image_store.dart';
import 'package:ngern_pai_nai/receipts/receipt_import_service.dart';
import 'package:ngern_pai_nai/sheets/sheets_gateway.dart';
import 'package:ngern_pai_nai/storage/spreadsheet_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('routes receipt extraction through the active AI provider', () async {
    final settings = AiSettingsStore();
    await settings.save(
      provider: AiProvider.googleAiStudio,
      apiKey: 'google-key',
      model: 'gemini-3.8-flash',
      verified: true,
    );
    final openAi = _RecordingClient();
    final googleAi = _RecordingClient();
    final service = ReceiptImportService(
      clients: {AiProvider.openAi: openAi, AiProvider.googleAiStudio: googleAi},
      images: _TestReceiptImageStore(),
      progress: ReceiptBatchProgressStore(),
      settings: settings,
      sheets: SheetsGateway(
        auth: GoogleAuthService(),
        store: SpreadsheetStore(),
      ),
    );

    final result = await service.process(batchId: 'batch', imageId: 'image');

    expect(result['status'], 'failed');
    expect(result['message'], 'selected provider called');
    expect(openAi.extractCalls, 0);
    expect(googleAi.extractCalls, 1);
    expect(googleAi.lastApiKey, 'google-key');
    expect(googleAi.lastModel, 'gemini-3.8-flash');
  });
}

class _TestReceiptImageStore extends ReceiptImageStore {
  @override
  File requireImage({required String batchId, required String imageId}) =>
      File('receipt.jpg');
}

class _RecordingClient implements ReceiptAiClient {
  int extractCalls = 0;
  String? lastApiKey;
  String? lastModel;

  @override
  Future<ReceiptExtraction> extractReceipt({
    required String apiKey,
    required String model,
    required File image,
  }) async {
    extractCalls += 1;
    lastApiKey = apiKey;
    lastModel = model;
    throw const AiNetworkError('selected provider called');
  }

  @override
  Future<void> validateKey({
    required String apiKey,
    required String model,
  }) async {}
}
