import { describe, expect, it } from 'vitest'
import mapTransaction from './model'

describe('mapTransaction', () => {
  it('normalizes a valid bridge row into a transaction', () => {
    expect(mapTransaction({
      id: 'tx-1',
      occurredAt: '2026-09-17',
      type: 'expense',
      amount: '120.50',
      category: 'Food',
      note: 'Lunch',
    })).toMatchObject({
      id: 'tx-1',
      amount: 120.5,
      currency: 'THB',
      type: 'expense',
    })
  })

  it('rejects an unsupported transaction type', () => {
    expect(() => mapTransaction({ type: 'transfer', amount: 10 })).toThrow(
      'Transaction data is invalid.',
    )
  })
})

