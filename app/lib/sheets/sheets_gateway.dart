import 'dart:async';

import 'package:googleapis/drive/v3.dart' as drive;
import 'package:googleapis/sheets/v4.dart' as sheets;
import 'package:uuid/uuid.dart';

import '../auth/google_auth_service.dart';
import '../categories/category.dart';
import '../categories/default_categories.dart';
import '../categories/reconcile_default_categories.dart';
import '../receipts/receipt_duplicate.dart';
import '../storage/spreadsheet_store.dart';
import '../tags/tag.dart';
import '../transactions/transaction.dart';

class SheetsGateway {
  SheetsGateway({
    required GoogleAuthService auth,
    required SpreadsheetStore store,
    Uuid uuid = const Uuid(),
  }) : _auth = auth,
       _store = store,
       _uuid = uuid;

  static const spreadsheetName = 'NgernPaiNai_data';
  static const categoriesSheet = 'Categories';
  static const tagsSheet = 'Tags';
  static const metadataSheet = '_Metadata';
  static const schemaVersion = '3';
  static const transactionHeaders = [
    'id',
    'date',
    'time',
    'type',
    'category',
    'tag',
    'amount',
    'note',
    'destination',
    'transaction_number',
    'source',
    'date_inferred',
    'created_at',
    'updated_at',
  ];
  static const categoryHeaders = [
    'id',
    'name',
    'type',
    'icon_url',
    'is_default',
    'created_at',
    'updated_at',
  ];
  static const tagHeaders = ['id', 'name', 'created_at', 'updated_at'];

  final GoogleAuthService _auth;
  final SpreadsheetStore _store;
  final Uuid _uuid;
  Future<void> _receiptWriteTail = Future<void>.value();

  Future<bool> hasStoredSpreadsheet(String accountId) async =>
      await _store.read(accountId) != null;

  Future<String?> storedSpreadsheetId(String accountId) =>
      _store.read(accountId);

  static String spreadsheetUrl(String spreadsheetId) =>
      'https://docs.google.com/spreadsheets/d/$spreadsheetId/edit';

