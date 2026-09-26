export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionSource = 'manual' | 'receipt_ai'

export interface TransactionInput {
  date: string
  time: string
  type: TransactionType
  category: string | null
  tag: string | null
  amount: number
  note: string
  destination: string | null
  transactionNumber: string | null
  source: TransactionSource
  dateInferred: boolean
}

export interface Transaction extends TransactionInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface TransactionDraft {
  localDate: string
  localTime: string
  type: TransactionType
  category: string
  tag: string | null
  amount: number
  note: string
  destination: string | null
  transactionNumber: string | null
  source: TransactionSource
  dateInferred: boolean
}

/** Converts an unknown native-bridge value into a validated transaction. */
export default function mapTransaction(value: unknown): Transaction {
  if (!value || typeof value !== 'object') throw new Error('Transaction data is missing.')
  const row = value as Record<string, unknown>
  const type = row.type === 'income' || row.type === 'expense' || row.type === 'transfer' ? row.type : null
  const amount = Number(row.amount)
  if (!type || !Number.isFinite(amount) || amount <= 0) throw new Error('Transaction data is invalid.')
  return {
    id: String(row.id ?? ''),
    date: String(row.date ?? ''),
    time: String(row.time ?? ''),
    type,
    category: typeof row.category === 'string' && row.category ? row.category : type === 'transfer' ? 'Transfer' : null,
    tag: typeof row.tag === 'string' && row.tag ? row.tag : null,
    amount,
    note: String(row.note ?? ''),
    destination: typeof row.destination === 'string' && row.destination ? row.destination : null,
    transactionNumber: typeof row.transactionNumber === 'string' && row.transactionNumber ? row.transactionNumber : null,
    source: row.source === 'receipt_ai' ? 'receipt_ai' : 'manual',
    dateInferred: row.dateInferred === true,
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
  }
}
