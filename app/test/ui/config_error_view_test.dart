import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/ui/config_error_view.dart';

void main() {
  testWidgets('explains how to supply the missing web app URL', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ConfigErrorView()));

    expect(find.text('Web app URL missing'), findsOneWidget);
    expect(find.textContaining('--dart-define=WEB_APP_URL='), findsOneWidget);
  });
}
