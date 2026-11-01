import { describe, expect, it } from 'vitest'
import mapTransaction from '../transactions/model'
import matchesTransactionSearch from './matchesTransactionSearch'

const transaction = mapTransaction({ id: 'one', date: '2026-10-05', time: '12:00:00', type: 'expense', amount: 10, tag: 'food, trip' })

describe('matchesTransactionSearch', () => {
  it('matches any individual tag', () => {
    expect(matchesTransactionSearch(transaction, 'trip')).toBe(true)
    expect(matchesTransactionSearch(transaction, 'food')).toBe(true)
    expect(matchesTransactionSearch(transaction, 'transit')).toBe(false)
  })
})
