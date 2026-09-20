import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../auth/google_auth_service.dart';
import '../categories/category.dart';
import '../sheets/sheets_gateway.dart';
import '../tags/tag.dart';
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
      return BridgeResponse.success(
        id: request.id,
        data: await _route(request),
      );
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
    } on SheetFormatInvalid {
      return _failure(
        requestId,
        'SHEET_FORMAT_INVALID',
        'A Sheet tab has unexpected columns. Fix its header before continuing.',
      );
    } on TransactionNotFound {
      return _failure(
        requestId,
        'NOT_FOUND',
        'That transaction no longer exists.',
      );
    } on ItemNotFound {
      return _failure(requestId, 'NOT_FOUND', 'That item no longer exists.');
    } on ItemLocked {
      return _failure(
        requestId,
        'ITEM_LOCKED',
        'Default categories cannot be changed.',
      );
    } on ItemLimitReached {
      return _failure(
        requestId,
        'LIMIT_REACHED',
        'This list has reached its item limit.',
      );
    } on DuplicateName {
      return _failure(
        requestId,
        'DUPLICATE_NAME',
        'That name is already in use.',
      );
    } on FormatException {
      return _failure(
        requestId,
        'INVALID_REQUEST',
        'Check the details and try again.',
      );
    } catch (error, stackTrace) {
      if (kDebugMode) {
        debugPrint('[BridgeController] request $requestId failed: $error');
        debugPrintStack(stackTrace: stackTrace);
      }
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
      'sheet.restore' => _restoreSheet(),
      'sheet.createReplacement' => _createReplacementSheet(),
      'transactions.list' => _listTransactions(request.payload),
      'transactions.create' => _createTransaction(request.payload),
      'transactions.update' => _updateTransaction(request.payload),
      'transactions.delete' => _deleteTransaction(request.payload),
      'categories.list' => _listCategories(),
      'categories.create' => _createCategory(request.payload),
      'categories.update' => _updateCategory(request.payload),
      'categories.delete' => _deleteCategory(request.payload),
      'tags.list' => _listTags(),
      'tags.create' => _createTag(request.payload),
      'tags.update' => _updateTag(request.payload),
      'tags.delete' => _deleteTag(request.payload),
      _ => throw const FormatException('Unsupported bridge operation.'),
    };
  }

  Future<Map<String, dynamic>> _status() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    final spreadsheetId = account == null
        ? null
        : await _sheets.storedSpreadsheetId(account.id);
    final sheetReady = spreadsheetId != null;
    return {
      'signedIn': account != null,
      'sheetReady': sheetReady,
      if (account != null) 'accountEmail': account.email,
      if (sheetReady) 'spreadsheetName': SheetsGateway.spreadsheetName,
      if (spreadsheetId != null)
        'spreadsheetUrl': SheetsGateway.spreadsheetUrl(spreadsheetId),
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
    try {
      await _sheets.bootstrap();
      return await _status();
    } on SpreadsheetTrashed catch (error) {
      return {
        ...await _status(),
        'sheetReady': false,
        'spreadsheetTrashed': true,
        'spreadsheetName': SheetsGateway.spreadsheetName,
        'spreadsheetUrl': SheetsGateway.spreadsheetUrl(error.spreadsheetId),
      };
    }
  }

  Future<Map<String, dynamic>> _restoreSheet() async {
    await _sheets.restoreStoredSpreadsheet();
    return _status();
  }

  Future<Map<String, dynamic>> _createReplacementSheet() async {
    await _sheets.createReplacementSpreadsheet();
    return _status();
  }

  Future<Map<String, dynamic>> _listTransactions(
    Map<String, dynamic> payload,
  ) async {
    final months = _stringList(payload['utcMonths']);
    final result = await _sheets.listTransactions(months);
    return {
      'transactions': result.records.map((record) => record.toJson()).toList(),
      'skippedRows': result.skippedRows,
    };
  }

  Future<Map<String, dynamic>> _createTransaction(
    Map<String, dynamic> payload,
  ) async {
    final input = TransactionInput.fromJson(_object(payload, 'transaction'));
    return (await _sheets.createTransaction(input)).toJson();
  }

  Future<Map<String, dynamic>> _updateTransaction(
    Map<String, dynamic> payload,
  ) async {
    final id = _requiredString(payload, 'id');
    final sourceUtcMonth = _requiredString(payload, 'sourceUtcMonth');
    final input = TransactionInput.fromJson(_object(payload, 'transaction'));
    return (await _sheets.updateTransaction(
      id: id,
      sourceUtcMonth: sourceUtcMonth,
      input: input,
    )).toJson();
  }

  Future<Map<String, dynamic>> _deleteTransaction(
    Map<String, dynamic> payload,
  ) async {
    final id = _requiredString(payload, 'id');
    await _sheets.deleteTransaction(
      id: id,
      utcMonth: _requiredString(payload, 'utcMonth'),
    );
    return {'id': id};
  }

  Future<List<Map<String, dynamic>>> _listCategories() async =>
      (await _sheets.listCategories()).map((item) => item.toJson()).toList();
  Future<Map<String, dynamic>> _createCategory(
    Map<String, dynamic> payload,
  ) async => (await _sheets.createCategory(
    CategoryInput.fromJson(_object(payload, 'category')),
  )).toJson();
  Future<Map<String, dynamic>> _updateCategory(
    Map<String, dynamic> payload,
  ) async => (await _sheets.updateCategory(
    id: _requiredString(payload, 'id'),
    input: CategoryInput.fromJson(_object(payload, 'category')),
  )).toJson();
  Future<Map<String, dynamic>> _deleteCategory(
    Map<String, dynamic> payload,
  ) async {
    final id = _requiredString(payload, 'id');
    await _sheets.deleteCategory(id);
    return {'id': id};
  }

  Future<List<Map<String, dynamic>>> _listTags() async =>
      (await _sheets.listTags()).map((item) => item.toJson()).toList();
  Future<Map<String, dynamic>> _createTag(Map<String, dynamic> payload) async =>
      (await _sheets.createTag(
        TagInput.fromJson(_object(payload, 'tag')),
      )).toJson();
  Future<Map<String, dynamic>> _updateTag(Map<String, dynamic> payload) async =>
      (await _sheets.updateTag(
        id: _requiredString(payload, 'id'),
        input: TagInput.fromJson(_object(payload, 'tag')),
      )).toJson();
  Future<Map<String, dynamic>> _deleteTag(Map<String, dynamic> payload) async {
    final id = _requiredString(payload, 'id');
    await _sheets.deleteTag(id);
    return {'id': id};
  }

  Map<String, dynamic> _object(Map<String, dynamic> payload, String key) {
    final value = payload[key];
    if (value is! Map) throw const FormatException('Missing object.');
    return Map<String, dynamic>.from(value);
  }

  String _requiredString(Map<String, dynamic> payload, String key) {
    final value = payload[key];
    if (value is! String || value.isEmpty) {
      throw const FormatException('Missing value.');
    }
    return value;
  }

  List<String> _stringList(Object? value) {
    if (value is! List || value.any((item) => item is! String)) {
      throw const FormatException('Invalid list.');
    }
    return value.cast<String>();
  }

  BridgeResponse _failure(String id, String code, String message) =>
      BridgeResponse.failure(
        id: id,
        error: BridgeError(code: code, message: message),
      );
}
