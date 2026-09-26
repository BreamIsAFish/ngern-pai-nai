import Icon from '../ui/Icon'

interface Props {
  onCancel?(): void
  onSelect?(source: 'camera' | 'gallery'): void
}

export default function ReceiptSourceDialog({ onCancel, onSelect }: Props) {
  return <div className="receipt-source-layer">
    <button aria-label="ปิด" className="receipt-scrim" onClick={onCancel} type="button" />
    <section aria-labelledby="receipt-source-title" className="receipt-source-dialog" role="dialog">
      <header><h2 id="receipt-source-title">สแกนใบเสร็จ</h2><button aria-label="ปิด" onClick={onCancel} type="button"><Icon name="close" size={26} /></button></header>
      <button onClick={() => onSelect?.('camera')} type="button"><Icon name="camera" size={28} /><span><strong>ถ่ายรูป</strong><small>ใบเสร็จครั้งละ 1 ใบ</small></span></button>
      <button onClick={() => onSelect?.('gallery')} type="button"><Icon name="image" size={28} /><span><strong>เลือกจากคลังรูปภาพ</strong><small>เลือกได้สูงสุด 10 รูป</small></span></button>
    </section>
  </div>
}