  Future<String> bootstrap() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    if (account == null) throw const GoogleAuthRequired();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final driveApi = drive.DriveApi(client);
      var spreadsheetId = await _store.read(account.id);
      if (spreadsheetId != null) {
        try {
          final file =
              await driveApi.files.get(
                    spreadsheetId,
                    $fields: 'id,name,mimeType,trashed',
                  )
                  as drive.File;
          if (isFileTrashed(file)) throw SpreadsheetTrashed(spreadsheetId);
          await api.spreadsheets.get(spreadsheetId);
        } on SpreadsheetTrashed {
          rethrow;
        } catch (_) {
          await _store.delete(account.id);
          spreadsheetId = null;
        }
      }
      spreadsheetId ??= await _findSpreadsheet(driveApi);
      final isNew = spreadsheetId == null;
      spreadsheetId ??= await _createSpreadsheet(api);
      await _store.write(accountId: account.id, spreadsheetId: spreadsheetId);
      await _initializeSchema(api, spreadsheetId, allowReset: isNew);
      return spreadsheetId;
    } finally {
      client.close();
    }
  }

  Future<String> restoreStoredSpreadsheet() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    if (account == null) throw const GoogleAuthRequired();
    final spreadsheetId = await _store.read(account.id);
    if (spreadsheetId == null) throw const SheetNotReady();
    final client = await _auth.authenticatedClient();
    try {
      await drive.DriveApi(client).files.update(
        drive.File(trashed: false),
        spreadsheetId,
        $fields: 'id,trashed',
      );
    } finally {
      client.close();
    }
    return bootstrap();
  }

  Future<String> createReplacementSpreadsheet() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    if (account == null) throw const GoogleAuthRequired();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final spreadsheetId = await _createSpreadsheet(api);
      await _initializeSchema(api, spreadsheetId, allowReset: true);
      await _store.write(accountId: account.id, spreadsheetId: spreadsheetId);
      return spreadsheetId;
    } finally {
      client.close();
    }
  }

  static bool isFileTrashed(drive.File file) => file.trashed ?? false;

  Future<void> resetTransactionsForSchemaUpgrade() async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      await _initializeSchema(
        sheets.SheetsApi(client),
        spreadsheetId,
        allowReset: true,
      );
    } finally {
      client.close();
    }
  }

  Future<TransactionListResult> listTransactions(List<String> utcMonths) async {
    if (utcMonths.isEmpty ||
        utcMonths.length > 12 ||
        utcMonths.any((month) => !_validMonth(month))) {
      throw const FormatException('Invalid month range.');
    }
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final spreadsheet = await api.spreadsheets.get(spreadsheetId);
      final titles =
          spreadsheet.sheets
              ?.map((sheet) => sheet.properties?.title)
              .whereType<String>()
              .toSet() ??
          <String>{};
      final records = <TransactionRecord>[];
      var skippedRows = 0;
      for (final month in utcMonths.toSet()) {
        final title = transactionSheet(month);
        if (!titles.contains(title)) continue;
        await _validateHeader(api, spreadsheetId, title, transactionHeaders);
        final result = await api.spreadsheets.values.get(
          spreadsheetId,
          '$title!A2:N',
        );
        for (final row in result.values ?? const <List<Object?>>[]) {
          if (row.isEmpty || row.first.toString().isEmpty) continue;
          try {
            records.add(TransactionRecord.fromSheetRow(row));
          } on FormatException {
            skippedRows++;
          }
        }
      }
      records.sort(
        (a, b) => b.input.utcDateTime.compareTo(a.input.utcDateTime),
      );
      return TransactionListResult(records: records, skippedRows: skippedRows);
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
      final api = sheets.SheetsApi(client);
      final title = transactionSheet(input.utcMonth);
      await _ensureWorksheet(api, spreadsheetId, title, transactionHeaders);
      await api.spreadsheets.values.append(
        sheets.ValueRange(values: [record.toSheetRow()]),
        spreadsheetId,
        '$title!A:N',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
      );
      return record;
    } finally {
      client.close();
    }
  }

  Future<ReceiptTransactionCreateResult> createReceiptTransaction(
    TransactionInput input,
  ) {
    if (input.source != TransactionSource.receiptAi ||
        input.type != TransactionType.expense) {
      throw const FormatException('Invalid receipt transaction.');
    }
    final completer = Completer<ReceiptTransactionCreateResult>();
    _receiptWriteTail = _receiptWriteTail.catchError((_) {}).then((_) async {
      try {
        final duplicate = await findReceiptDuplicate(input);
        if (duplicate != null) {
          completer.complete(
            ReceiptTransactionCreateResult(duplicate: duplicate),
          );
          return;
        }
        completer.complete(
          ReceiptTransactionCreateResult(
            record: await createTransaction(input),
          ),
        );
      } catch (error, stackTrace) {
        completer.completeError(error, stackTrace);
      }
    });
    return completer.future;
  }

  Future<TransactionRecord?> findReceiptDuplicate(
    TransactionInput input, {
    String? ignoredId,
  }) async {
    if (normalizeReceiptTransactionNumber(input.transactionNumber) == null ||
        input.dateInferred) {
      return null;
    }
    final result = await listTransactions(
      utcMonthsCoveringLocalReceiptDate(input.utcDateTime),
    );
    for (final record in result.records) {
      if (record.id == ignoredId) continue;
      if (hasSameReceiptFingerprint(input, record.input)) {
        return record;
      }
    }
    return null;
  }

  Future<TransactionRecord> updateTransaction({
    required String id,
    required String sourceUtcMonth,
    required TransactionInput input,
  }) async {
    if (!_validMonth(sourceUtcMonth)) {
      throw const FormatException('Invalid source month.');
    }
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final sourceTitle = transactionSheet(sourceUtcMonth);
      await _validateHeader(
        api,
        spreadsheetId,
        sourceTitle,
        transactionHeaders,
      );
      final rows = await api.spreadsheets.values.get(
        spreadsheetId,
        '$sourceTitle!A2:N',
      );
      final match = _findTransaction(rows.values, id);
      if (input.source != match.record.input.source) {
        throw const FormatException('Transaction source cannot change.');
      }
      final updated = TransactionRecord(
        id: id,
        input: input,
        createdAt: match.record.createdAt,
        updatedAt: DateTime.now().toUtc(),
      );
      if (input.source == TransactionSource.receiptAi) {
        final duplicate = await findReceiptDuplicate(input, ignoredId: id);
        if (duplicate != null) throw ReceiptDuplicate(duplicate);
      }
      final targetTitle = transactionSheet(input.utcMonth);
      if (sourceTitle == targetTitle) {
        await api.spreadsheets.values.update(
          sheets.ValueRange(values: [updated.toSheetRow()]),
          spreadsheetId,
          '$sourceTitle!A${match.rowNumber}:N${match.rowNumber}',
          valueInputOption: 'RAW',
        );
      } else {
        await _ensureWorksheet(
          api,
          spreadsheetId,
          targetTitle,
          transactionHeaders,
        );
        await api.spreadsheets.values.append(
          sheets.ValueRange(values: [updated.toSheetRow()]),
          spreadsheetId,
          '$targetTitle!A:N',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
        );
        await _deleteRow(
          api: api,
          spreadsheetId: spreadsheetId,
          sheetTitle: sourceTitle,
          rowNumber: match.rowNumber,
        );
      }
      return updated;
    } finally {
      client.close();
    }
  }

  Future<void> deleteTransaction({
    required String id,
    required String utcMonth,
  }) async {
    if (!_validMonth(utcMonth)) throw const FormatException('Invalid month.');
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      final title = transactionSheet(utcMonth);
      await _validateHeader(api, spreadsheetId, title, transactionHeaders);
      final rows = await api.spreadsheets.values.get(
        spreadsheetId,
        '$title!A2:N',
      );
      final match = _findTransaction(rows.values, id);
      await _deleteRow(
        api: api,
        spreadsheetId: spreadsheetId,
        sheetTitle: title,
        rowNumber: match.rowNumber,
      );
    } finally {
      client.close();
    }
  }

  Future<List<CategoryRecord>> listCategories() async {
    final rows = await _readRows(
      categoriesSheet,
      'A2:G',
      headers: categoryHeaders,
    );
    return rows
        .where((row) => row.isNotEmpty)
        .map(CategoryRecord.fromSheetRow)
        .toList();
  }

  Future<CategoryRecord> createCategory(CategoryInput input) async {
    if (input.type == TransactionType.transfer) {
      throw const FormatException('Transfer category is fixed.');
    }
    final existing = await listCategories();
    _assertUniqueName(name: input.name, type: input.type, categories: existing);
    if (existing
            .where(
              (category) => !category.isDefault && category.type == input.type,
            )
            .length >=
        50) {
      throw const ItemLimitReached();
    }
    final now = DateTime.now().toUtc();
    final category = CategoryRecord(
      id: _uuid.v4(),
      name: input.name,
      type: input.type,
      iconUrl: input.iconUrl,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    );
    await _appendRow(categoriesSheet, 'A:G', category.toSheetRow());
    return category;
  }

  Future<CategoryRecord> updateCategory({
    required String id,
    required CategoryInput input,
  }) async {
    if (input.type == TransactionType.transfer) {
      throw const FormatException('Transfer category is fixed.');
    }
    final rows = await _readRows(
      categoriesSheet,
      'A2:G',
      headers: categoryHeaders,
    );
    final match = _findCategory(rows, id);
    if (match.record.isDefault) throw const ItemLocked();
    final categories = rows
        .where((row) => row.isNotEmpty)
        .map(CategoryRecord.fromSheetRow)
        .toList();
    _assertUniqueName(
      name: input.name,
      type: input.type,
      categories: categories,
      ignoredId: id,
    );
    final updated = CategoryRecord(
      id: id,
      name: input.name,
      type: input.type,
      iconUrl: input.iconUrl,
      isDefault: false,
      createdAt: match.record.createdAt,
      updatedAt: DateTime.now().toUtc(),
    );
    await _updateRow(
      categoriesSheet,
      'A',
      'G',
      match.rowNumber,
      updated.toSheetRow(),
    );
    return updated;
  }

  Future<void> deleteCategory(String id) async {
    final rows = await _readRows(
      categoriesSheet,
      'A2:G',
      headers: categoryHeaders,
    );
    final match = _findCategory(rows, id);
    if (match.record.isDefault) throw const ItemLocked();
    await _deleteKnownRow(categoriesSheet, match.rowNumber);
  }

  Future<List<TagRecord>> listTags() async {
    final rows = await _readRows(tagsSheet, 'A2:D', headers: tagHeaders);
    return rows
        .where((row) => row.isNotEmpty)
        .map(TagRecord.fromSheetRow)
        .toList();
  }

  Future<TagRecord> createTag(TagInput input) async {
    final existing = await listTags();
    if (existing.length >= 100) throw const ItemLimitReached();
    _assertUniqueTag(input.name, existing);
    final now = DateTime.now().toUtc();
    final tag = TagRecord(
      id: _uuid.v4(),
      name: input.name,
      createdAt: now,
      updatedAt: now,
    );
    await _appendRow(tagsSheet, 'A:D', tag.toSheetRow());
    return tag;
  }

  Future<TagRecord> updateTag({
    required String id,
    required TagInput input,
  }) async {
    final rows = await _readRows(tagsSheet, 'A2:D', headers: tagHeaders);
    final match = _findTag(rows, id);
    final tags = rows
        .where((row) => row.isNotEmpty)
        .map(TagRecord.fromSheetRow)
        .toList();
    _assertUniqueTag(input.name, tags, ignoredId: id);
    final updated = TagRecord(
      id: id,
      name: input.name,
      createdAt: match.record.createdAt,
      updatedAt: DateTime.now().toUtc(),
    );
    await _updateRow(
      tagsSheet,
      'A',
      'D',
      match.rowNumber,
      updated.toSheetRow(),
    );
    return updated;
  }

  Future<void> deleteTag(String id) async {
    final rows = await _readRows(tagsSheet, 'A2:D', headers: tagHeaders);
    final match = _findTag(rows, id);
    await _deleteKnownRow(tagsSheet, match.rowNumber);
  }

  static String transactionSheet(String utcMonth) => 'Transactions_$utcMonth';

  Future<void> _initializeSchema(
    sheets.SheetsApi api,
    String spreadsheetId, {
    required bool allowReset,
  }) async {
    final spreadsheet = await api.spreadsheets.get(spreadsheetId);
    final hasMetadata =
        spreadsheet.sheets?.any(
          (sheet) => sheet.properties?.title == metadataSheet,
        ) ??
        false;
    String? version;
    if (hasMetadata) {
      final values = await api.spreadsheets.values.get(
        spreadsheetId,
        '$metadataSheet!A1:B3',
      );
      for (final row in values.values ?? const <List<Object?>>[]) {
        if (row.length >= 2 && row[0].toString() == 'schema_version') {
          version = row[1].toString();
        }
      }
    }
    if (version != schemaVersion) {
      if (!allowReset) throw SchemaUpgradeRequired(version);
      await _resetSchema(api, spreadsheetId, hasMetadata: hasMetadata);
      return;
    }
    await _ensureWorksheet(
      api,
      spreadsheetId,
      categoriesSheet,
      categoryHeaders,
    );
    await _reconcileDefaultCategoryRows(api, spreadsheetId);
    await _ensureWorksheet(api, spreadsheetId, tagsSheet, tagHeaders);
    await _ensureWorksheet(
      api,
      spreadsheetId,
      transactionSheet(_currentUtcMonth()),
      transactionHeaders,
    );
  }

  Future<void> _reconcileDefaultCategoryRows(
    sheets.SheetsApi api,
    String spreadsheetId,
  ) async {
    final rows =
        (await api.spreadsheets.values.get(
          spreadsheetId,
          '$categoriesSheet!A2:G',
        )).values ??
        <List<Object?>>[];
    final records = <CategoryRecord>[];
    final rowNumbers = <int>[];
    for (var index = 0; index < rows.length; index++) {
      if (rows[index].isEmpty) continue;
      records.add(CategoryRecord.fromSheetRow(rows[index]));
      rowNumbers.add(index + 2);
    }
    final reconciliation = reconcileDefaultCategories(
      existing: records,
      updatedAt: DateTime.now().toUtc(),
    );
    final appendedRows = <List<Object?>>[];
    for (final index in reconciliation.changedIndexes) {
      final record = reconciliation.records[index];
      if (index >= rowNumbers.length) {
        appendedRows.add(record.toSheetRow());
        continue;
      }
      final rowNumber = rowNumbers[index];
      await api.spreadsheets.values.update(
        sheets.ValueRange(values: [record.toSheetRow()]),
        spreadsheetId,
        '$categoriesSheet!A$rowNumber:G$rowNumber',
        valueInputOption: 'RAW',
      );
    }
    if (appendedRows.isEmpty) return;
    await api.spreadsheets.values.append(
      sheets.ValueRange(values: appendedRows),
      spreadsheetId,
      '$categoriesSheet!A:G',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
    );
  }

  Future<void> _resetSchema(
    sheets.SheetsApi api,
    String spreadsheetId, {
    required bool hasMetadata,
  }) async {
    if (!hasMetadata) {
      await _addSheet(api, spreadsheetId, metadataSheet);
    }
    await _setSheetHidden(api, spreadsheetId, metadataSheet, hidden: false);
    final spreadsheet = await api.spreadsheets.get(spreadsheetId);
    final obsolete =
        spreadsheet.sheets
            ?.where((sheet) {
              final title = sheet.properties?.title ?? '';
              return title == 'Transactions' ||
                  title.startsWith('Transactions_');
            })
            .map((sheet) => sheet.properties?.sheetId)
            .whereType<int>()
            .toList() ??
        <int>[];
    if (obsolete.isNotEmpty) {
      await api.spreadsheets.batchUpdate(
        sheets.BatchUpdateSpreadsheetRequest(
          requests: obsolete
              .map(
                (id) => sheets.Request(
                  deleteSheet: sheets.DeleteSheetRequest(sheetId: id),
                ),
              )
              .toList(),
        ),
        spreadsheetId,
      );
    }
    await api.spreadsheets.values.clear(
      sheets.ClearValuesRequest(),
      spreadsheetId,
      '$metadataSheet!A:B',
    );
    await api.spreadsheets.values.update(
      sheets.ValueRange(
        values: [
          ['key', 'value'],
          ['schema_version', schemaVersion],
          ['initialized_at', DateTime.now().toUtc().toIso8601String()],
        ],
      ),
      spreadsheetId,
      '$metadataSheet!A1:B3',
      valueInputOption: 'RAW',
    );
    final remaining = await api.spreadsheets.get(spreadsheetId);
    final titles =
        remaining.sheets
            ?.map((sheet) => sheet.properties?.title)
            .whereType<String>()
            .toSet() ??
        <String>{};
    final categoriesExist = titles.contains(categoriesSheet);
    final tagsExist = titles.contains(tagsSheet);
    if (!categoriesExist) await _addSheet(api, spreadsheetId, categoriesSheet);
    if (!tagsExist) await _addSheet(api, spreadsheetId, tagsSheet);
    await _addSheet(api, spreadsheetId, transactionSheet(_currentUtcMonth()));
    if (categoriesExist) {
      await _validateHeader(
        api,
        spreadsheetId,
        categoriesSheet,
        categoryHeaders,
      );
    } else {
      await _writeHeader(api, spreadsheetId, categoriesSheet, categoryHeaders);
    }
    if (tagsExist) {
      await _validateHeader(api, spreadsheetId, tagsSheet, tagHeaders);
    } else {
      await _writeHeader(api, spreadsheetId, tagsSheet, tagHeaders);
    }
    await _writeHeader(
      api,
      spreadsheetId,
      transactionSheet(_currentUtcMonth()),
      transactionHeaders,
    );
    if (categoriesExist) {
      await _reconcileDefaultCategoryRows(api, spreadsheetId);
    } else {
      await api.spreadsheets.values.update(
        sheets.ValueRange(
          values: createDefaultCategories(
            DateTime.now().toUtc(),
          ).map((category) => category.toSheetRow()).toList(),
        ),
        spreadsheetId,
        '$categoriesSheet!A2:G',
        valueInputOption: 'RAW',
      );
    }
    await _setSheetHidden(api, spreadsheetId, metadataSheet, hidden: true);
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
            properties: sheets.SheetProperties(
              title: metadataSheet,
              hidden: false,
            ),
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
    String title,
    List<String> headers,
  ) async {
    final spreadsheet = await api.spreadsheets.get(spreadsheetId);
    final exists =
        spreadsheet.sheets?.any((sheet) => sheet.properties?.title == title) ??
        false;
    if (!exists) {
      await _addSheet(api, spreadsheetId, title);
      await _writeHeader(api, spreadsheetId, title, headers);
      return;
    }
    await _validateHeader(api, spreadsheetId, title, headers);
  }

  Future<void> _validateHeader(
    sheets.SheetsApi api,
    String spreadsheetId,
    String title,
    List<String> headers,
  ) async {
    final end = _columnFor(headers.length);
    final result = await api.spreadsheets.values.get(
      spreadsheetId,
      '$title!A1:${end}1',
    );
    if (result.values?.firstOrNull
            ?.map((value) => value.toString())
            .join(',') !=
        headers.join(',')) {
      throw SheetFormatInvalid(title);
    }
  }

  Future<void> _addSheet(
    sheets.SheetsApi api,
    String spreadsheetId,
    String title, {
    bool hidden = false,
  }) async {
    await api.spreadsheets.batchUpdate(
      sheets.BatchUpdateSpreadsheetRequest(
        requests: [
          sheets.Request(
            addSheet: sheets.AddSheetRequest(
              properties: sheets.SheetProperties(title: title, hidden: hidden),
            ),
          ),
        ],
      ),
      spreadsheetId,
    );
  }

  Future<void> _setSheetHidden(
    sheets.SheetsApi api,
    String spreadsheetId,
    String title, {
    required bool hidden,
  }) async {
    final spreadsheet = await api.spreadsheets.get(spreadsheetId);
    final sheetId = spreadsheet.sheets
        ?.where((sheet) => sheet.properties?.title == title)
        .firstOrNull
        ?.properties
        ?.sheetId;
    if (sheetId == null) throw const SheetNotReady();
    await api.spreadsheets.batchUpdate(
      sheets.BatchUpdateSpreadsheetRequest(
        requests: [
          sheets.Request(
            updateSheetProperties: sheets.UpdateSheetPropertiesRequest(
              fields: 'hidden',
              properties: sheets.SheetProperties(
                sheetId: sheetId,
                hidden: hidden,
              ),
            ),
          ),
        ],
      ),
      spreadsheetId,
    );
  }

  Future<void> _writeHeader(
    sheets.SheetsApi api,
    String spreadsheetId,
    String title,
    List<String> headers,
  ) async {
    await api.spreadsheets.values.update(
      sheets.ValueRange(values: [headers]),
      spreadsheetId,
      '$title!A1:${_columnFor(headers.length)}1',
      valueInputOption: 'RAW',
    );
  }

  Future<List<List<Object?>>> _readRows(
    String sheet,
    String range, {
    required List<String> headers,
  }) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      final api = sheets.SheetsApi(client);
      await _validateHeader(api, spreadsheetId, sheet, headers);
      return (await api.spreadsheets.values.get(
            spreadsheetId,
            '$sheet!$range',
          )).values ??
          <List<Object?>>[];
    } finally {
      client.close();
    }
  }

  Future<void> _appendRow(String sheet, String range, List<Object?> row) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      await sheets.SheetsApi(client).spreadsheets.values.append(
        sheets.ValueRange(values: [row]),
        spreadsheetId,
        '$sheet!$range',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
      );
    } finally {
      client.close();
    }
  }

  Future<void> _updateRow(
    String sheet,
    String firstColumn,
    String lastColumn,
    int rowNumber,
    List<Object?> row,
  ) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      await sheets.SheetsApi(client).spreadsheets.values.update(
        sheets.ValueRange(values: [row]),
        spreadsheetId,
        '$sheet!$firstColumn$rowNumber:$lastColumn$rowNumber',
        valueInputOption: 'RAW',
      );
    } finally {
      client.close();
    }
  }

  Future<void> _deleteKnownRow(String sheet, int rowNumber) async {
    final spreadsheetId = await _requireSpreadsheetId();
    final client = await _auth.authenticatedClient();
    try {
      await _deleteRow(
        api: sheets.SheetsApi(client),
        spreadsheetId: spreadsheetId,
        sheetTitle: sheet,
        rowNumber: rowNumber,
      );
    } finally {
      client.close();
    }
  }

  Future<void> _deleteRow({
    required sheets.SheetsApi api,
    required String spreadsheetId,
    required String sheetTitle,
    required int rowNumber,
  }) async {
    final spreadsheet = await api.spreadsheets.get(spreadsheetId);
    final sheetId = spreadsheet.sheets
        ?.where((sheet) => sheet.properties?.title == sheetTitle)
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
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              ),
            ),
          ),
        ],
      ),
      spreadsheetId,
    );
  }

  Future<String> _requireSpreadsheetId() async {
    final account = _auth.currentAccount ?? await _auth.restoreSession();
    if (account == null) throw const GoogleAuthRequired();
    final id = await _store.read(account.id);
    if (id == null) throw const SheetNotReady();
    return id;
  }

  _TransactionRow _findTransaction(List<List<Object?>>? rows, String id) {
    for (
      var index = 0;
      index < (rows ?? const <List<Object?>>[]).length;
      index++
    ) {
      final row = rows![index];
      if (row.isNotEmpty && row.first.toString() == id) {
        return _TransactionRow(
          record: TransactionRecord.fromSheetRow(row),
          rowNumber: index + 2,
        );
      }
    }
    throw const TransactionNotFound();
  }

  _CategoryRow _findCategory(List<List<Object?>> rows, String id) {
    for (var index = 0; index < rows.length; index++) {
      if (rows[index].isNotEmpty && rows[index].first.toString() == id) {
        return _CategoryRow(
          record: CategoryRecord.fromSheetRow(rows[index]),
          rowNumber: index + 2,
        );
      }
    }
    throw const ItemNotFound();
  }

  _TagRow _findTag(List<List<Object?>> rows, String id) {
    for (var index = 0; index < rows.length; index++) {
      if (rows[index].isNotEmpty && rows[index].first.toString() == id) {
        return _TagRow(
          record: TagRecord.fromSheetRow(rows[index]),
          rowNumber: index + 2,
        );
      }
    }
    throw const ItemNotFound();
  }

  void _assertUniqueName({
    required String name,
    required TransactionType type,
    required List<CategoryRecord> categories,
    String? ignoredId,
  }) {
    if (categories.any(
      (category) =>
          category.id != ignoredId &&
          category.type == type &&
          category.name.toLowerCase() == name.toLowerCase(),
    )) {
      throw const DuplicateName();
    }
  }

  void _assertUniqueTag(
    String name,
    List<TagRecord> tags, {
    String? ignoredId,
  }) {
    if (tags.any(
      (tag) =>
          tag.id != ignoredId && tag.name.toLowerCase() == name.toLowerCase(),
    )) {
      throw const DuplicateName();
    }
  }

  static bool _validMonth(String value) =>
      RegExp(r'^\d{4}_(0[1-9]|1[0-2])$').hasMatch(value);
  static String _currentUtcMonth() {
    final now = DateTime.now().toUtc();
    return '${now.year.toString().padLeft(4, '0')}_${now.month.toString().padLeft(2, '0')}';
  }

  static String _columnFor(int length) =>
      const {2: 'B', 4: 'D', 7: 'G', 14: 'N'}[length] ?? 'A';
}

