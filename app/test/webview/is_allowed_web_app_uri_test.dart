import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/webview/is_allowed_web_app_uri.dart';

void main() {
  group('isAllowedWebAppUri', () {
    test('allows another path on the configured origin', () {
      expect(
        isAllowedWebAppUri(
          allowed: Uri.parse('https://money.example.com/app'),
          target: Uri.parse('https://money.example.com/settings?tab=sheet'),
        ),
        isTrue,
      );
    });

    test('rejects a different scheme, host, or port', () {
      final allowed = Uri.parse('https://money.example.com/app');
      for (final target in [
        Uri.parse('http://money.example.com/app'),
        Uri.parse('https://evil.example.com/app'),
        Uri.parse('https://money.example.com:444/app'),
      ]) {
        expect(isAllowedWebAppUri(allowed: allowed, target: target), isFalse);
      }
    });
  });
}
