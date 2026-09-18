class AppConfig {
  const AppConfig({required this.webAppUrl});

  factory AppConfig.fromEnvironment() {
    return const AppConfig(webAppUrl: String.fromEnvironment('WEB_APP_URL'));
  }

  final String webAppUrl;

  Uri? get webAppUri {
    final uri = Uri.tryParse(webAppUrl);
    if (uri == null || !uri.hasScheme || !uri.hasAuthority) return null;
    if (uri.scheme != 'https' && uri.scheme != 'http') return null;
    return uri;
  }

  bool get isValid => webAppUri != null;
}
