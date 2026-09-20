import Icon from '../ui/Icon'

interface SetupPageProps {
  busy: boolean
  error?: string
  onConnect?(): void
}

export default function SetupPage({ busy, error, onConnect }: SetupPageProps) {
  return (
    <main className="setup-page">
      <div className="setup-ambient setup-ambient-one" />
      <div className="setup-ambient setup-ambient-two" />
      <section className="setup-content">
        <div className="brand-lockup">
          <div className="brand-mark">฿</div>
          <span>Ngern Pai Nai</span>
        </div>

        <div className="setup-copy">
          <p className="eyebrow">Your friendly money journal</p>
          <h1>Let’s follow your money trail.</h1>
          <p className="setup-intro">
            Jot down income and spending, then keep every entry in your own Google Sheet.
          </p>
        </div>

        <div className="setup-illustration" aria-hidden="true">
          <div className="welcome-cat">
            <span className="welcome-cat-face">•ᴗ•</span>
            <span className="welcome-cat-paw">฿</span>
          </div>
          <div className="receipt-card">
            <span />
            <span />
            <strong>฿ 1,240</strong>
          </div>
        </div>

        {error && <p className="error-banner" role="alert">{error}</p>}

        <button className="button button-primary button-large" disabled={busy} onClick={onConnect} type="button">
          <Icon name="sheet" />
          {busy ? 'Connecting...' : 'Start with Google'}
        </button>
        <p className="privacy-note">Your transactions stay in your Google Sheet.</p>
      </section>
    </main>
  )
}
