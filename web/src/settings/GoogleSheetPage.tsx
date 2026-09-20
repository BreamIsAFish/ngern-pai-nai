import { useState } from 'react'
import type { AppStatus } from '../bridge/types'
import Icon from '../ui/Icon'
import PullToRefresh from '../ui/PullToRefresh'

interface Props {
  refreshing: boolean
  status: AppStatus
  onBack?(): void
  onRefresh?(): void
}

export default function GoogleSheetPage({ refreshing, status, onBack, onRefresh }: Props) {
  const [copyLabel, setCopyLabel] = useState('Copy link')
  const url = status.spreadsheetUrl

  const copyLink = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopyLabel('Copied')
    } catch (error) {
      console.error('[GoogleSheetPage] Could not copy the Sheet link.', error)
      setCopyLabel('Copy failed')
    }
    window.setTimeout(() => setCopyLabel('Copy link'), 1600)
  }

  return (
    <PullToRefresh onRefresh={onRefresh} refreshing={refreshing}>
      <main className="sheet-settings-page">
        <header className="settings-detail-header">
          <button aria-label="Back to Profile" onClick={onBack} type="button"><Icon name="back" size={30} /></button>
          <h1>Google Sheet</h1>
          <span />
        </header>

        <section className="sheet-status-card">
          <span className="sheet-status-icon"><Icon name="sheet" size={25} /></span>
          <div>
            <strong>{status.spreadsheetName ?? 'NgernPaiNai_data'}</strong>
            <small>{status.accountEmail ?? 'Connected Google account'}</small>
          </div>
          <b>Connected</b>
        </section>

        <section className="sheet-link-section">
          <h2>Spreadsheet link</h2>
          {url ? (
            <>
              <a className="sheet-url" href={url}>{url}</a>
              <div className="sheet-link-actions">
                <a className="primary-action" href={url}>Open Google Sheet</a>
                <button onClick={() => void copyLink()} type="button">{copyLabel}</button>
              </div>
            </>
          ) : (
            <p className="sheet-link-missing">The Sheet link could not be loaded. Close and reopen the app, then try again.</p>
          )}
        </section>

        <p className="sheet-settings-note">Transactions are stored in monthly tabs. Categories and tags use their own tabs in this spreadsheet.</p>
      </main>
    </PullToRefresh>
  )
}
