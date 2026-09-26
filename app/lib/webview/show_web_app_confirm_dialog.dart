import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'is_allowed_web_app_uri.dart';

Future<bool> showWebAppConfirmDialog({
  required Uri allowed,
  required BuildContext context,
  required JavaScriptConfirmDialogRequest request,
}) async {
  final requestUri = Uri.tryParse(request.url);
  if (!context.mounted ||
      requestUri == null ||
      !isAllowedWebAppUri(allowed: allowed, target: requestUri)) {
    return false;
  }
  return await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('ยืนยัน'),
          content: Text(request.message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('ยกเลิก'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('ดำเนินการต่อ'),
            ),
          ],
        ),
      ) ??
      false;
}
