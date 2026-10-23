import type { AiStatus, AppStatus } from '../bridge/types'
import Hamster from '../ui/Hamster'
import BottomNav from '../ui/BottomNav'
import useTheme from '../theme/useTheme'
import Icon from '../ui/Icon'

interface Props { aiStatus?: AiStatus; busy: boolean; status: AppStatus; onDisconnect(): void; onHome(): void; onSummary(): void; onAdd(): void; onScanReceipt(): void; onImportMeowJot(): void; onManageSheet(): void; onManageCategories(): void; onManageTags(): void; onManageAi(): void }
export default function SettingsPage({ aiStatus, busy, status, onDisconnect, onHome, onSummary, onAdd, onScanReceipt, onImportMeowJot, onManageSheet, onManageCategories, onManageTags, onManageAi }: Props) {
  const { theme, toggleTheme } = useTheme()
  return <main className="profile-page">
    <header className="profile-hero"><div className="profile-art"><div className="journal-badge"><span>฿</span><small>Money journal</small></div><Hamster className="profile-hamster" pose="seed" size={150} /></div></header>
    <section className="profile-plan"><div><span>Money journal</span><strong>Plan with confidence</strong></div><button disabled title="Coming later" type="button">Learn more</button></section>
    <section className="profile-account"><div className="avatar">{status.accountEmail?.[0].toUpperCase() ?? 'G'}</div><div><strong>{status.accountEmail}</strong><span>{status.spreadsheetName} · Connected</span></div><button disabled={busy} onClick={onDisconnect} type="button">Disconnect</button></section>
    <h2>Settings</h2>
    <nav className="profile-menu">
      <button aria-label="Switch light or dark theme" aria-pressed={theme === 'dark'} onClick={toggleTheme} type="button"><span><Icon name="settings" /></span><div><strong>Appearance</strong><small>{theme === 'dark' ? 'Dark' : 'Light'} theme · Tap to switch</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageSheet} type="button"><span><Icon name="sheet" /></span><div><strong>Google Sheet</strong><small>Open your sheet and view its link</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onImportMeowJot} type="button"><span><Icon name="upload" /></span><div><strong>Import from MeowJot</strong><small>Convert a CSV and add it to your Sheet</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageCategories} type="button"><span><Icon name="grid" /></span><div><strong>Manage categories</strong><small>Default and custom categories</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageTags} type="button"><span><Icon name="tag" /></span><div><strong>Manage tags</strong><small>Shared across all entry types</small></div><b><Icon name="chevron-right" /></b></button>
      <button onClick={onManageAi} type="button"><span><Icon name="key" /></span><div><strong>AI provider</strong><small>{aiStatus?.verified ? `${aiStatus.providerName} · ${aiStatus.model}` : aiStatus?.configured ? `${aiStatus.providerName} · ยังไม่ได้ตรวจสอบ` : 'ตั้งค่า API key เพื่อสแกนใบเสร็จ'}</small></div><b><Icon name="chevron-right" /></b></button>
      <button disabled title="Coming later" type="button"><span><Icon name="card" /></span><div><strong>Manage credit cards <em>New</em></strong><small>Coming later</small></div><b><Icon name="chevron-right" /></b></button>
      <button disabled title="Coming later" type="button"><span><Icon name="upload" /></span><div><strong>Export data</strong><small>Coming later</small></div><b><Icon name="chevron-right" /></b></button>
    </nav>
    <BottomNav active="profile" onHome={onHome} onSummary={onSummary} onAdd={onAdd} onScanReceipt={onScanReceipt} onProfile={() => window.scrollTo(0, 0)} />
  </main>
}
