import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/config/app_config.dart';

void main() {
  group('AppConfig', () {
    test('accepts a complete HTTPS web app URL', () {
      const config = AppConfig(webAppUrl: 'https://money.example.com/app');

      expect(config.isValid, isTrue);
      expect(config.webAppUri?.host, 'money.example.com');
    });

    test('rejects missing, relative, and unsupported URLs', () {
      for (final value in ['', '/app', 'file:///tmp/app.html']) {
        expect(AppConfig(webAppUrl: value).isValid, isFalse);
      }
    });
  });
}
