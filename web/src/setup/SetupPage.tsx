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
          <div className="brand-mark">N</div>
          <span>Ngern Pai Nai</span>
        </div>

        <div className="setup-copy">
          <p className="eyebrow">Your money. Your sheet.</p>
          <h1>Know where your money went.</h1>
          <p className="setup-intro">
            Track income and spending in a private Google Sheet that only your account can access.
          </p>
        </div>

        <div className="setup-illustration" aria-hidden="true">
          <div className="paper paper-back" />
          <div className="paper paper-front">
            <span className="paper-line wide" />
            <span className="paper-line" />
            <span className="paper-line short" />
            <div className="paper-coin">฿</div>
          </div>
        </div>

        {error && <p className="error-banner" role="alert">{error}</p>}

        <button className="button button-primary button-large" disabled={busy} onClick={onConnect} type="button">
          <Icon name="sheet" />
          {busy ? 'Connecting...' : 'Continue with Google'}
        </button>
        <p className="privacy-note">We request access only to files this app creates.</p>
      </section>
    </main>
  )
}

