import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'ai_provider.dart';

class AiSettings {
  const AiSettings({
    required this.provider,
    required this.hasKey,
    required this.isVerified,
    required this.model,
  });

  final AiProvider provider;
  final bool hasKey;
  final bool isVerified;
  final String model;

  Map<String, dynamic> toJson() => {
    'provider': provider.id,
    'providerName': provider.displayName,
    'configured': hasKey,
    'verified': isVerified,
    'model': model,
  };
}

class AiSettingsStore {
  AiSettingsStore({FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  static const _providerKey = 'ai_provider';
  static const _openAiApiKeyKey = 'openai_api_key';
  static const _openAiModelKey = 'openai_model';
  static const _openAiVerifiedKey = 'openai_key_verified';
  static const _googleApiKeyKey = 'google_ai_studio_api_key';
  static const _googleModelKey = 'google_ai_studio_model';
  static const _googleVerifiedKey = 'google_ai_studio_key_verified';
  static const _privacyNoticeKey = 'receipt_privacy_notice_seen';

  final FlutterSecureStorage _secureStorage;

  Future<String?> readApiKey(AiProvider provider) =>
      _secureStorage.read(key: _apiKeyKey(provider));

  Future<AiSettings> read() async {
    final preferences = await SharedPreferences.getInstance();
    return readProvider(AiProvider.parse(preferences.getString(_providerKey)));
  }

  Future<AiSettings> readProvider(AiProvider provider) async {
    final preferences = await SharedPreferences.getInstance();
    final key = await readApiKey(provider);
    final storedModel = preferences.getString(_modelKey(provider));
    return AiSettings(
      provider: provider,
      hasKey: key != null && key.isNotEmpty,
      isVerified:
          key != null &&
          key.isNotEmpty &&
          (preferences.getBool(_verifiedKey(provider)) ?? false),
      model: provider.models.contains(storedModel)
          ? storedModel!
          : provider.defaultModel,
    );
  }

  Future<void> save({
    required AiProvider provider,
    required String apiKey,
    required String model,
    required bool verified,
    bool activate = true,
  }) async {
    final normalizedKey = apiKey.trim();
    if (normalizedKey.isEmpty || !provider.models.contains(model)) {
      throw const FormatException('Invalid AI settings.');
    }
    final preferences = await SharedPreferences.getInstance();
    await _secureStorage.write(key: _apiKeyKey(provider), value: normalizedKey);
    await preferences.setString(_modelKey(provider), model);
    await preferences.setBool(_verifiedKey(provider), verified);
    if (activate) await preferences.setString(_providerKey, provider.id);
  }

  Future<void> deleteKey(AiProvider provider) async {
    final preferences = await SharedPreferences.getInstance();
    await _secureStorage.delete(key: _apiKeyKey(provider));
    await preferences.setBool(_verifiedKey(provider), false);
  }

  Future<bool> hasSeenPrivacyNotice() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_privacyNoticeKey) ?? false;
  }

  Future<void> markPrivacyNoticeSeen() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_privacyNoticeKey, true);
  }

  String _apiKeyKey(AiProvider provider) => switch (provider) {
    AiProvider.openAi => _openAiApiKeyKey,
    AiProvider.googleAiStudio => _googleApiKeyKey,
  };

  String _modelKey(AiProvider provider) => switch (provider) {
    AiProvider.openAi => _openAiModelKey,
    AiProvider.googleAiStudio => _googleModelKey,
  };

  String _verifiedKey(AiProvider provider) => switch (provider) {
    AiProvider.openAi => _openAiVerifiedKey,
    AiProvider.googleAiStudio => _googleVerifiedKey,
  };
}
