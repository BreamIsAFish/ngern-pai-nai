import type { AppStatus } from '../bridge/types'
import Icon from '../ui/Icon'

interface SettingsPageProps {
  busy: boolean
  status: AppStatus
  onBack?(): void
  onSignOut?(): void
}

export default function SettingsPage({ busy, status, onBack, onSignOut }: SettingsPageProps) {
  return (
    <main className="app-shell settings-page">
      <header className="app-header settings-header">
        <button className="text-button" onClick={onBack} type="button">Back</button>
        <h1>Settings</h1>
        <span />
      </header>

      <section className="settings-section">
        <p className="section-kicker">Google account</p>
        <div className="settings-card">
          <div className="account-avatar">{status.accountEmail?.slice(0, 1).toUpperCase() ?? 'G'}</div>
          <div>
            <strong>{status.accountEmail ?? 'Connected account'}</strong>
            <span>Google connected</span>
          </div>
          <span className="status-pill">Connected</span>
        </div>
      </section>

      <section className="settings-section">
        <p className="section-kicker">Data storage</p>
        <div className="settings-card storage-card">
          <div className="settings-icon"><Icon name="sheet" /></div>
          <div>
            <strong>{status.spreadsheetName ?? 'Ngern Pai Nai'}</strong>
            <span>Private Google Sheet</span>
          </div>
        </div>
        <p className="settings-explainer">Only this app and people you explicitly share the sheet with can access it.</p>
      </section>

      <button className="button button-danger" disabled={busy} onClick={onSignOut} type="button">
        {busy ? 'Signing out...' : 'Disconnect Google'}
      </button>
      <p className="version-note">Ngern Pai Nai · Prototype 1</p>
    </main>
  )
}

