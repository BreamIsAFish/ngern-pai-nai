import type { AppStatus, OpenAiStatus } from '../bridge/types'
import CatIllustration from '../ui/CatIllustration'
import Icon from '../ui/Icon'

interface Props { busy: boolean; status: AppStatus; openAiStatus?: OpenAiStatus; onDisconnect(): void; onHome(): void; onManageSheet(): void; onManageCategories(): void; onManageTags(): void; onManageOpenAi(): void }
export default function SettingsPage({ busy, status, openAiStatus, onDisconnect, onHome, onManageSheet, onManageCategories, onManageTags, onManageOpenAi }: Props) {
  return <main className="profile-page">
    <header className="profile-hero"><div className="profile-art"><div className="meow-gold"><span>฿</span><small>MeowGold</small></div><CatIllustration className="profile-cat" /></div></header>
    <section className="profile-plan"><div><span>MeowGold</span><strong>Plan with confidence</strong></div><button disabled title="Coming later" type="button">Learn more</button></section>
    <section className="profile-account"><div className="avatar">{status.accountEmail?.[0].toUpperCase() ?? 'G'}</div><div><strong>{status.accountEmail}</strong><span>{status.spreadsheetName} · Connected</span></div><button disabled={busy} onClick={onDisconnect} type="button">Disconnect</button></section>
    <h2>Settings</h2>
    <nav className="profile-menu">
      <button onClick={onManageSheet} type="button"><span><Icon name="sheet" /></span><div><strong>Google Sheet</strong><small>Open your sheet and view its link</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageCategories} type="button"><span><Icon name="grid" /></span><div><strong>Manage categories</strong><small>Default and custom categories</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageTags} type="button"><span><Icon name="tag" /></span><div><strong>Manage tags</strong><small>Shared across all entry types</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageOpenAi} type="button"><span><Icon name="key" /></span><div><strong>OpenAI</strong><small>{openAiStatus?.verified ? `${openAiStatus.model} · พร้อมใช้งาน` : openAiStatus?.configured ? 'บันทึกแล้ว · ยังไม่ได้ตรวจสอบ' : 'ตั้งค่า API key เพื่อสแกนใบเสร็จ'}</small></div><b><Icon name="chevron-right" /></b></button>
      <button disabled title="Coming later" type="button"><span><Icon name="card" /></span><div><strong>Manage credit cards <em>New</em></strong><small>Coming later</small></div><b><Icon name="chevron-right" /></b></button>
      <button disabled title="Coming later" type="button"><span><Icon name="upload" /></span><div><strong>Export data</strong><small>Coming later</small></div><b><Icon name="chevron-right" /></b></button>
    </nav>
    <nav className="bottom-nav"><button onClick={onHome} type="button"><Icon name="home" size={25} /><span>Home</span></button><button className="active" type="button"><Icon name="profile" size={25} /><span>Profile</span></button></nav>
  </main>
}
