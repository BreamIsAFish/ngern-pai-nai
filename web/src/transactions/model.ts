export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  occurredAt: string
  type: TransactionType
  amount: number
  currency: string
  category: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface TransactionInput {
  occurredAt: string
  type: TransactionType
  amount: number
  currency: string
  category: string
  note: string
}

/** Converts an unknown bridge value into a transaction with normalized fields. */
export default function mapTransaction(value: unknown): Transaction {
  if (!value || typeof value !== 'object') {
    throw new Error('Transaction data is missing.')
  }

  const row = value as Record<string, unknown>
  const type = row.type === 'income' ? 'income' : row.type === 'expense' ? 'expense' : null
  const amount = Number(row.amount)

  if (!type || !Number.isFinite(amount) || amount < 0) {
    throw new Error('Transaction data is invalid.')
  }

  return {
    id: String(row.id ?? ''),
    occurredAt: String(row.occurredAt ?? ''),
    type,
    amount,
    currency: String(row.currency ?? 'THB'),
    category: String(row.category ?? 'Other'),
    note: String(row.note ?? ''),
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
  }
}

