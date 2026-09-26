const receiptInstructions = '''
อ่านเฉพาะใบเสร็จซื้อสินค้าหรือบริการภาษาไทยหนึ่งใบจากรูป ห้ามเดาข้อมูลที่อ่านไม่ออก
- valid_purchase เป็น true เฉพาะใบเสร็จซื้อปกติที่มีเงินรวมสุทธิเป็นเงินบาทชัดเจน
- amount คือยอดสุทธิที่จ่ายจริงหลังส่วนลด ภาษี และค่าบริการ ห้ามใช้ยอดก่อนรวม เงินสดรับ เงินทอน รหัสอนุมัติ หรือคะแนนสะสม
- currency ต้องเป็น THB เมื่อระบุสกุลเงินได้ชัดเจน มิฉะนั้นเป็น null
- receipt_date ใช้รูปแบบ YYYY-MM-DD และแปลงปีพุทธศักราชเป็นคริสต์ศักราช หากอ่านไม่ได้หรือกำกวมให้เป็น null
- receipt_time ใช้รูปแบบ HH:mm:ss หากไม่มีเวลาให้เป็น null
- transaction_number ใช้เฉพาะเลขที่รายการ ห้ามใช้เลขใบกำกับภาษี เลขใบเสร็จ รหัสอนุมัติ เลขผู้เสียภาษี เบอร์โทร หรือเลขบัตร
- merchant_name คือชื่อร้านหรือผู้ขาย
- note เป็นสรุปรายการสินค้าที่มองเห็นได้เป็นภาษาไทยไม่เกิน 100 ตัวอักษร หากอ่านรายการไม่ได้ให้เป็น null
- หากเป็นเอกสารคืนเงิน ยกเลิก หลายใบในรูปเดียว หรือไม่ใช่ใบเสร็จซื้อปกติ ให้ valid_purchase เป็น false
- เมื่อ valid_purchase เป็น true ให้ unsupported_reason เป็น null
''';

const receiptImagePrompt = 'อ่านใบเสร็จภาษาไทยหนึ่งใบจากรูปนี้';

const receiptSchema = {
  'type': 'object',
  'additionalProperties': false,
  'properties': {
    'valid_purchase': {'type': 'boolean'},
    'unsupported_reason': {
      'type': ['string', 'null'],
    },
    'merchant_name': {
      'type': ['string', 'null'],
    },
    'note': {
      'type': ['string', 'null'],
    },
    'amount': {
      'type': ['number', 'null'],
    },
    'currency': {
      'type': ['string', 'null'],
    },
    'receipt_date': {
      'type': ['string', 'null'],
    },
    'receipt_time': {
      'type': ['string', 'null'],
    },
    'transaction_number': {
      'type': ['string', 'null'],
    },
  },
  'required': [
    'valid_purchase',
    'unsupported_reason',
    'merchant_name',
    'note',
    'amount',
    'currency',
    'receipt_date',
    'receipt_time',
    'transaction_number',
  ],
};

String? receiptImageMimeType(String path) {
  final extension = path.split('.').last.toLowerCase();
  return const {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  }[extension];
}
