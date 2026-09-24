import 'package:flutter/foundation.dart';

enum AppConfigProblem { missingOrInvalidUrl, insecureReleaseUrl }

class AppConfig {
  const AppConfig({required this.webAppUrl, this.requireHttps = kReleaseMode});

  factory AppConfig.fromEnvironment() {
    return const AppConfig(webAppUrl: String.fromEnvironment('WEB_APP_URL'));
  }

  final String webAppUrl;
  final bool requireHttps;

  AppConfigProblem? get problem {
    final uri = Uri.tryParse(webAppUrl);
    if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
      return AppConfigProblem.missingOrInvalidUrl;
    }
    if (uri.scheme == 'http' && requireHttps) {
      return AppConfigProblem.insecureReleaseUrl;
    }
    if (uri.scheme != 'https' && uri.scheme != 'http') {
      return AppConfigProblem.missingOrInvalidUrl;
    }
    return null;
  }

  Uri? get webAppUri {
    if (problem != null) return null;
    return Uri.parse(webAppUrl);
  }

  bool get isValid => webAppUri != null;

  String? get securityLogMessage {
    final uri = Uri.tryParse(webAppUrl);
    if (uri?.scheme != 'http') return null;
    if (requireHttps) {
      return 'Blocked insecure WEB_APP_URL. Release builds require HTTPS.';
    }
    return 'WARNING: WEB_APP_URL uses HTTP. This is allowed only because the '
        'app is not a release build.';
  }
}
