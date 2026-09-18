import 'dart:convert';

import '../auth/google_auth_service.dart';
import '../sheets/sheets_gateway.dart';
import '../transactions/transaction.dart';
import 'bridge_message.dart';

class BridgeController {
  const BridgeController({
    required GoogleAuthService auth,
    required SheetsGateway sheets,
  }) : _auth = auth,
       _sheets = sheets;

  final GoogleAuthService _auth;
  final SheetsGateway _sheets;

  Future<BridgeResponse> handleMessage(String message) async {
    var requestId = 'unknown';
    try {
      final decoded = jsonDecode(message);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Invalid bridge request.');
      }
      final request = BridgeRequest.fromJson(decoded);
      requestId = request.id;
      final data = await _route(request);
      return BridgeResponse.success(id: request.id, data: data);
    } on GoogleAuthCancelled {
      return _failure(
        requestId,
        'AUTH_CANCELLED',
        'Google connection was cancelled.',
      );
    } on GoogleAuthRequired {
      return _failure(
        requestId,
        'AUTH_REQUIRED',
        'Connect Google to continue.',
      );
    } on SheetNotReady {
      return _failure(
        requestId,
        'SHEET_NOT_READY',
        'Set up your Google Sheet first.',
      );
    } on TransactionNotFound {
      return _failure(
        requestId,
        'NOT_FOUND',
        'That transaction no longer exists.',
      );
    } on FormatException {
      return _failure(
        requestId,
        'INVALID_REQUEST',
        'Check the transaction details and try again.',
      );
    } catch (_) {
      return _failure(
        requestId,
        'UNEXPECTED',
        'Something went wrong. Please try again.',
      );
    }
  }

  Future<Object?> _route(BridgeRequest request) async {
    return switch (request.operation) {
      'app.getStatus' => _status(),
      'google.signIn' => _signIn(),
      'google.signOut' => _signOut(),
      'sheet.bootstrap' => _bootstrapSheet(),
      'transactions.list' => _listTransactions(),
      'transactions.create' => _createTransaction(request.payload),
      'transactions.update' => _updateTransaction(request.payload),
      'transactions.delete' => _deleteTransaction(request.payload),
      _ => throw const FormatException('Unsupported bridge operation.'),
    };
  }

  Future<Map<String, dynamic>> _status() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    final sheetReady =
        account != null && await _sheets.hasStoredSpreadsheet(account.id);
    return {
      'signedIn': account != null,
      'sheetReady': sheetReady,
      if (account != null) 'accountEmail': account.email,
      if (sheetReady) 'spreadsheetName': SheetsGateway.spreadsheetName,
    };
  }

  Future<Map<String, dynamic>> _signIn() async {
    await _auth.signIn();
    return _status();
  }

  Future<Map<String, dynamic>> _signOut() async {
    await _auth.signOut();
    return {'signedIn': false, 'sheetReady': false};
  }

  Future<Map<String, dynamic>> _bootstrapSheet() async {
    await _sheets.bootstrap();
    return _status();
  }

  Future<List<Map<String, dynamic>>> _listTransactions() async {
    return (await _sheets.listTransactions())
        .map((record) => record.toJson())
        .toList();
  }

  Future<Map<String, dynamic>> _createTransaction(
    Map<String, dynamic> payload,
  ) async {
    final input = TransactionInput.fromJson(_transactionPayload(payload));
    return (await _sheets.createTransaction(input)).toJson();
  }

  Future<Map<String, dynamic>> _updateTransaction(
    Map<String, dynamic> payload,
  ) async {
    final id = payload['id'];
    if (id is! String || id.isEmpty) throw const FormatException('Missing ID.');
    final input = TransactionInput.fromJson(_transactionPayload(payload));
    return (await _sheets.updateTransaction(id: id, input: input)).toJson();
  }

  Future<Map<String, dynamic>> _deleteTransaction(
    Map<String, dynamic> payload,
  ) async {
    final id = payload['id'];
    if (id is! String || id.isEmpty) throw const FormatException('Missing ID.');
    await _sheets.deleteTransaction(id);
    return {'id': id};
  }

  Map<String, dynamic> _transactionPayload(Map<String, dynamic> payload) {
    final transaction = payload['transaction'];
    if (transaction is! Map) {
      throw const FormatException('Missing transaction.');
    }
    return Map<String, dynamic>.from(transaction);
  }

  BridgeResponse _failure(String id, String code, String message) {
    return BridgeResponse.failure(
      id: id,
      error: BridgeError(code: code, message: message),
    );
  }
}
