import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { BridgeClient } from './types'

let createMockBridge: () => BridgeClient

beforeAll(async () => {
  vi.stubGlobal('window', { location: { search: '' }, setTimeout: globalThis.setTimeout })
  createMockBridge = (await import('./createMockBridge')).default
})
afterAll(() => vi.unstubAllGlobals())

describe('transactions.update', () => {
  it('changes type in place, preserves id and creation time, and refreshes the update time', async () => {
    const bridge = createMockBridge()
    const utcMonths = [new Date().toISOString().slice(0, 7).replace('-', '_')]
    const before = await bridge.request('transactions.list', { utcMonths })
    const original = before.transactions.find((transaction) => transaction.id === 'mock-1')!
    const { id, createdAt, updatedAt, ...input } = original
    const updated = await bridge.request('transactions.update', {
      id, sourceUtcMonth: utcMonths[0],
      transaction: { ...input, type: 'transfer', category: 'Transfer', tag: null, destination: 'Savings' },
    })

    expect(updated).toEqual({ ...original, type: 'transfer', category: 'Transfer', destination: 'Savings', updatedAt: expect.any(String) })
    expect(updated.id).toBe(id)
    expect(updated.createdAt).toBe(createdAt)
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(updatedAt).getTime())
    const after = await bridge.request('transactions.list', { utcMonths })
    expect(after.transactions).toHaveLength(before.transactions.length)
    expect(after.transactions.filter((transaction) => transaction.id === id)).toEqual([updated])
    expect(after.transactions.filter((transaction) => transaction.id !== id)).toEqual(before.transactions.filter((transaction) => transaction.id !== id))
  })

  it('does not insert a row when the update id is missing', async () => {
    const bridge = createMockBridge()
    const utcMonths = [new Date().toISOString().slice(0, 7).replace('-', '_')]
    const before = await bridge.request('transactions.list', { utcMonths })
    await expect(bridge.request('transactions.update', {
      id: 'missing', sourceUtcMonth: utcMonths[0], transaction: before.transactions[0],
    })).rejects.toThrow('Transaction not found.')
    expect(await bridge.request('transactions.list', { utcMonths })).toEqual(before)
  })
})
