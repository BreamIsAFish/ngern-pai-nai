import type { Transaction, TransactionType } from '../transactions/model'

export type LedgerFilter = 'all' | TransactionType

/** Filters the ledger without affecting the month's headline totals. */
export function filterTransactions(rows: Transaction[], filter: LedgerFilter): Transaction[] {
  return filter === 'all' ? rows : rows.filter((row) => row.type === filter)
}

/** Totals each transaction type independently, including transferred amounts. */
export function transactionTotals(rows: Transaction[]): Record<TransactionType, number> {
  return rows.reduce((totals, row) => {
    totals[row.type] += row.amount
    return totals
  }, { expense: 0, income: 0, transfer: 0 })
}
