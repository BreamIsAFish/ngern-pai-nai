import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BridgeRequestError } from '../bridge/createNativeBridge'
import errorDetails from './errorDetails'

const context = { appTime: '2026-09-20T12:00:00.000Z', userAgent: 'Test WKWebView' }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(context.appTime))
  vi.stubGlobal('navigator', { userAgent: context.userAgent })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('error details', () => {
  it('keeps the bridge message, code, type and structured native details', () => {
    const data = { type: 'FormatException', message: 'FormatException: Invalid transaction fields.' }
    expect(errorDetails(new BridgeRequestError('INVALID_REQUEST', 'Check the details and try again.', data, 'transactions.update'))).toEqual({
      ...context, message: 'Check the details and try again.', type: 'BridgeRequestError', code: 'INVALID_REQUEST', data, operation: 'transactions.update',
    })
  })

  it('supports an installed native app that returns no extra details', () => {
    expect(errorDetails(new BridgeRequestError('INVALID_REQUEST', 'Check the details and try again.'))).toEqual({
      ...context, message: 'Check the details and try again.', code: 'INVALID_REQUEST', type: 'BridgeRequestError', data: undefined, operation: undefined,
    })
  })

  it('preserves duplicate receipt recovery data', () => {
    expect(errorDetails(new BridgeRequestError('DUPLICATE_RECEIPT', 'รายการนี้ซ้ำกับรายการที่มีอยู่', { id: 'receipt-1' })).data).toEqual({ id: 'receipt-1' })
  })

  it('keeps ordinary errors, validation messages, and fallbacks readable', () => {
    expect(errorDetails(new TypeError('Invalid response'))).toEqual({ ...context, type: 'TypeError', message: 'Invalid response' })
    expect(errorDetails('Choose a category.')).toEqual({ ...context, message: 'Choose a category.' })
    expect(errorDetails(null, 'Could not save.')).toEqual({ ...context, message: 'Could not save.', data: null })
    expect(errorDetails(undefined, 'Could not save.')).toEqual({ ...context, message: 'Could not save.' })
    expect(errorDetails(new Error(''), 'Could not save.').message).toBe('Could not save.')
  })
})
