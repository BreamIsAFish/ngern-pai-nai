import { useMemo, useState } from 'react'
import Icon from '../ui/Icon'
import type { Transaction, TransactionInput, TransactionType } from './model'
import validateTransaction from './validation'

interface TransactionFormProps {
  busy: boolean
  transaction?: Transaction
  onCancel?(): void
  onSubmit?(transaction: TransactionInput): void
}

const categoriesByType: Record<TransactionType, string[]> = {
  expense: ['Food', 'Transport', 'Shopping', 'Housing', 'Utilities', 'Health', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Interest', 'Other'],
}

export default function TransactionForm({ busy, transaction, onCancel, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [category, setCategory] = useState(transaction?.category ?? 'Food')
  const [occurredAt, setOccurredAt] = useState(transaction?.occurredAt ?? new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState(transaction?.note ?? '')
  const [submitted, setSubmitted] = useState(false)

  const input = useMemo<TransactionInput>(() => ({
    amount: Number(amount),
    category,
    currency: 'THB',
    note: note.trim(),
    occurredAt,
    type,
  }), [amount, category, note, occurredAt, type])
  const errors = submitted ? validateTransaction(input) : {}

  const chooseType = (nextType: TransactionType) => {
    setType(nextType)
    setCategory(categoriesByType[nextType][0])
  }

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(validateTransaction(input)).length === 0) onSubmit?.(input)
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <section aria-labelledby="transaction-form-title" aria-modal="true" className="form-sheet" role="dialog">
        <header className="form-header">
          <div>
            <p className="eyebrow">{transaction ? 'Update entry' : 'New entry'}</p>
            <h2 id="transaction-form-title">{transaction ? 'Edit transaction' : 'Add transaction'}</h2>
          </div>
          <button aria-label="Close" className="icon-button" onClick={onCancel} type="button"><Icon name="close" /></button>
        </header>

        <div className="type-switch" role="group" aria-label="Transaction type">
          {(['expense', 'income'] as const).map((value) => (
            <button
              className={type === value ? 'active' : ''}
              key={value}
              onClick={() => chooseType(value)}
              type="button"
            >
              {value === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <label className="amount-field">
          <span>Amount</span>
          <div><small>฿</small><input autoFocus inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="0" value={amount} /></div>
          {errors.amount && <em>{errors.amount}</em>}
        </label>

        <div className="form-grid">
          <label>
            <span>Category</span>
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              {categoriesByType[type].map((item) => <option key={item}>{item}</option>)}
            </select>
            {errors.category && <em>{errors.category}</em>}
          </label>
          <label>
            <span>Date</span>
            <input onChange={(event) => setOccurredAt(event.target.value)} type="date" value={occurredAt} />
            {errors.occurredAt && <em>{errors.occurredAt}</em>}
          </label>
        </div>

        <label>
          <span>Note <small>Optional</small></span>
          <input maxLength={160} onChange={(event) => setNote(event.target.value)} placeholder="What was this for?" value={note} />
        </label>

        <button className="button button-primary button-large" disabled={busy} onClick={submit} type="button">
          {busy ? 'Saving...' : transaction ? 'Save changes' : 'Add transaction'}
        </button>
      </section>
    </div>
  )
}

