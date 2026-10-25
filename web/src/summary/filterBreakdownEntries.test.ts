import { describe, expect, it } from 'vitest'
import mapTransaction, { type Transaction } from '../transactions/model'
import filterBreakdownEntries from './filterBreakdownEntries'

const entry = (id: string, values: Record<string, unknown>): Transaction => mapTransaction({ id, date: '2026-10-05', time: '12:00:00', amount: 10, ...values })

const rows = [
  entry('food-1', { type: 'expense', category: 'Food', tag: 'trip' }),
  entry('food-2', { type: 'expense', category: 'Food' }),
  entry('salary', { type: 'income', category: 'Food' }),
  entry('loose', { type: 'expense' }),
  entry('bus', { type: 'expense', category: 'Transport', tag: 'trip' }),
]

describe('filterBreakdownEntries', () => {
  it('keeps only entries in the tapped category for the active type', () => {
    expect(filterBreakdownEntries(rows, { breakdown: 'category', name: 'Food', type: 'expense' }).map((item) => item.id)).toEqual(['food-1', 'food-2'])
  })

  it('matches the uncategorized row', () => {
    expect(filterBreakdownEntries(rows, { breakdown: 'category', name: 'ไม่มีหมวดหมู่', type: 'expense' }).map((item) => item.id)).toEqual(['loose'])
  })

  it('filters by tag, including the untagged row', () => {
    expect(filterBreakdownEntries(rows, { breakdown: 'tag', name: 'trip', type: 'expense' }).map((item) => item.id)).toEqual(['food-1', 'bus'])
    expect(filterBreakdownEntries(rows, { breakdown: 'tag', name: 'No tag', type: 'expense' }).map((item) => item.id)).toEqual(['food-2', 'loose'])
  })
})
