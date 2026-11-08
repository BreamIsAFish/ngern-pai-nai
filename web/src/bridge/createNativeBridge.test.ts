import { afterEach, describe, expect, it, vi } from 'vitest'
import createNativeBridge, { BridgeRequestError, bridgeRequestTimeoutMs } from './createNativeBridge'

describe('bridgeRequestTimeoutMs', () => {
  it('keeps native settings and image pickers open while the user is deciding', () => {
    expect(bridgeRequestTimeoutMs('ai.openSettings')).toBe(900_000)
    expect(bridgeRequestTimeoutMs('receipts.pick')).toBe(900_000)
  })

  it('uses shorter limits for automatic native operations', () => {
    expect(bridgeRequestTimeoutMs('receipts.process')).toBe(90_000)
    expect(bridgeRequestTimeoutMs('app.getStatus')).toBe(20_000)
  })
})

describe('native bridge failures', () => {
  it('includes the failed operation when a request times out', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('window', { setTimeout: globalThis.setTimeout })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const bridge = createNativeBridge()
    const result = bridge.request('tags.list', {}).catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(await result).toBeInstanceOf(BridgeRequestError)
    expect(await result).toMatchObject({ code: 'TIMEOUT', operation: 'tags.list' })
  })

  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it.each([undefined, { type: 'FormatException', message: 'FormatException: Invalid transaction fields.' }])('preserves the complete native error response, including optional data', async (data) => {
    const postMessage = vi.fn()
    const browser = { FlutterBridge: { postMessage }, setTimeout: vi.fn(), NgernPaiNaiBridge: undefined as Window['NgernPaiNaiBridge'] }
    vi.stubGlobal('window', browser)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const bridge = createNativeBridge()
    const result = bridge.request('tags.list', {}).catch((error: unknown) => error)
    const { id } = JSON.parse(postMessage.mock.calls[0][0])
    browser.NgernPaiNaiBridge?.receive(JSON.stringify({ id, ok: false, error: { code: 'INVALID_REQUEST', message: 'Check the details and try again.', data } }))
    expect(await result).toBeInstanceOf(BridgeRequestError)
    expect(await result).toMatchObject({ code: 'INVALID_REQUEST', message: 'Check the details and try again.', data, operation: 'tags.list' })
  })
})
