interface Props {
  busy: boolean
  error?: string
  onConfirm?(): void
}

export default function SchemaResetPage({ busy, error, onConfirm }: Props) {
  return <main className="setup-page schema-reset-page">
    <section>
      <div className="setup-mark">฿</div>
      <h1>ต้องอัปเดตโครงสร้าง Google Sheet</h1>
      <p>การอัปเดตนี้จะลบรายการรับจ่ายเดิมทั้งหมด แต่จะเก็บหมวดหมู่และแท็กไว้</p>
      <p><strong>รายการที่ลบแล้วไม่สามารถกู้คืนผ่านแอปได้</strong></p>
      {error && <p className="setup-error">{error}</p>}
      <button disabled={busy} onClick={onConfirm} type="button">{busy ? 'กำลังอัปเดต...' : 'ลบรายการเดิมและอัปเดต'}</button>
    </section>
  </main>
}
