import CategoryIcon from '../categories/CategoryIcon'
import type { Category } from '../categories/model'
import type { Transaction } from './model'
import summarizeDailyTransactions from './summarizeDailyTransactions'
import { transactionInstant, transactionLocalDate } from './time'
import TransactionDailySummary from './TransactionDailySummary'

interface Props { categories: Category[]; transactions: Transaction[]; onEdit(item: Transaction): void }
const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export default function TransactionList({ categories, transactions, onEdit }: Props) {
  const sorted = [...transactions].sort((a, b) => transactionInstant(b).getTime() - transactionInstant(a).getTime())
  const groups = sorted.reduce<Map<string, Transaction[]>>((result, item) => {
    const date = transactionLocalDate(item)
    result.set(date, [...(result.get(date) ?? []), item])
    return result
  }, new Map())
  if (!sorted.length) return <div className="ledger-empty"><div className="cat-empty">฿</div><h2>No entries yet</h2><p>Tap Add entry to start this month.</p></div>
  return <div className="date-groups">{[...groups].map(([date, items]) => {
    const dailySummary = summarizeDailyTransactions(items)
    return <section className="date-group" key={date}>
      <header><div><b>{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${date}T12:00:00`))}</b><strong>{Number(date.slice(-2))}</strong></div></header>
      <TransactionDailySummary summary={dailySummary} />
      {items.map((item) => <button className={`ledger-row ${item.type}`} key={item.id} onClick={() => onEdit(item)} type="button">
        <span className="row-icon"><CategoryIcon iconUrl={categories.find((category) => category.type === item.type && category.name === item.category)?.iconUrl ?? null} /></span>
        <span className="row-copy"><strong>{item.category ?? 'ไม่มีหมวดหมู่'}</strong><span>{item.destination ?? (item.note || 'No note')}</span>{item.destination && item.note && <small>{item.note}</small>}{item.tag && <small>#{item.tag}</small>}{item.dateInferred && <small className="receipt-warning">วันที่โดยประมาณ</small>}<small>{new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(transactionInstant(item))}</small></span>
        <b className="row-amount">{item.type === 'income' ? '+' : ''}{money.format(item.amount)}</b>
      </button>)}
    </section>
  })}</div>
}
