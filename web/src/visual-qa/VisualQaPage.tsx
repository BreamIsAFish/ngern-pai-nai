import { visualQaScreens } from './screens'

export default function VisualQaPage() {
  return <main className="visual-qa-page">
    <header>
      <p>MeowJot visual QA</p>
      <h1>Reference and Playwright captures</h1>
      <span>Viewport 414 × 896. Refresh after running <code>pnpm visual:capture</code>.</span>
    </header>
    <section className="visual-qa-grid">
      {visualQaScreens.map((screen) => <article className="visual-qa-card" key={screen.id}>
        <div className="visual-qa-card-heading">
          <div><h2>{screen.label}</h2><code>{screen.route}</code></div>
          <span className={screen.referenceAvailable ? 'capture-ready' : 'capture-missing'}>{screen.referenceAvailable ? 'Captured' : 'No reference supplied'}</span>
        </div>
        <div className="visual-qa-pair">
          <figure>
            <figcaption>Expected · {screen.referenceFile}</figcaption>
            {screen.referenceAvailable ? <img alt={`${screen.label} reference`} src={`/visual-qa/reference/${screen.referenceFile}`} /> : <div className="missing-reference">This extra QA state has no supplied reference image.</div>}
          </figure>
          <figure>
            <figcaption>Actual · {screen.actualFile}</figcaption>
            <img alt={`${screen.label} Playwright capture`} src={`/visual-qa/actual/${screen.actualFile}`} />
          </figure>
        </div>
      </article>)}
    </section>
  </main>
}
