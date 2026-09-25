import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/openai/open_ai_client.dart';
import 'package:ngern_pai_nai/openai/open_ai_settings.dart';
import 'package:ngern_pai_nai/openai/open_ai_settings_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('warns users how to limit the risk of a stored API key', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});

    await tester.pumpWidget(
      MaterialApp(
        home: OpenAiSettingsPage(
          client: OpenAiClient(),
          store: OpenAiSettingsStore(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('คำเตือนเรื่อง API key'), findsOneWidget);
    expect(
      find.textContaining('Project API key แยกสำหรับแอปนี้'),
      findsOneWidget,
    );
    expect(find.textContaining('เพิกถอน key ทันที'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });
}
