import { useMemo, useState } from 'react'
import type { AppStatus } from '../bridge/types'
import type { Transaction } from '../transactions/model'
import TransactionList from '../transactions/TransactionList'
import Icon from '../ui/Icon'
import SummaryCard from './SummaryCard'

interface DashboardPageProps {
  status: AppStatus
  transactions: Transaction[]
  onAdd?(): void
  onDelete?(transaction: Transaction): void
  onEdit?(transaction: Transaction): void
  onOpenSettings?(): void
}

export default function DashboardPage({
  status,
  transactions,
  onAdd,
  onDelete,
  onEdit,
  onOpenSettings,
}: DashboardPageProps) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [category, setCategory] = useState('All')
  const categories = useMemo(
    () => ['All', ...new Set(transactions.map((transaction) => transaction.category))],
    [transactions],
  )
  const filtered = useMemo(() => transactions
    .filter((transaction) => transaction.occurredAt.startsWith(month))
    .filter((transaction) => category === 'All' || transaction.category === category)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)), [category, month, transactions])
  const monthTransactions = transactions.filter((transaction) => transaction.occurredAt.startsWith(month))
  const income = monthTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0)
  const expenses = monthTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`))

  return (
    <main className="app-shell dashboard-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Money overview</p>
          <h1>Ngern Pai Nai</h1>
        </div>
        <button aria-label="Open settings" className="icon-button" onClick={onOpenSettings} type="button"><Icon name="settings" /></button>
      </header>

      <SummaryCard balance={income - expenses} expenses={expenses} income={income} monthLabel={monthLabel} />

      <section className="activity-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Activity</p>
            <h2>Transactions</h2>
          </div>
          <span>{filtered.length} entries</span>
        </div>

        <div className="filter-row">
          <label className="filter-control">
            <Icon name="calendar" size={17} />
            <input aria-label="Filter by month" onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
          </label>
          <label className="filter-control">
            <Icon name="filter" size={17} />
            <select aria-label="Filter by category" onChange={(event) => setCategory(event.target.value)} value={category}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <TransactionList onDelete={onDelete} onEdit={onEdit} transactions={filtered} />
      </section>

      <button className="fab" onClick={onAdd} type="button"><Icon name="plus" /><span>Add transaction</span></button>
      <footer className="data-note"><Icon name="sheet" size={16} /> Saved to {status.spreadsheetName ?? 'your private Google Sheet'}</footer>
    </main>
  )
}

