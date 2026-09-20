import type { Transaction } from './model'

export interface DailyTransactionSummary {
  expenseTotal: number
  incomeTotal: number
  transferCount: number
}

/**
 * Totals one day's transactions by transaction type.
 *
 * @param transactions - Transactions that belong to one local calendar day.
 * @returns Expense and income amounts plus the number of transfers.
 *
 * @example
 * summarizeDailyTransactions(dayTransactions)
 */
export default function summarizeDailyTransactions(transactions: readonly Transaction[]): DailyTransactionSummary {
  return transactions.reduce<DailyTransactionSummary>((summary, transaction) => {
    if (transaction.type === 'transfer') summary.transferCount += 1
    else if (transaction.type === 'income') summary.incomeTotal += transaction.amount
    else summary.expenseTotal += transaction.amount
    return summary
  }, { expenseTotal: 0, incomeTotal: 0, transferCount: 0 })
}
