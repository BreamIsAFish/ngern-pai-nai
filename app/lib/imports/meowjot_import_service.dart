import 'dart:convert';

import 'package:file_selector/file_selector.dart';

import '../sheets/sheets_gateway.dart';
import '../transactions/transaction.dart';
import 'meowjot_csv_parser.dart';

typedef MeowJotFilePicker = Future<XFile?> Function();
typedef MeowJotTransactionImporter =
    Future<TransactionImportResult> Function(List<TransactionRecord> records);

const _maximumFileBytes = 10 * 1024 * 1024;

class MeowJotImportService {
  const MeowJotImportService({
    required this.importTransactions,
    this.filePicker,
    this.now,
  });

  final MeowJotFilePicker? filePicker;
  final MeowJotTransactionImporter importTransactions;
  final DateTime Function()? now;

  /// Selects one raw MeowJot CSV, converts it, and imports all valid rows.
  Future<MeowJotImportResult> pickAndImport() async {
    final file = await (filePicker ?? _pickCsvFile)();
    if (file == null) return const MeowJotImportResult.cancelled();
    final bytes = await file.readAsBytes();
    if (bytes.length > _maximumFileBytes) {
      throw const MeowJotImportInvalid(
        'The selected CSV is larger than 10 MB.',
      );
    }
    late final String rawData;
    try {
      rawData = utf8.decode(bytes);
    } on FormatException {
      throw const MeowJotImportInvalid('The selected CSV must use UTF-8 text.');
    }
    final parsed = parseMeowJotCsv(
      rawData: rawData,
      importedAt: (now ?? DateTime.now)().toUtc(),
    );
    final imported = await importTransactions(parsed.records);
    return MeowJotImportResult(
      fileName: file.name,
      sourceRows: parsed.sourceRows,
      imported: imported.imported,
      duplicates: imported.duplicates,
      skippedZeroAmount: parsed.skippedZeroAmount,
    );
  }
}

class MeowJotImportResult {
  const MeowJotImportResult({
    required this.fileName,
    required this.sourceRows,
    required this.imported,
    required this.duplicates,
    required this.skippedZeroAmount,
  }) : cancelled = false;

  const MeowJotImportResult.cancelled()
    : cancelled = true,
      fileName = null,
      sourceRows = 0,
      imported = 0,
      duplicates = 0,
      skippedZeroAmount = 0;

  final bool cancelled;
  final int duplicates;
  final String? fileName;
  final int imported;
  final int skippedZeroAmount;
  final int sourceRows;

  Map<String, dynamic> toJson() => {
    'cancelled': cancelled,
    if (fileName != null) 'fileName': fileName,
    'sourceRows': sourceRows,
    'imported': imported,
    'duplicates': duplicates,
    'skippedZeroAmount': skippedZeroAmount,
  };
}

Future<XFile?> _pickCsvFile() => openFile(
  acceptedTypeGroups: const [
    XTypeGroup(
      label: 'CSV',
      extensions: ['csv'],
      mimeTypes: ['text/csv', 'text/comma-separated-values', 'text/plain'],
      uniformTypeIdentifiers: [
        'public.comma-separated-values-text',
        'public.text',
      ],
    ),
  ],
  confirmButtonText: 'Import',
);
