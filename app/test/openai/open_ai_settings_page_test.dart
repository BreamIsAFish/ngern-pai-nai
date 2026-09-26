import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/ai/ai_provider.dart';
import 'package:ngern_pai_nai/ai/ai_settings.dart';
import 'package:ngern_pai_nai/ai/ai_settings_page.dart';
import 'package:ngern_pai_nai/ai/receipt_ai_client.dart';
import 'package:ngern_pai_nai/openai/open_ai_client.dart';
import 'package:ngern_pai_nai/receipts/receipt_extraction.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('warns users how to limit the risk of a stored API key', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiSettingsPage(
          clients: {AiProvider.openAi: OpenAiClient()},
          store: AiSettingsStore(),
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
    expect(find.text('ผู้ให้บริการ'), findsOneWidget);
    expect(find.text('OpenAI'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('shows Google models after selecting Google AI Studio', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiSettingsPage(
          clients: {AiProvider.openAi: OpenAiClient()},
          store: AiSettingsStore(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('OpenAI'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Google AI Studio').last);
    await tester.pumpAndSettle();

    expect(find.text('gemini-3.8-flash'), findsOneWidget);
    expect(find.text('Google AI Studio API key'), findsOneWidget);
  });

  testWidgets('shows the active key as disabled until the user chooses edit', (
    tester,
  ) async {
    final store = AiSettingsStore();
    await store.save(
      provider: AiProvider.openAi,
      apiKey: 'saved-key',
      model: 'gpt-6-luna',
      verified: true,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: AiSettingsPage(
          clients: {AiProvider.openAi: _SuccessfulClient()},
          store: store,
        ),
      ),
    );
    await tester.pumpAndSettle();

    final keyField = tester.widget<TextField>(find.byType(TextField));
    final providerField = tester.widget<DropdownButtonFormField<AiProvider>>(
      find.byType(DropdownButtonFormField<AiProvider>),
    );
    expect(keyField.controller?.text, '••••');
    expect(keyField.enabled, isFalse);
    expect(providerField.onChanged, isNull);
    expect(find.text('OpenAI'), findsOneWidget);
    expect(find.text('แก้ไข API key'), findsOneWidget);
  });

  testWidgets('discards an edited key when the user cancels', (tester) async {
    final store = AiSettingsStore();
    await store.save(
      provider: AiProvider.openAi,
      apiKey: 'saved-key',
      model: 'gpt-6-luna',
      verified: true,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: AiSettingsPage(
          clients: {AiProvider.openAi: _SuccessfulClient()},
          store: store,
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('แก้ไข API key'));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'discarded-key');
    tester.testTextInput.hide();
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -400));
    await tester.pumpAndSettle();
    await tester.tap(find.text('ยกเลิก'));
    await tester.pumpAndSettle();

    expect(await store.readApiKey(AiProvider.openAi), 'saved-key');
    final keyField = tester.widget<TextField>(find.byType(TextField));
    expect(keyField.controller?.text, '••••');
    expect(keyField.enabled, isFalse);
  });

  testWidgets('stores an edited key only after validation succeeds', (
    tester,
  ) async {
    final store = AiSettingsStore();
    await store.save(
      provider: AiProvider.openAi,
      apiKey: 'saved-key',
      model: 'gpt-6-luna',
      verified: true,
    );
    final client = _SuccessfulClient();

    await tester.pumpWidget(
      MaterialApp(
        home: AiSettingsPage(
          clients: {AiProvider.openAi: client},
          store: store,
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('แก้ไข API key'));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'replacement-key');

    expect(await store.readApiKey(AiProvider.openAi), 'saved-key');

    await tester.tap(find.text('ตรวจสอบและบันทึก'));
    await tester.pumpAndSettle();

    expect(client.validatedApiKey, 'replacement-key');
    expect(await store.readApiKey(AiProvider.openAi), 'replacement-key');
    expect(tester.widget<TextField>(find.byType(TextField)).enabled, isFalse);
  });
}

class _SuccessfulClient implements ReceiptAiClient {
  String? validatedApiKey;

  @override
  Future<ReceiptExtraction> extractReceipt({
    required String apiKey,
    required String model,
    required File image,
  }) => throw UnimplementedError();

  @override
  Future<void> validateKey({
    required String apiKey,
    required String model,
  }) async {
    validatedApiKey = apiKey;
  }
}
