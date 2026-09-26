import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/webview/show_web_app_confirm_dialog.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  testWidgets('shows a native confirmation for the configured web app', (
    tester,
  ) async {
    late BuildContext context;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (buildContext) {
            context = buildContext;
            return const SizedBox();
          },
        ),
      ),
    );

    final result = showWebAppConfirmDialog(
      allowed: Uri.parse('https://app.example.com'),
      context: context,
      request: const JavaScriptConfirmDialogRequest(
        message: 'ส่งรูปใบเสร็จไปยังผู้ให้บริการ AI?',
        url: 'https://app.example.com/receipts',
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ส่งรูปใบเสร็จไปยังผู้ให้บริการ AI?'), findsOneWidget);
    await tester.tap(find.text('ดำเนินการต่อ'));
    await tester.pumpAndSettle();
    expect(await result, isTrue);
  });

  testWidgets('rejects confirmations requested outside the configured origin', (
    tester,
  ) async {
    late BuildContext context;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (buildContext) {
            context = buildContext;
            return const SizedBox();
          },
        ),
      ),
    );

    final result = await showWebAppConfirmDialog(
      allowed: Uri.parse('https://app.example.com'),
      context: context,
      request: const JavaScriptConfirmDialogRequest(
        message: 'Untrusted confirmation',
        url: 'https://other.example.com',
      ),
    );

    expect(result, isFalse);
    expect(find.text('Untrusted confirmation'), findsNothing);
  });
}