class _TransactionRow {
  const _TransactionRow({required this.record, required this.rowNumber});
  final TransactionRecord record;
  final int rowNumber;
}

class _CategoryRow {
  const _CategoryRow({required this.record, required this.rowNumber});
  final CategoryRecord record;
  final int rowNumber;
}

class _TagRow {
  const _TagRow({required this.record, required this.rowNumber});
  final TagRecord record;
  final int rowNumber;
}

class SheetNotReady implements Exception {
  const SheetNotReady();
}

class SpreadsheetTrashed implements Exception {
  const SpreadsheetTrashed(this.spreadsheetId);
  final String spreadsheetId;
}

class TransactionNotFound implements Exception {
  const TransactionNotFound();
}

class ItemNotFound implements Exception {
  const ItemNotFound();
}

class ItemLocked implements Exception {
  const ItemLocked();
}

class ItemLimitReached implements Exception {
  const ItemLimitReached();
}

class DuplicateName implements Exception {
  const DuplicateName();
}

class SheetFormatInvalid implements Exception {
  const SheetFormatInvalid(this.sheetName);
  final String sheetName;
}

class SchemaUpgradeRequired implements Exception {
  const SchemaUpgradeRequired(this.currentVersion);
  final String? currentVersion;
}

class ReceiptDuplicate implements Exception {
  const ReceiptDuplicate(this.record);
  final TransactionRecord record;
}

class ReceiptTransactionCreateResult {
  const ReceiptTransactionCreateResult({this.record, this.duplicate});
  final TransactionRecord? record;
  final TransactionRecord? duplicate;
}

class TransactionListResult {
  const TransactionListResult({
    required this.records,
    required this.skippedRows,
  });
  final List<TransactionRecord> records;
  final int skippedRows;
}
