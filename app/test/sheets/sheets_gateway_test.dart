import 'package:flutter_test/flutter_test.dart';
import 'package:googleapis/drive/v3.dart' as drive;
import 'package:ngern_pai_nai/sheets/sheets_gateway.dart';

void main() {
  test('uses the expected name when finding or creating the spreadsheet', () {
    expect(SheetsGateway.spreadsheetName, 'NgernPaiNai_data');
  });

  test('builds the user-facing Google Sheets URL', () {
    expect(
      SheetsGateway.spreadsheetUrl('sheet-123'),
      'https://docs.google.com/spreadsheets/d/sheet-123/edit',
    );
  });

  test('detects a Drive file that is in the trash', () {
    expect(SheetsGateway.isFileTrashed(drive.File(trashed: true)), isTrue);
    expect(SheetsGateway.isFileTrashed(drive.File(trashed: false)), isFalse);
    expect(SheetsGateway.isFileTrashed(drive.File()), isFalse);
  });
}
