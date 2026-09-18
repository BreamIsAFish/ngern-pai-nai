import 'package:shared_preferences/shared_preferences.dart';

class SpreadsheetStore {
  static const _prefix = 'spreadsheet_id_';

  Future<String?> read(String accountId) async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString('$_prefix$accountId');
  }

  Future<void> write({
    required String accountId,
    required String spreadsheetId,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString('$_prefix$accountId', spreadsheetId);
  }

  Future<void> delete(String accountId) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove('$_prefix$accountId');
  }
}
