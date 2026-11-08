import { describe, expect, it } from 'vitest'
import formatErrorReport from './formatErrorReport'

const context = { appTime: '2026-09-20T12:00:00.000Z', userAgent: 'Test WKWebView' }

describe('error report', () => {
  it('includes every diagnostic field in readable plain text', () => {
    expect(formatErrorReport({
      ...context, message: 'Could not save.', code: 'INVALID_REQUEST', type: 'BridgeRequestError',
      operation: 'transactions.update', data: { message: 'Invalid fields.\nCheck amount.' },
    })).toBe([
      'Message: Could not save.', 'Code: INVALID_REQUEST', 'Type: BridgeRequestError',
      'Operation: transactions.update', 'Details JSON: {\n  "message": "Invalid fields.\\nCheck amount."\n}',
      `App time ISO: ${context.appTime}`, `User agent: ${context.userAgent}`,
    ].join('\n'))
  })

  it('keeps fields present when the error has no optional diagnostics', () => {
    expect(formatErrorReport({ ...context, message: 'Choose a category.' })).toContain(
      'Code: Not available\nType: Not available\nOperation: Not available\nDetails JSON: null',
    )
  })

  it('encodes string details as JSON', () => {
    expect(formatErrorReport({ ...context, message: 'Failed.', data: 'Native detail' })).toContain('Details JSON: "Native detail"')
  })
})
