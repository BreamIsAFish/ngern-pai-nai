import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../bridge/bridge_controller.dart';

class WebViewPage extends StatefulWidget {
  const WebViewPage({required this.bridge, required this.webAppUri, super.key});

  final BridgeController bridge;
  final Uri webAppUri;

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    if (Platform.isAndroid) {
      unawaited(AndroidWebViewController.enableDebugging(!kReleaseMode));
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF4F0E8))
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: _handleBridgeMessage,
      )
      ..setNavigationDelegate(
        NavigationDelegate(onNavigationRequest: _handleNavigation),
      )
      ..loadRequest(widget.webAppUri);
  }

  Future<void> _handleBridgeMessage(JavaScriptMessage message) async {
    final response = await widget.bridge.handleMessage(message.message);
    final responseString = jsonEncode(response.toJson());
    final safeJavaScriptString = jsonEncode(responseString);
    await _controller.runJavaScript(
      'window.NgernPaiNaiBridge?.receive($safeJavaScriptString);',
    );
  }

  NavigationDecision _handleNavigation(NavigationRequest request) {
    final target = Uri.tryParse(request.url);
    if (target == null) return NavigationDecision.prevent;
    if (_isAllowedOrigin(target)) return NavigationDecision.navigate;

    if (target.scheme == 'http' ||
        target.scheme == 'https' ||
        target.scheme == 'mailto' ||
        target.scheme == 'tel') {
      unawaited(launchUrl(target, mode: LaunchMode.externalApplication));
    }
    return NavigationDecision.prevent;
  }

  bool _isAllowedOrigin(Uri target) {
    final allowed = widget.webAppUri;
    return target.scheme == allowed.scheme &&
        target.host == allowed.host &&
        target.port == allowed.port;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
