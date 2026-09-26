import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'ai_provider.dart';

class AiResponseLogger {
  const AiResponseLogger.disabled() : _client = null, _endpoint = null;

  AiResponseLogger.forDevelopment({
    required Uri? webAppUri,
    http.Client? client,
    bool enabled = kDebugMode,
  }) : _client = enabled && webAppUri?.scheme == 'http'
           ? client ?? http.Client()
           : null,
       _endpoint = enabled && webAppUri?.scheme == 'http'
           ? webAppUri!.resolve('/__dev/ai-response-log')
           : null;

  final http.Client? _client;
  final Uri? _endpoint;

  /// Sends one raw provider response to the local development log endpoint.
  /// Logging failures never interrupt receipt processing.
  Future<void> write({
    required AiProvider provider,
    required String model,
    required String responseBody,
    required int statusCode,
    String? requestId,
  }) async {
    final client = _client;
    final endpoint = _endpoint;
    if (client == null || endpoint == null) return;
    try {
      final response = await client
          .post(
            endpoint,
            headers: {'content-type': 'application/json'},
            body: jsonEncode({
              'timestamp': DateTime.now().toUtc().toIso8601String(),
              'provider': provider.id,
              'model': model,
              'statusCode': statusCode,
              if (requestId != null) 'requestId': requestId,
              'response': responseBody,
            }),
          )
          .timeout(const Duration(seconds: 2));
      if (response.statusCode != 204) {
        debugPrint(
          '[AiResponseLogger] Development log endpoint returned '
          '${response.statusCode}.',
        );
      }
    } catch (error) {
      debugPrint('[AiResponseLogger] Could not write development log: $error');
    }
  }
}
