import 'package:flutter/material.dart';

import '../bridge/bridge_controller.dart';
import '../config/app_config.dart';
import '../ui/config_error_view.dart';
import '../webview/webview_page.dart';

class NgernPaiNaiApp extends StatelessWidget {
  const NgernPaiNaiApp({required this.bridge, required this.config, super.key});

  final BridgeController bridge;
  final AppConfig config;

  @override
  Widget build(BuildContext context) {
    final webAppUri = config.webAppUri;
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Ngern Pai Nai',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1F5A46),
          surface: const Color(0xFFF4F0E8),
        ),
        scaffoldBackgroundColor: const Color(0xFFF4F0E8),
        useMaterial3: true,
      ),
      home: webAppUri == null
          ? ConfigErrorView(problem: config.problem!)
          : WebViewPage(bridge: bridge, webAppUri: webAppUri),
    );
  }
}
