import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/ai/ai_provider.dart';
import 'package:ngern_pai_nai/ai/ai_settings.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('uses existing OpenAI settings when no provider was stored', () async {
    SharedPreferences.setMockInitialValues({
      'openai_model': 'gpt-6-sol',
      'openai_key_verified': true,
    });
    FlutterSecureStorage.setMockInitialValues({
      'openai_api_key': 'existing-openai-key',
    });

    final settings = await AiSettingsStore().read();

    expect(settings.provider, AiProvider.openAi);
    expect(settings.hasKey, isTrue);
    expect(settings.isVerified, isTrue);
    expect(settings.model, 'gpt-6-sol');
  });

  test(
    'keeps each provider key and model when the active provider changes',
    () async {
      final store = AiSettingsStore();
      await store.save(
        provider: AiProvider.openAi,
        apiKey: 'openai-key',
        model: 'gpt-6-luna',
        verified: true,
      );
      await store.save(
        provider: AiProvider.googleAiStudio,
        apiKey: 'google-key',
        model: 'gemini-3.7-flash',
        verified: true,
      );

      final active = await store.read();
      final openAi = await store.readProvider(AiProvider.openAi);

      expect(active.provider, AiProvider.googleAiStudio);
      expect(active.model, 'gemini-3.7-flash');
      expect(await store.readApiKey(active.provider), 'google-key');
      expect(openAi.model, 'gpt-6-luna');
      expect(await store.readApiKey(AiProvider.openAi), 'openai-key');
    },
  );

  test('can save an unverified provider without making it active', () async {
    final store = AiSettingsStore();
    await store.save(
      provider: AiProvider.openAi,
      apiKey: 'openai-key',
      model: 'gpt-6-luna',
      verified: true,
    );

    await store.save(
      provider: AiProvider.googleAiStudio,
      apiKey: 'google-key',
      model: 'gemini-3.8-flash',
      verified: false,
      activate: false,
    );

    expect((await store.read()).provider, AiProvider.openAi);
    final google = await store.readProvider(AiProvider.googleAiStudio);
    expect(google.hasKey, isTrue);
    expect(google.isVerified, isFalse);
  });
}
