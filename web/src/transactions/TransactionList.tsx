import Icon from '../ui/Icon'
import type { Transaction } from './model'

interface TransactionListProps {
  transactions: Transaction[]
  onDelete?(transaction: Transaction): void
  onEdit?(transaction: Transaction): void
}

const categoryGlyphs: Record<string, string> = {
  Food: 'F',
  Housing: 'H',
  Salary: 'S',
  Shopping: 'B',
  Transport: 'T',
  Utilities: 'U',
}

const formatAmount = (transaction: Transaction) => new Intl.NumberFormat('en-US', {
  currency: transaction.currency,
  maximumFractionDigits: 2,
  style: 'currency',
}).format(transaction.amount).replace('THB', '฿')

const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
}).format(new Date(`${date}T00:00:00`))

export default function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Icon name="wallet" size={26} /></div>
        <h3>No transactions here</h3>
        <p>Try another month or add your first entry.</p>
      </div>
    )
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <article className="transaction-row" key={transaction.id}>
          <button className="transaction-main" onClick={() => onEdit?.(transaction)} type="button">
            <span className={`category-glyph ${transaction.type}`}>
              {categoryGlyphs[transaction.category] ?? transaction.category.slice(0, 1).toUpperCase()}
            </span>
            <span className="transaction-copy">
              <strong>{transaction.note || transaction.category}</strong>
              <small>{transaction.category} · {formatDate(transaction.occurredAt)}</small>
            </span>
            <span className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'expense' ? '−' : '+'}{formatAmount(transaction)}
            </span>
          </button>
          <button
            aria-label={`Delete ${transaction.note || transaction.category}`}
            className="delete-button"
            onClick={() => onDelete?.(transaction)}
            type="button"
          >
            <Icon name="close" size={16} />
          </button>
        </article>
      ))}
    </div>
  )
}

