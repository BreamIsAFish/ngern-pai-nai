import { type CSSProperties, useMemo, useState } from 'react'
import CategoryIcon from '../categories/CategoryIcon'
import type { Category } from '../categories/model'
import MonthPickerDialog from '../month-picker/MonthPickerDialog'
import type { Transaction, TransactionType } from '../transactions/model'
import { transactionLocalMonth } from '../transactions/time'
import Icon from '../ui/Icon'
import Hamster from '../ui/Hamster'
import BottomNav from '../ui/BottomNav'

interface Props {
  categories: Category[]
  initialView?: 'chart' | 'list'
  monthPickerOpenInitially?: boolean
  latestMonth: string
  loading: boolean
  month: string
  transactions: Transaction[]
  onAdd(): void
  onScanReceipt(): void
  onOpenProfile(): void
  onBack(): void
  onChangeMonth(value: string): void
}

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const palette = ['var(--chart-color-1)', 'var(--chart-color-2)', 'var(--chart-color-3)', 'var(--chart-color-4)', 'var(--chart-color-5)']

export default function SummaryPage({ categories, initialView = 'chart', latestMonth, loading, month, monthPickerOpenInitially = false, transactions, onAdd, onScanReceipt, onOpenProfile, onBack, onChangeMonth }: Props) {
  const [type, setType] = useState<TransactionType>('expense')
  const [breakdown, setBreakdown] = useState<'category' | 'tag'>('category')
  const [view, setView] = useState(initialView)
  const [monthPickerOpen, setMonthPickerOpen] = useState(monthPickerOpenInitially)
  const rows = useMemo(() => transactions.filter((item) => transactionLocalMonth(item) === month), [month, transactions])
  const total = (kind: TransactionType) => rows.filter((item) => item.type === kind).reduce((sum, item) => sum + item.amount, 0)
  const selected = rows.filter((item) => item.type === type)
  const selectedTotal = total(type)
  const grouped = selected.reduce<Record<string, number>>((result, item) => {
    const key = breakdown === 'category' ? item.category ?? 'ไม่มีหมวดหมู่' : item.tag ?? 'No tag'
    return { ...result, [key]: (result[key] ?? 0) + item.amount }
  }, {})
  const groups = Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount, count: selected.filter((item) => (breakdown === 'category' ? item.category ?? 'ไม่มีหมวดหมู่' : item.tag ?? 'No tag') === name).length }))
    .sort((a, b) => b.amount - a.amount)
    .map((group, index) => ({
      ...group,
      color: breakdown === 'category' && group.name === 'ไม่มีหมวดหมู่' ? 'var(--chart-color-5)' : palette[index % palette.length],
      iconUrl: breakdown === 'category'
        ? categories.find((category) => category.type === type && category.name === group.name)?.iconUrl ?? null
        : null,
    }))
  const gradient = groups.length
    ? groups.map((group, index) => `${group.color} ${groups.slice(0, index).reduce((sum, item) => sum + item.amount, 0) / selectedTotal * 100}% ${groups.slice(0, index + 1).reduce((sum, item) => sum + item.amount, 0) / selectedTotal * 100}%`).join(',')
    : '#1d1d22 0 100%'
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))
  const shiftMonth = (amount: number) => {
    const [year, monthNumber] = month.split('-').map(Number)
    const value = new Date(year, monthNumber - 1 + amount, 1)
    onChangeMonth(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`)
  }

  return <main aria-busy={loading} className="summary-page">
    <header className="summary-header">
      <strong className="summary-title">Summary</strong>
      <div className="summary-month-nav">
        <button aria-label="Previous month" onClick={() => shiftMonth(-1)} type="button"><Icon name="back" size={18} /></button>
        <button aria-label={`Select month, ${monthLabel}`} className="month-label-button" onClick={() => setMonthPickerOpen(true)} type="button"><strong>{monthLabel}</strong></button>
        <button aria-label="Next month" disabled={month >= latestMonth} onClick={() => shiftMonth(1)} type="button"><Icon name="chevron-right" size={18} /></button>
      </div>
    </header>
    <div className="summary-tabs">{(['expense', 'income', 'transfer'] as const).map((value) => <button className={type === value ? 'active' : ''} key={value} onClick={() => setType(value)} type="button">{value}</button>)}</div>
    <section className="chart-area">
      <div className="chart-tools"><button aria-label="Chart view" className={view === 'chart' ? 'active' : ''} onClick={() => setView('chart')} type="button"><Icon name="chart" /></button><button aria-label="List view" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} type="button"><Icon name="list" /></button></div>
      {view === 'chart' && <section className="summary-chart-card">
        <div aria-label={`${type} total ${money.format(selectedTotal)}`} className="donut" role="img" style={{ background: `conic-gradient(${gradient})` }}><div><span>Total</span><strong>฿{money.format(selectedTotal)}</strong></div></div>
        <div className="chart-legend">{groups.map((group) => <span key={group.name} style={{ '--breakdown-color': group.color } as CSSProperties}><i />{group.name} {selectedTotal ? Math.round(group.amount / selectedTotal * 100) : 0}%</span>)}<small>{selected.length} {type} {selected.length === 1 ? 'entry' : 'entries'}</small></div>
        <Hamster className="chart-hamster" pose="peek" size={80} />
      </section>}
      <div className="breakdown-tabs"><button className={breakdown === 'category' ? 'active' : ''} onClick={() => setBreakdown('category')} type="button">Categories</button><button className={breakdown === 'tag' ? 'active' : ''} onClick={() => setBreakdown('tag')} type="button">Tags</button></div>
      <div className="breakdown-list">{groups.map((group) => <div key={group.name} style={{ '--breakdown-color': group.color } as CSSProperties}>
        <span className="breakdown-icon">{breakdown === 'category' ? <CategoryIcon iconUrl={group.iconUrl} /> : <Icon name="tag" />}</span>
        <strong className="breakdown-name"><span><span aria-hidden="true" className="breakdown-color" />{group.name}</span><small>{group.count} {group.count === 1 ? 'entry' : 'entries'}</small></strong><b>฿{money.format(group.amount)}</b>
        <span aria-hidden="true" className="breakdown-track"><span style={{ width: `${selectedTotal ? group.amount / selectedTotal * 100 : 0}%` }} /></span>
      </div>)}{!groups.length && <p>No {type} entries this month.</p>}</div>
      {groups.length > 0 && <div className="summary-tip"><Hamster pose="sleep" size={60} /><p>{groups[0].name} is {selectedTotal ? Math.round(groups[0].amount / selectedTotal * 100) : 0}% of your {type === 'expense' ? 'spending' : type === 'income' ? 'income' : 'transfers'} this month.</p></div>}
    </section>
    <BottomNav active="summary" onHome={onBack} onSummary={() => window.scrollTo(0, 0)} onAdd={onAdd} onScanReceipt={onScanReceipt} onProfile={onOpenProfile} />
    {monthPickerOpen && <MonthPickerDialog latestMonth={latestMonth} month={month} onCancel={() => setMonthPickerOpen(false)} onSelect={(value) => { setMonthPickerOpen(false); onChangeMonth(value) }} />}
  </main>
}
