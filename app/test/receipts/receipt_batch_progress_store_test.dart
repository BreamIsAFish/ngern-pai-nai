import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/receipts/receipt_batch_progress_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('returns completed imports once after an interrupted batch', () async {
    final store = ReceiptBatchProgressStore();
    await store.begin('batch-1');
    await store.recordAdded('batch-1');
    await store.recordAdded('other-batch');

    expect(await store.takeInterruptedCount(), 1);
    expect(await store.takeInterruptedCount(), 0);
  });

  test('finished batches are not reported as interrupted', () async {
    final store = ReceiptBatchProgressStore();
    await store.begin('batch-1');
    await store.recordAdded('batch-1');
    await store.finish('batch-1');

    expect(await store.takeInterruptedCount(), 0);
  });
}
