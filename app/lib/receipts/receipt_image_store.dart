import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';

enum ReceiptImageSource {
  camera,
  gallery;

  static ReceiptImageSource parse(String value) {
    return switch (value) {
      'camera' => ReceiptImageSource.camera,
      'gallery' => ReceiptImageSource.gallery,
      _ => throw const FormatException('Invalid image source.'),
    };
  }
}

class ReceiptImageStore {
  ReceiptImageStore({ImagePicker? picker, Uuid uuid = const Uuid()})
    : _picker = picker ?? ImagePicker(),
      _uuid = uuid;

  final Map<String, _ReceiptBatch> _batches = {};
  final ImagePicker _picker;
  final Uuid _uuid;

  Future<ReceiptImageSelection> pick(ReceiptImageSource source) async {
    final selected = switch (source) {
      ReceiptImageSource.camera => [
        ?await _picker.pickImage(
          source: ImageSource.camera,
          maxWidth: 2048,
          maxHeight: 2048,
          imageQuality: 88,
        ),
      ],
      ReceiptImageSource.gallery => await _picker.pickMultiImage(
        limit: 10,
        maxWidth: 2048,
        maxHeight: 2048,
        imageQuality: 88,
      ),
    };
    if (selected.isEmpty) return const ReceiptImageSelection.cancelled();
    final batchId = _uuid.v4();
    final directory = await Directory.systemTemp.createTemp(
      'ngern_pai_nai_receipts_',
    );
    final images = <ReceiptImage>[];
    try {
      for (final image in selected.take(10)) {
        final id = _uuid.v4();
        final extension = _safeExtension(image.path);
        final copy = await File(
          image.path,
        ).copy('${directory.path}/$id$extension');
        images.add(ReceiptImage(id: id, name: image.name, file: copy));
      }
    } catch (_) {
      await directory.delete(recursive: true);
      rethrow;
    }
    _batches[batchId] = _ReceiptBatch(directory: directory, images: images);
    return ReceiptImageSelection(batchId: batchId, images: images);
  }

  File requireImage({required String batchId, required String imageId}) {
    final batch = _batches[batchId];
    if (batch == null || batch.cancelled) throw const ReceiptBatchCancelled();
    return batch.images
            .where((image) => image.id == imageId)
            .firstOrNull
            ?.file ??
        (throw const ReceiptImageNotFound());
  }

  bool isCancelled(String batchId) => _batches[batchId]?.cancelled ?? true;

  Future<void> removeImage({
    required String batchId,
    required String imageId,
  }) async {
    final batch = _batches[batchId];
    if (batch == null) return;
    final image = batch.images
        .where((candidate) => candidate.id == imageId)
        .firstOrNull;
    if (image != null && await image.file.exists()) await image.file.delete();
  }

  void cancel(String batchId) {
    final batch = _batches[batchId];
    if (batch != null) batch.cancelled = true;
  }

  Future<void> discard(String batchId) async {
    final batch = _batches.remove(batchId);
    if (batch != null && await batch.directory.exists()) {
      await batch.directory.delete(recursive: true);
    }
  }

  Future<void> cleanupStaleFiles() async {
    final parent = Directory.systemTemp;
    await for (final entry in parent.list()) {
      if (entry is Directory &&
          entry.path
              .split(Platform.pathSeparator)
              .last
              .startsWith('ngern_pai_nai_receipts_')) {
        try {
          await entry.delete(recursive: true);
        } on FileSystemException {
          // The OS may already be cleaning this cache directory.
        }
      }
    }
  }
}

class ReceiptImage {
  const ReceiptImage({
    required this.id,
    required this.name,
    required this.file,
  });
  final File file;
  final String id;
  final String name;

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}

class ReceiptImageSelection {
  const ReceiptImageSelection({required this.batchId, required this.images})
    : cancelled = false;
  const ReceiptImageSelection.cancelled()
    : batchId = null,
      images = const [],
      cancelled = true;

  final String? batchId;
  final bool cancelled;
  final List<ReceiptImage> images;

  Map<String, dynamic> toJson() => {
    'cancelled': cancelled,
    if (batchId != null) 'batchId': batchId,
    'images': images.map((image) => image.toJson()).toList(),
  };
}

class _ReceiptBatch {
  _ReceiptBatch({required this.directory, required this.images});
  bool cancelled = false;
  final Directory directory;
  final List<ReceiptImage> images;
}

class ReceiptBatchCancelled implements Exception {
  const ReceiptBatchCancelled();
}

class ReceiptImageNotFound implements Exception {
  const ReceiptImageNotFound();
}

String _safeExtension(String path) {
  final name = path.split(Platform.pathSeparator).last;
  final dot = name.lastIndexOf('.');
  if (dot < 0) return '.jpg';
  final extension = name.substring(dot).toLowerCase();
  return RegExp(r'^\.[a-z0-9]{1,5}$').hasMatch(extension) ? extension : '.jpg';
}
