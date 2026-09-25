import { describe, expect, it } from 'vitest'
import mapTransaction from './model'

describe('mapTransaction', () => {
  it('normalizes a valid bridge row into a transaction', () => {
    expect(mapTransaction({
      id: 'tx-1',
      date: '2026-09-17',
      time: '04:30:00',
      type: 'expense',
      amount: '120.50',
      category: 'Food',
      note: 'Lunch',
    })).toMatchObject({
      id: 'tx-1',
      amount: 120.5,
      type: 'expense',
    })
  })

  it('rejects an unsupported transaction type', () => {
    expect(() => mapTransaction({ type: 'refund', amount: 10 })).toThrow(
      'Transaction data is invalid.',
    )
  })

  it('accepts transfers', () => {
    expect(mapTransaction({ date: '2026-09-17', time: '00:00:00', type: 'transfer', amount: 10 }).type).toBe('transfer')
  })

  it('keeps an imported transaction uncategorized', () => {
    expect(mapTransaction({ date: '2026-09-17', time: '00:00:00', type: 'expense', amount: 10, category: '', source: 'receipt_ai' })).toMatchObject({
      category: null,
      source: 'receipt_ai',
      dateInferred: false,
    })
  })
})
