import 'package:flutter/material.dart';

import 'ai/ai_provider.dart';
import 'ai/ai_response_logger.dart';
import 'ai/ai_settings.dart';
import 'ai/ai_settings_page.dart';
import 'ai/receipt_ai_client.dart';
import 'app/ngern_pai_nai_app.dart';
import 'auth/google_auth_service.dart';
import 'bridge/bridge_controller.dart';
import 'config/app_config.dart';
import 'google_ai/google_ai_client.dart';
import 'openai/open_ai_client.dart';
import 'receipts/receipt_image_store.dart';
import 'receipts/receipt_import_service.dart';
import 'receipts/receipt_batch_progress_store.dart';
import 'sheets/sheets_gateway.dart';
import 'storage/spreadsheet_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final config = AppConfig.fromEnvironment();
  final aiResponseLogger = AiResponseLogger.forDevelopment(
    webAppUri: config.webAppUri,
  );
  final auth = GoogleAuthService();
  final sheets = SheetsGateway(auth: auth, store: SpreadsheetStore());
  final aiClients = <AiProvider, ReceiptAiClient>{
    AiProvider.openAi: OpenAiClient(responseLogger: aiResponseLogger),
    AiProvider.googleAiStudio: GoogleAiClient(responseLogger: aiResponseLogger),
  };
  final aiSettings = AiSettingsStore();
  final receiptImages = ReceiptImageStore();
  final receiptProgress = ReceiptBatchProgressStore();
  await receiptImages.cleanupStaleFiles();
  final receiptImports = ReceiptImportService(
    clients: aiClients,
    images: receiptImages,
    progress: receiptProgress,
    settings: aiSettings,
    sheets: sheets,
  );
  final navigatorKey = GlobalKey<NavigatorState>();
  final securityLogMessage = config.securityLogMessage;
  if (securityLogMessage != null) {
    debugPrint('[AppConfig] $securityLogMessage');
  }

  Future<void> openSettings() async {
    final context = navigatorKey.currentContext;
    if (context == null) throw StateError('Navigator is not ready.');
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AiSettingsPage(clients: aiClients, store: aiSettings),
      ),
    );
  }

  runApp(
    NgernPaiNaiApp(
      bridge: BridgeController(
        auth: auth,
        sheets: sheets,
        aiSettings: aiSettings,
        openSettings: openSettings,
        receiptImports: receiptImports,
        receiptProgress: receiptProgress,
      ),
      config: config,
      navigatorKey: navigatorKey,
    ),
  );
}
