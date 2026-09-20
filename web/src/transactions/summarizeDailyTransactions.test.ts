import { describe, expect, it } from 'vitest'
import type { Transaction } from './model'
import summarizeDailyTransactions from './summarizeDailyTransactions'

const transaction = (type: Transaction['type'], amount: number): Transaction => ({
  amount,
  category: type === 'transfer' ? 'Transfer' : 'Test',
  createdAt: '2026-09-20T12:00:00.000Z',
  date: '2026-09-20',
  destination: null,
  id: `${type}-${amount}`,
  note: '',
  tag: null,
  time: '12:00:00',
  type,
  updatedAt: '2026-09-20T12:00:00.000Z',
})

describe('summarizeDailyTransactions', () => {
  it('totals income and expenses while counting transfers without adding their amounts', () => {
    const transactions = [
      transaction('income', 6000),
      transaction('income', 383.62),
      transaction('expense', 100),
      transaction('transfer', 200),
      transaction('transfer', 500),
    ]

    expect(summarizeDailyTransactions(transactions)).toEqual({
      expenseTotal: 100,
      incomeTotal: 6383.62,
      transferCount: 2,
    })
  })

  it('returns zero values for a day without transactions', () => {
    expect(summarizeDailyTransactions([])).toEqual({
      expenseTotal: 0,
      incomeTotal: 0,
      transferCount: 0,
    })
  })
})
