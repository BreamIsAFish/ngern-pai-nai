import type { MeowJotImportResult } from '../bridge/types'
import Icon from '../ui/Icon'

interface Props {
  busy: boolean
  result?: MeowJotImportResult
  onBack(): void
  onImport(): void
}

export default function MeowJotImportPage({ busy, result, onBack, onImport }: Props) {
  return <main className="meowjot-import-page">
    <header className="settings-detail-header">
      <button aria-label="Back to Profile" disabled={busy} onClick={onBack} type="button"><Icon name="back" size={30} /></button>
      <h1>Import from MeowJot</h1>
      <span />
    </header>

    <section className="meowjot-import-intro">
      <span><Icon name="upload" size={34} /></span>
      <h2>Move your MeowJot history</h2>
      <p>Choose the raw CSV exported by MeowJot. The app converts Bangkok dates and imports every valid transaction directly into your connected Google Sheet.</p>
    </section>

    <section className="meowjot-import-rules">
      <h2>Before importing</h2>
      <ul>
        <li>The CSV must include Date, Time, Type, and Amount columns.</li>
        <li>Zero-amount rows are skipped.</li>
        <li>Importing the same file again will not duplicate transactions.</li>
      </ul>
    </section>

    {result && !result.cancelled && <section aria-live="polite" className="meowjot-import-result">
      <div><Icon name="sheet" size={25} /><span><strong>{result.fileName}</strong><small>{result.sourceRows} source rows</small></span></div>
      <dl>
        <div><dt>Imported</dt><dd>{result.imported}</dd></div>
        <div><dt>Already imported</dt><dd>{result.duplicates}</dd></div>
        <div><dt>Zero amount</dt><dd>{result.skippedZeroAmount}</dd></div>
      </dl>
    </section>}

    <button className="button button-primary button-large meowjot-import-action" disabled={busy} onClick={onImport} type="button">
      <Icon name="upload" />
      {busy ? 'Importing…' : result && !result.cancelled ? 'Choose another CSV' : 'Choose CSV and import'}
    </button>
    <p className="meowjot-import-note">The app only appends new rows. It does not change or delete existing transactions.</p>
  </main>
}
