import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OpenAiSettings {
  const OpenAiSettings({
    required this.hasKey,
    required this.isVerified,
    required this.model,
  });

  final bool hasKey;
  final bool isVerified;
  final String model;

  Map<String, dynamic> toJson() => {
    'configured': hasKey,
    'verified': isVerified,
    'model': model,
  };
}

class OpenAiSettingsStore {
  OpenAiSettingsStore({FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  static const models = [
    'gpt-6-luna',
    'gpt-6-sol',
    'gpt-6-astra',
    'gpt-5.4-mini',
  ];
  static const defaultModel = 'gpt-6-luna';
  static const _apiKeyKey = 'openai_api_key';
  static const _modelKey = 'openai_model';
  static const _verifiedKey = 'openai_key_verified';
  static const _privacyNoticeKey = 'receipt_privacy_notice_seen';

  final FlutterSecureStorage _secureStorage;

  Future<String?> readApiKey() => _secureStorage.read(key: _apiKeyKey);

  Future<OpenAiSettings> read() async {
    final preferences = await SharedPreferences.getInstance();
    final key = await readApiKey();
    final storedModel = preferences.getString(_modelKey);
    return OpenAiSettings(
      hasKey: key != null && key.isNotEmpty,
      isVerified:
          key != null &&
          key.isNotEmpty &&
          (preferences.getBool(_verifiedKey) ?? false),
      model: models.contains(storedModel) ? storedModel! : defaultModel,
    );
  }

  Future<void> save({
    required String apiKey,
    required String model,
    required bool verified,
  }) async {
    final normalizedKey = apiKey.trim();
    if (normalizedKey.isEmpty || !models.contains(model)) {
      throw const FormatException('Invalid OpenAI settings.');
    }
    final preferences = await SharedPreferences.getInstance();
    await _secureStorage.write(key: _apiKeyKey, value: normalizedKey);
    await preferences.setString(_modelKey, model);
    await preferences.setBool(_verifiedKey, verified);
  }

  Future<void> deleteKey() async {
    final preferences = await SharedPreferences.getInstance();
    await _secureStorage.delete(key: _apiKeyKey);
    await preferences.setBool(_verifiedKey, false);
  }

  Future<bool> hasSeenPrivacyNotice() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_privacyNoticeKey) ?? false;
  }

  Future<void> markPrivacyNoticeSeen() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_privacyNoticeKey, true);
  }
}
