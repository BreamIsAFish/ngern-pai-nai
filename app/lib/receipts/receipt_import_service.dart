import '../openai/open_ai_client.dart';
import '../openai/open_ai_settings.dart';
import '../sheets/sheets_gateway.dart';
import '../transactions/transaction.dart';
import 'receipt_batch_progress_store.dart';
import 'receipt_image_store.dart';
import 'prepare_receipt_transaction.dart';

class ReceiptImportService {
  const ReceiptImportService({
    required this.client,
    required this.images,
    required this.progress,
    required this.settings,
    required this.sheets,
  });

  final OpenAiClient client;
  final ReceiptImageStore images;
  final ReceiptBatchProgressStore progress;
  final OpenAiSettingsStore settings;
  final SheetsGateway sheets;

  Future<ReceiptImageSelection> pick(ReceiptImageSource source) async {
    final current = await settings.read();
    if (!current.hasKey || !current.isVerified) {
      throw const OpenAiNotConfigured();
    }
    final selection = await images.pick(source);
    if (!selection.cancelled) await progress.begin(selection.batchId!);
    return selection;
  }

  Future<Map<String, dynamic>> process({
    required String batchId,
    required String imageId,
  }) async {
    try {
      final image = images.requireImage(batchId: batchId, imageId: imageId);
      final current = await settings.read();
      final apiKey = await settings.readApiKey();
      if (!current.isVerified || apiKey == null) {
        throw const OpenAiNotConfigured();
      }
      final extraction = await client.extractReceipt(
        apiKey: apiKey,
        model: current.model,
        image: image,
      );
      if (images.isCancelled(batchId)) {
        return const ReceiptImportOutcome.cancelled().toJson();
      }
      final prepared = prepareReceiptTransaction(extraction: extraction);
      final result = await sheets.createReceiptTransaction(
        prepared.transaction,
      );
      await images.removeImage(batchId: batchId, imageId: imageId);
      final duplicate = result.duplicate;
      if (duplicate != null) {
        return ReceiptImportOutcome.duplicate(
          transaction: duplicate,
          warnings: prepared.warnings,
        ).toJson();
      }
      await progress.recordAdded(batchId);
      return ReceiptImportOutcome.added(
        transaction: result.record!,
        warnings: prepared.warnings,
      ).toJson();
    } on ReceiptBatchCancelled {
      return const ReceiptImportOutcome.cancelled().toJson();
    } on OpenAiRequestError catch (error) {
      return ReceiptImportOutcome.failed(
        message: error.thaiMessage,
        requestId: error.requestId,
      ).toJson();
    } on OpenAiNetworkError catch (error) {
      return ReceiptImportOutcome.failed(message: error.message).toJson();
    } on OpenAiInvalidImage {
      return const ReceiptImportOutcome.failed(
        message: 'รองรับเฉพาะรูป JPG, PNG, WEBP หรือ GIF',
      ).toJson();
    } on OpenAiInvalidResponse catch (error) {
      return ReceiptImportOutcome.failed(
        message: 'OpenAI ส่งข้อมูลใบเสร็จที่อ่านไม่ได้',
        requestId: error.requestId,
      ).toJson();
    } on ReceiptDataInvalid catch (error) {
      return ReceiptImportOutcome.failed(message: error.message).toJson();
    } catch (_) {
      return const ReceiptImportOutcome.failed(
        message: 'เพิ่มรายการจากใบเสร็จไม่ได้',
      ).toJson();
    }
  }

  void cancel(String batchId) => images.cancel(batchId);

  Future<void> discard(String batchId) async {
    await images.discard(batchId);
    await progress.finish(batchId);
  }
}

class ReceiptImportOutcome {
  const ReceiptImportOutcome._({
    required this.status,
    this.message,
    this.requestId,
    this.transaction,
    this.warnings = const [],
  });

  const ReceiptImportOutcome.added({
    required TransactionRecord transaction,
    required List<String> warnings,
  }) : this._(status: 'added', transaction: transaction, warnings: warnings);

  const ReceiptImportOutcome.duplicate({
    required TransactionRecord transaction,
    required List<String> warnings,
  }) : this._(
         status: 'duplicate',
         transaction: transaction,
         warnings: warnings,
       );

  const ReceiptImportOutcome.failed({
    required String message,
    String? requestId,
  }) : this._(status: 'failed', message: message, requestId: requestId);

  const ReceiptImportOutcome.cancelled() : this._(status: 'cancelled');

  final String? message;
  final String? requestId;
  final String status;
  final TransactionRecord? transaction;
  final List<String> warnings;

  Map<String, dynamic> toJson() => {
    'status': status,
    if (message != null) 'message': message,
    if (requestId != null) 'requestId': requestId,
    if (transaction != null) 'transaction': transaction!.toJson(),
    'warnings': warnings,
  };
}

class OpenAiNotConfigured implements Exception {
  const OpenAiNotConfigured();
}
