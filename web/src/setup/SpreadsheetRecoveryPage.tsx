import Icon from '../ui/Icon'

interface Props {
  busy: boolean
  error?: string
  spreadsheetUrl?: string
  onCreateNew?(): void
  onRestore?(): void
}

export default function SpreadsheetRecoveryPage({ busy, error, spreadsheetUrl, onCreateNew, onRestore }: Props) {
  return <main className="sheet-recovery-page" data-visual-ready="true">
    <section className="sheet-recovery-content">
      <div className="sheet-recovery-mark"><Icon name="sheet" size={36} /></div>
      <p className="eyebrow">Google Sheet needs attention</p>
      <h1>Your spreadsheet is in the trash</h1>
      <p className="sheet-recovery-copy">Restore it to keep your existing transactions, or start over with a new spreadsheet.</p>
      {spreadsheetUrl && <a className="sheet-recovery-link" href={spreadsheetUrl} rel="noreferrer" target="_blank">View trashed spreadsheet <Icon name="chevron-right" /></a>}
      {error && <p className="error-banner" role="alert">{error}</p>}
      <div className="sheet-recovery-actions">
        <button className="button button-primary button-large" disabled={busy} onClick={onRestore} type="button"><Icon name="refresh" />{busy ? 'Working...' : 'Restore spreadsheet'}</button>
        <button className="button button-secondary button-large" disabled={busy} onClick={onCreateNew} type="button"><Icon name="plus" />Create new spreadsheet</button>
      </div>
      <p className="sheet-recovery-note">Creating a new spreadsheet leaves the old one in Google Drive trash.</p>
    </section>
  </main>
}
