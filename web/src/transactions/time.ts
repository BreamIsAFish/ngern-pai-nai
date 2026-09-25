import type { Transaction, TransactionDraft, TransactionInput } from './model'

const pad = (value: number) => String(value).padStart(2, '0')

export function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function localTimeValue(date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function draftToUtcInput(draft: TransactionDraft): TransactionInput {
  const { localDate, localTime, ...input } = draft
  const iso = new Date(`${localDate}T${localTime}:00`).toISOString()
  return {
    ...input,
    category: input.category || null,
    date: iso.slice(0, 10),
    time: iso.slice(11, 19),
  }
}

export function transactionInstant(transaction: Pick<Transaction, 'date' | 'time'>): Date {
  return new Date(`${transaction.date}T${transaction.time}Z`)
}

export function transactionToDraft(transaction: Transaction): TransactionDraft {
  const instant = transactionInstant(transaction)
  return {
    localDate: localDateValue(instant), localTime: localTimeValue(instant), type: transaction.type,
    category: transaction.category ?? '', tag: transaction.tag, amount: transaction.amount,
    note: transaction.note, destination: transaction.destination,
    transactionNumber: transaction.transactionNumber, source: transaction.source,
    dateInferred: transaction.dateInferred,
  }
}

export function utcMonthForTransaction(transaction: Pick<Transaction, 'date'>): string {
  return transaction.date.slice(0, 7).replace('-', '_')
}

export function transactionLocalDate(transaction: Pick<Transaction, 'date' | 'time'>): string {
  return localDateValue(transactionInstant(transaction))
}

export function transactionLocalMonth(transaction: Pick<Transaction, 'date' | 'time'>): string {
  return transactionLocalDate(transaction).slice(0, 7)
}

export function utcMonthsForLocalMonth(localMonth: string): string[] {
  const [year, month] = localMonth.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)
  return [...new Set([start, end].map((date) => date.toISOString().slice(0, 7).replace('-', '_')))]
}

export function latestUtcMonths(now = new Date()): string[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1))
    return date.toISOString().slice(0, 7).replace('-', '_')
  })
}

export function utcMonthsForYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, index) => `${year}_${pad(index + 1)}`)
}
