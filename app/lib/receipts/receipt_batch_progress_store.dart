import 'package:shared_preferences/shared_preferences.dart';

class ReceiptBatchProgressStore {
  static const _activeBatchKey = 'receipt_active_batch';
  static const _completedCountKey = 'receipt_completed_count';

  Future<void> begin(String batchId) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_activeBatchKey, batchId);
    await preferences.setInt(_completedCountKey, 0);
  }

  Future<void> recordAdded(String batchId) async {
    final preferences = await SharedPreferences.getInstance();
    if (preferences.getString(_activeBatchKey) != batchId) return;
    await preferences.setInt(
      _completedCountKey,
      (preferences.getInt(_completedCountKey) ?? 0) + 1,
    );
  }

  Future<void> finish(String batchId) async {
    final preferences = await SharedPreferences.getInstance();
    if (preferences.getString(_activeBatchKey) != batchId) return;
    await preferences.remove(_activeBatchKey);
    await preferences.remove(_completedCountKey);
  }

  Future<int> takeInterruptedCount() async {
    final preferences = await SharedPreferences.getInstance();
    if (preferences.getString(_activeBatchKey) == null) return 0;
    final count = preferences.getInt(_completedCountKey) ?? 0;
    await preferences.remove(_activeBatchKey);
    await preferences.remove(_completedCountKey);
    return count;
  }
}
