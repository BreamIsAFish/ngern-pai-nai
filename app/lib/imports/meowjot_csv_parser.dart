import 'dart:convert';

import 'package:csv/csv.dart';
import 'package:uuid/uuid.dart';

import '../transactions/transaction.dart';

const _requiredHeaders = {'date', 'time', 'type', 'amount'};
const _uuidNamespace = 'a6538ac4-f36f-5fd7-b995-986823c38914';
const _bangkokOffset = Duration(hours: 7);
const _maxRows = 10000;

const _typeMap = {
  'spending': TransactionType.expense,
  'expense': TransactionType.expense,
  'income': TransactionType.income,
  'transfer': TransactionType.transfer,
  'transfers': TransactionType.transfer,
};

class MeowJotCsvParseResult {
  const MeowJotCsvParseResult({
    required this.records,
    required this.sourceRows,
    required this.skippedZeroAmount,
  });

  final List<TransactionRecord> records;
  final int skippedZeroAmount;
  final int sourceRows;
}

class MeowJotImportInvalid implements Exception {
  const MeowJotImportInvalid(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Converts a raw MeowJot CSV export into validated sheet records.
///
/// MeowJot timestamps are interpreted as Bangkok time and converted to UTC.
/// Zero-amount rows are counted and omitted. IDs are deterministic so that
/// importing the same export again does not create duplicates.
MeowJotCsvParseResult parseMeowJotCsv({
  required String rawData,
  required DateTime importedAt,
  Uuid uuid = const Uuid(),
}) {
  final normalized = rawData
      .replaceFirst('\ufeff', '')
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n');
  late final List<List<dynamic>> parsed;
  try {
    parsed = const CsvToListConverter(
      eol: '\n',
      shouldParseNumbers: false,
      allowInvalid: false,
    ).convert(normalized);
  } on FormatException {
    throw const MeowJotImportInvalid('The selected file is not valid CSV.');
  }
  if (parsed.isEmpty) {
    throw const MeowJotImportInvalid('The selected CSV is empty.');
  }

  final headers = parsed.first.map(_normalizeHeader).toList(growable: false);
  final missing = _requiredHeaders.difference(headers.toSet()).toList()..sort();
  if (missing.isNotEmpty) {
    throw MeowJotImportInvalid(
      'Missing required columns: ${missing.join(', ')}.',
    );
  }

  final dataRows = parsed
      .skip(1)
      .where((row) => row.any((cell) => _cell(cell).isNotEmpty))
      .toList();
  if (dataRows.isEmpty) {
    throw const MeowJotImportInvalid('The selected CSV has no transactions.');
  }
  if (dataRows.length > _maxRows) {
    throw const MeowJotImportInvalid(
      'The selected CSV has more than 10,000 transactions.',
    );
  }

  final auditTime = importedAt.toUtc();
  final records = <TransactionRecord>[];
  final occurrences = <String, int>{};
  var skippedZeroAmount = 0;
  for (var index = 0; index < dataRows.length; index++) {
    final rowNumber = index + 2;
    final values = dataRows[index];
    if (values.length != headers.length) {
      throw MeowJotImportInvalid(
        'Row $rowNumber has ${values.length} columns; expected ${headers.length}.',
      );
    }
    final row = {
      for (var column = 0; column < headers.length; column++)
        headers[column]: _cell(values[column]),
    };
    final amount = _amount(row['amount'] ?? '', rowNumber);
    if (amount == 0) {
      skippedZeroAmount++;
      continue;
    }
    final type = _transactionType(row['type'] ?? '', rowNumber);
    final instant = _utcInstant(
      date: row['date'] ?? '',
      time: row['time'] ?? '',
      rowNumber: rowNumber,
    );
    if (instant.isAfter(auditTime)) {
      throw MeowJotImportInvalid('Row $rowNumber has a future date.');
    }
    final note = _optional(row['note'] ?? '') ?? '';
    if (note.length > 160) {
      throw MeowJotImportInvalid(
        'Row $rowNumber has a note longer than 160 characters.',
      );
    }
    final canonical = jsonEncode(
      headers.map((header) => row[header] ?? '').toList(),
    );
    final occurrence = (occurrences[canonical] ?? 0) + 1;
    occurrences[canonical] = occurrence;
    final id = uuid.v5(_uuidNamespace, '$canonical#$occurrence');
    final category = type == TransactionType.transfer
        ? 'Transfer'
        : _optional(row['category'] ?? '') ?? 'Other';
    final input = TransactionInput(
      date: _dateOnly(instant),
      time: _timeOnly(instant),
      type: type,
      category: category,
      tag: _optional(row['tag'] ?? ''),
      amount: amount,
      note: note,
      destination: _optional(row['receiver'] ?? ''),
      source: TransactionSource.manual,
      dateInferred: false,
    );
    records.add(
      TransactionRecord(
        id: id,
        input: input,
        createdAt: auditTime,
        updatedAt: auditTime,
      ),
    );
  }

  return MeowJotCsvParseResult(
    records: records,
    sourceRows: dataRows.length,
    skippedZeroAmount: skippedZeroAmount,
  );
}

String _normalizeHeader(Object? value) => _cell(value)
    .toLowerCase()
    .split(RegExp(r'\s+'))
    .where((part) => part.isNotEmpty)
    .join('_');

String _cell(Object? value) => value?.toString().trim() ?? '';

String? _optional(String value) {
  final stripped = value.trim();
  return stripped.isEmpty || stripped == '-' ? null : stripped;
}

double _amount(String value, int rowNumber) {
  final normalized = value.replaceAll(',', '').replaceAll('฿', '').trim();
  final amount = double.tryParse(normalized)?.abs();
  if (amount == null || !amount.isFinite) {
    throw MeowJotImportInvalid('Row $rowNumber has an invalid amount.');
  }
  return amount;
}

TransactionType _transactionType(String value, int rowNumber) {
  final type = _typeMap[value.trim().toLowerCase()];
  if (type == null) {
    throw MeowJotImportInvalid("Row $rowNumber has unsupported type '$value'.");
  }
  return type;
}

DateTime _utcInstant({
  required String date,
  required String time,
  required int rowNumber,
}) {
  final dateParts = date.trim().split('/');
  final timeParts = time.trim().split(':');
  if (dateParts.length != 3 || timeParts.length < 2 || timeParts.length > 3) {
    throw MeowJotImportInvalid('Row $rowNumber has an invalid date or time.');
  }
  final day = int.tryParse(dateParts[0]);
  final month = int.tryParse(dateParts[1]);
  final year = int.tryParse(dateParts[2]);
  final hour = int.tryParse(timeParts[0]);
  final minute = int.tryParse(timeParts[1]);
  final second = timeParts.length == 3 ? int.tryParse(timeParts[2]) : 0;
  if ([day, month, year, hour, minute, second].contains(null)) {
    throw MeowJotImportInvalid('Row $rowNumber has an invalid date or time.');
  }
  final local = DateTime.utc(year!, month!, day!, hour!, minute!, second!);
  if (local.year != year ||
      local.month != month ||
      local.day != day ||
      local.hour != hour ||
      local.minute != minute ||
      local.second != second) {
    throw MeowJotImportInvalid('Row $rowNumber has an invalid date or time.');
  }
  return local.subtract(_bangkokOffset);
}

String _dateOnly(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

String _timeOnly(DateTime date) {
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  final second = date.second.toString().padLeft(2, '0');
  return '$hour:$minute:$second';
}
