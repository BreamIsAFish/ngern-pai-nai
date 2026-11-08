import { useEffect, useRef, useState } from 'react'
import type { ErrorDetails } from './errorDetails'
import copyText from './copyText'
import formatErrorReport from './formatErrorReport'
import Icon from './Icon'

interface Props {
  error: ErrorDetails
  onDismiss(): void
}

function ErrorDetailsDialog({ error, onClose }: { error: ErrorDetails; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [copyStatus, setCopyStatus] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])
  useEffect(() => {
    if (!copyStatus) return
    const timeout = window.setTimeout(() => setCopyStatus(''), 2000)
    return () => window.clearTimeout(timeout)
  }, [copyStatus])
  const close = () => { dialog.current?.close(); onClose() }
  const copy = async () => {
    setCopyStatus('')
    const copied = await copyText({ text: formatErrorReport(error), container: dialog.current! })
    setCopyStatus(copied ? 'Copied' : 'Copy failed')
  }

  return <dialog aria-labelledby="error-details-title" className="error-details-dialog" onCancel={(event) => { event.preventDefault(); close() }} ref={dialog}>
    <header><h2 id="error-details-title">Error details</h2><button aria-label="Close error details" onClick={close} type="button"><Icon name="close" size={24} /></button></header>
    <dl>
      <dt>Message</dt><dd>{error.message}</dd>
      {error.code && <><dt>Code</dt><dd>{error.code}</dd></>}
      {error.type && <><dt>Type</dt><dd>{error.type}</dd></>}
      {error.operation && <><dt>Operation</dt><dd>{error.operation}</dd></>}
      {error.data !== undefined && <><dt>Details</dt><dd><pre>{typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}</pre></dd></>}
      <dt>App time ISO</dt><dd>{error.appTime}</dd>
      <dt>User agent</dt><dd>{error.userAgent}</dd>
    </dl>
    <footer><button className="button button-secondary" onClick={() => void copy()} type="button">Copy</button><span role="status">{copyStatus}</span></footer>
  </dialog>
}

export default function ErrorToast({ error, onDismiss }: Props) {
  const [details, setDetails] = useState<ErrorDetails>()
  return <>
    <div className="toast error-toast" role="alert">
      <button aria-haspopup="dialog" className="toast-details" onClick={() => setDetails(error)} type="button"><span>{error.message}</span><small>Tap for details</small></button>
      <button className="toast-dismiss" onClick={onDismiss} type="button">Dismiss</button>
    </div>
    {details && <ErrorDetailsDialog error={details} onClose={() => setDetails(undefined)} />}
  </>
}
