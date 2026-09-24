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

    test('rejects HTTP when HTTPS is required for a release build', () {
      const config = AppConfig(
        webAppUrl: 'http://money.example.com',
        requireHttps: true,
      );

      expect(config.isValid, isFalse);
      expect(config.problem, AppConfigProblem.insecureReleaseUrl);
      expect(config.securityLogMessage, contains('Blocked insecure'));
    });

    test('allows HTTP with a clear warning outside release builds', () {
      const config = AppConfig(
        webAppUrl: 'http://10.0.2.2:5173',
        requireHttps: false,
      );

      expect(config.isValid, isTrue);
      expect(config.securityLogMessage, contains('WARNING'));
    });
  });
}
