const receiptInstructions = '''
อ่านเอกสารการจ่ายเงินภาษาไทยหนึ่งรายการจากรูป ห้ามเดาข้อมูลที่อ่านไม่ออก
- รองรับใบเสร็จซื้อสินค้าหรือบริการ และสลิปธุรกรรมขาออกที่สำเร็จของธนาคารกสิกรไทย KBank หรือ K PLUS
- valid_purchase เป็น true เมื่อเป็นใบเสร็จซื้อปกติที่มียอดสุทธิเป็นเงินบาทชัดเจน หรือเป็นสลิป KBank/K PLUS ที่ยืนยันว่าธุรกรรมขาออกสำเร็จแล้วและมียอดเงินบาทชัดเจน
- สลิป KBank/K PLUS ที่รองรับรวมถึงการโอนไปบัญชีหรือพร้อมเพย์ ชำระด้วย QR ชำระค่าสินค้าหรือบริการ จ่ายบิล และเติมเงิน
- amount สำหรับใบเสร็จคือยอดสุทธิที่จ่ายจริงหลังส่วนลด ภาษี และค่าบริการ สำหรับสลิป KBank/K PLUS คือยอดที่โอน ชำระ หรือเติมจริง ห้ามใช้ยอดก่อนรวม เงินสดรับ เงินทอน รหัสอนุมัติ หรือคะแนนสะสม
- currency ต้องเป็น THB เมื่อระบุสกุลเงินได้ชัดเจน มิฉะนั้นเป็น null
- receipt_date ใช้รูปแบบ YYYY-MM-DD และแปลงปีพุทธศักราชเป็นคริสต์ศักราช หากอ่านไม่ได้หรือกำกวมให้เป็น null
- receipt_time ใช้รูปแบบ HH:mm:ss หากไม่มีเวลาให้เป็น null
- transaction_number สำหรับใบเสร็จใช้เฉพาะเลขที่รายการ สำหรับสลิป KBank/K PLUS ใช้เลขที่รายการหรือเลขอ้างอิงธุรกรรม ห้ามใช้เลขใบกำกับภาษี เลขใบเสร็จ รหัสอนุมัติ เลขผู้เสียภาษี เลขบัญชี เบอร์โทร หรือเลขบัตร
- merchant_name สำหรับใบเสร็จคือชื่อร้านหรือผู้ขาย สำหรับสลิป KBank/K PLUS คือชื่อผู้รับเงิน ร้านค้า ผู้ให้บริการ หรือผู้เรียกเก็บเงิน ห้ามใช้ชื่อผู้โอนหรือชื่อธนาคาร
- note สำหรับใบเสร็จเป็นสรุปรายการสินค้าที่มองเห็นได้ สำหรับสลิป KBank/K PLUS เป็นประเภทธุรกรรมและข้อความที่ระบุในสลิป ใช้ภาษาไทยไม่เกิน 100 ตัวอักษร หากอ่านไม่ได้ให้เป็น null
- หากเป็นเอกสารคืนเงิน ยกเลิก รอดำเนินการ ไม่สำเร็จ กลับรายการ เงินเข้า หลายเอกสารในรูปเดียว หรือไม่ตรงกับประเภทที่รองรับ ให้ valid_purchase เป็น false และระบุ unsupported_reason สั้นๆ
- เมื่อ valid_purchase เป็น true ให้ unsupported_reason เป็น null
''';

const receiptImagePrompt =
    'อ่านใบเสร็จซื้อสินค้าหรือสลิปธุรกรรมขาออก KBank/K PLUS หนึ่งรายการจากรูปนี้';

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
