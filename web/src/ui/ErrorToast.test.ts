import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ErrorToast from './ErrorToast'

describe('error toast', () => {
  it('offers separate details and dismiss actions while keeping diagnostics out of the short toast', () => {
    const html = renderToStaticMarkup(createElement(ErrorToast, {
      error: { appTime: '2026-09-20T12:00:00.000Z', userAgent: 'Test WKWebView', message: 'Could not save.', code: 'INVALID_REQUEST', data: { message: 'Invalid transaction fields.' } },
      onDismiss() {},
    }))
    expect(html).toContain('role="alert"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('Tap for details')
    expect(html).toContain('Dismiss')
    expect(html).not.toContain('Invalid transaction fields.')
    expect(html).toMatchInlineSnapshot(`"<div class="toast error-toast" role="alert"><button aria-haspopup="dialog" class="toast-details" type="button"><span>Could not save.</span><small>Tap for details</small></button><button class="toast-dismiss" type="button">Dismiss</button></div>"`)
  })
})
