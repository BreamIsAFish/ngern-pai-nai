import 'package:googleapis/drive/v3.dart' as drive;
import 'package:googleapis/sheets/v4.dart' as sheets;
import 'package:uuid/uuid.dart';

import '../auth/google_auth_service.dart';
import '../storage/spreadsheet_store.dart';
import '../transactions/transaction.dart';

class SheetsGateway {
  SheetsGateway({
    required GoogleAuthService auth,
    required SpreadsheetStore store,
    Uuid uuid = const Uuid(),
  }) : _auth = auth,
       _store = store,
       _uuid = uuid;

  static const spreadsheetName = 'Ngern Pai Nai';
  static const worksheetName = 'Transactions';
  static const _headers = [
    'id',
    'occurred_at',
    'type',
    'amount',
    'currency',
    'category',
    'note',
    'created_at',
    'updated_at',
  ];

  final GoogleAuthService _auth;
  final SpreadsheetStore _store;
  final Uuid _uuid;

  Future<bool> hasStoredSpreadsheet(String accountId) async {
    return await _store.read(accountId) != null;
  }

  Future<String> bootstrap() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    if (account == null) throw const GoogleAuthRequired();

    final client = await _auth.authenticatedClient();
    try {
      final sheetsApi = sheets.SheetsApi(client);
      var spreadsheetId = await _store.read(account.id);

      if (spreadsheetId != null) {
        try {
          await sheetsApi.spreadsheets.get(spreadsheetId);
          await _ensureWorksheet(sheetsApi, spreadsheetId);
          return spreadsheetId;
        } catch (_) {
          await _store.delete(account.id);
          spreadsheetId = null;
        }
      }

      spreadsheetId = await _findSpreadsheet(drive.DriveApi(client));
      spreadsheetId ??= await _createSpreadsheet(sheetsApi);
      await _ensureWorksheet(sheetsApi, spreadsheetId);
      await _store.write(accountId: account.id, spreadsheetId: spreadsheetId);
      return spreadsheetId;
    } finally {
      client.close();
    }
  }

  Future<List<TransactionRecord>> listTransactions() async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final result = await sheets.SheetsApi(
        client,
      ).spreadsheets.values.get(spreadsheetId, '$worksheetName!A2:I');

      final records = <TransactionRecord>[];
      for (final row in result.values ?? const <List<Object?>>[]) {
        if (row.isEmpty || row.first.toString().isEmpty) continue;
        try {
          records.add(TransactionRecord.fromSheetRow(row));
        } on FormatException {
          continue;
        }
      }
      records.sort((a, b) => b.input.occurredAt.compareTo(a.input.occurredAt));
      return records;
    } finally {
      client.close();
    }
  }

  Future<TransactionRecord> createTransaction(TransactionInput input) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final now = DateTime.now().toUtc();
    final record = TransactionRecord(
      id: _uuid.v4(),
      input: input,
      createdAt: now,
      updatedAt: now,
    );
    final client = await _auth.authenticatedClient();
    try {
      await sheets.SheetsApi(client).spreadsheets.values.append(
        sheets.ValueRange(values: [record.toSheetRow()]),
        spreadsheetId,
        '$worksheetName!A:I',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
      );
      return record;
    } finally {
      client.close();
    }
  }

  Future<TransactionRecord> updateTransaction({
    required String id,
    required TransactionInput input,
  }) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final rows = await api.spreadsheets.values.get(
        spreadsheetId,
        '$worksheetName!A2:I',
      );
      final match = _findRecord(rows.values, id);
      final updated = TransactionRecord(
        id: id,
        input: input,
        createdAt: match.record.createdAt,
        updatedAt: DateTime.now().toUtc(),
      );
      await api.spreadsheets.values.update(
        sheets.ValueRange(values: [updated.toSheetRow()]),
        spreadsheetId,
        '$worksheetName!A${match.rowNumber}:I${match.rowNumber}',
        valueInputOption: 'RAW',
      );
      return updated;
    } finally {
      client.close();
    }
  }

  Future<void> deleteTransaction(String id) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final rows = await api.spreadsheets.values.get(
        spreadsheetId,
        '$worksheetName!A2:I',
      );
      final match = _findRecord(rows.values, id);
      final spreadsheet = await api.spreadsheets.get(spreadsheetId);
      final sheetId = spreadsheet.sheets
          ?.where((sheet) => sheet.properties?.title == worksheetName)
          .firstOrNull
          ?.properties
          ?.sheetId;
      if (sheetId == null) throw const SheetNotReady();

      await api.spreadsheets.batchUpdate(
        sheets.BatchUpdateSpreadsheetRequest(
          requests: [
            sheets.Request(
              deleteDimension: sheets.DeleteDimensionRequest(
                range: sheets.DimensionRange(
                  dimension: 'ROWS',
                  sheetId: sheetId,
                  startIndex: match.rowNumber - 1,
                  endIndex: match.rowNumber,
                ),
              ),
            ),
          ],
        ),
        spreadsheetId,
      );
    } finally {
      client.close();
    }
  }

  Future<String?> _findSpreadsheet(drive.DriveApi driveApi) async {
    final result = await driveApi.files.list(
      q: "name = '$spreadsheetName' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      spaces: 'drive',
      $fields: 'files(id,name)',
      pageSize: 10,
    );
    return result.files?.where((file) => file.id != null).firstOrNull?.id;
  }

  Future<String> _createSpreadsheet(sheets.SheetsApi api) async {
    final spreadsheet = await api.spreadsheets.create(
      sheets.Spreadsheet(
        properties: sheets.SpreadsheetProperties(title: spreadsheetName),
        sheets: [
          sheets.Sheet(
            properties: sheets.SheetProperties(title: worksheetName),
          ),
        ],
      ),
      $fields: 'spreadsheetId',
    );
    final id = spreadsheet.spreadsheetId;
    if (id == null) throw const SheetNotReady();
    return id;
  }

  Future<void> _ensureWorksheet(
    sheets.SheetsApi api,
    String spreadsheetId,
  ) async {
    var spreadsheet = await api.spreadsheets.get(spreadsheetId);
    final exists =
        spreadsheet.sheets?.any(
          (sheet) => sheet.properties?.title == worksheetName,
        ) ??
        false;

    if (!exists) {
      await api.spreadsheets.batchUpdate(
        sheets.BatchUpdateSpreadsheetRequest(
          requests: [
            sheets.Request(
              addSheet: sheets.AddSheetRequest(
                properties: sheets.SheetProperties(title: worksheetName),
              ),
            ),
          ],
        ),
        spreadsheetId,
      );
      spreadsheet = await api.spreadsheets.get(spreadsheetId);
    }

    final header = await api.spreadsheets.values.get(
      spreadsheetId,
      '$worksheetName!A1:I1',
    );
    if (header.values?.firstOrNull?.join(',') != _headers.join(',')) {
      await api.spreadsheets.values.update(
        sheets.ValueRange(values: [_headers]),
        spreadsheetId,
        '$worksheetName!A1:I1',
        valueInputOption: 'RAW',
      );
    }
  }

  Future<String> _requireSpreadsheetId() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    if (account == null) throw const GoogleAuthRequired();
    final id = await _store.read(account.id);
    if (id == null) throw const SheetNotReady();
    return id;
  }

  _SheetRow _findRecord(List<List<Object?>>? rows, String id) {
    final values = rows ?? const <List<Object?>>[];
    for (var index = 0; index < values.length; index++) {
      final row = values[index];
      if (row.isNotEmpty && row.first.toString() == id) {
        return _SheetRow(
          record: TransactionRecord.fromSheetRow(row),
          rowNumber: index + 2,
        );
      }
    }
    throw const TransactionNotFound();
  }
}

class _SheetRow {
  const _SheetRow({required this.record, required this.rowNumber});

  final TransactionRecord record;
  final int rowNumber;
}

class SheetNotReady implements Exception {
  const SheetNotReady();
}

class TransactionNotFound implements Exception {
  const TransactionNotFound();
}
