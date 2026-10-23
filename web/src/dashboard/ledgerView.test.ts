import { describe, expect, it } from 'vitest'
import mapTransaction from '../transactions/model'
import { filterTransactions, transactionTotals } from './ledgerView'

const rows = [
  mapTransaction({ id: 'food', type: 'expense', amount: 120 }),
  mapTransaction({ id: 'train', type: 'expense', amount: 65 }),
  mapTransaction({ id: 'salary', type: 'income', amount: 48000 }),
  mapTransaction({ id: 'refund', type: 'income', amount: 383.62 }),
  mapTransaction({ id: 'savings', type: 'transfer', amount: 4000 }),
]

describe('Home ledger', () => {
  it('shows all rows by default and filters each type without changing their order', () => {
    expect(filterTransactions(rows, 'all')).toEqual(rows)
    expect(filterTransactions(rows, 'expense').map((row) => row.id)).toEqual(['food', 'train'])
    expect(filterTransactions(rows, 'income').map((row) => row.id)).toEqual(['salary', 'refund'])
    expect(filterTransactions(rows, 'transfer').map((row) => row.id)).toEqual(['savings'])
    expect(rows).toHaveLength(5)
  })

  it('keeps income, expense and transfer totals independent', () => {
    expect(transactionTotals(rows)).toEqual({ expense: 185, income: 48383.62, transfer: 4000 })
    expect(transactionTotals([])).toEqual({ expense: 0, income: 0, transfer: 0 })
    expect(filterTransactions([], 'income')).toEqual([])
  })
})
