import 'package:flutter/material.dart';

import 'app/ngern_pai_nai_app.dart';
import 'auth/google_auth_service.dart';
import 'bridge/bridge_controller.dart';
import 'config/app_config.dart';
import 'sheets/sheets_gateway.dart';
import 'storage/spreadsheet_store.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final auth = GoogleAuthService();
  final sheets = SheetsGateway(auth: auth, store: SpreadsheetStore());

  runApp(
    NgernPaiNaiApp(
      bridge: BridgeController(auth: auth, sheets: sheets),
      config: AppConfig.fromEnvironment(),
    ),
  );
}
