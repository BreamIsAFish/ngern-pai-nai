import { describe, expect, it } from 'vitest'
import { bridgeRequestTimeoutMs } from './createNativeBridge'

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
