import { useMemo, useState } from 'react'
import MonthPickerDialog from '../month-picker/MonthPickerDialog'
import type { Transaction, TransactionType } from '../transactions/model'
import { transactionLocalMonth } from '../transactions/time'
import Icon from '../ui/Icon'

interface Props {
  initialView?: 'chart' | 'list'
  monthPickerOpenInitially?: boolean
  latestMonth: string
  loading: boolean
  month: string
  transactions: Transaction[]
  onBack(): void
  onChangeMonth(value: string): void
}

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const palette = ['#c8ff00', '#ea19ed', '#ff5eea', '#ff9d00', '#27d17f']

export default function SummaryPage({ initialView = 'chart', latestMonth, loading, month, monthPickerOpenInitially = false, transactions, onBack, onChangeMonth }: Props) {
  const [type, setType] = useState<TransactionType>('expense')
  const [breakdown, setBreakdown] = useState<'category' | 'tag'>('category')
  const [view, setView] = useState(initialView)
  const [monthPickerOpen, setMonthPickerOpen] = useState(monthPickerOpenInitially)
  const rows = useMemo(() => transactions.filter((item) => transactionLocalMonth(item) === month), [month, transactions])
  const total = (kind: TransactionType) => rows.filter((item) => item.type === kind).reduce((sum, item) => sum + item.amount, 0)
  const selected = rows.filter((item) => item.type === type)
  const selectedTotal = total(type)
  const grouped = selected.reduce<Record<string, number>>((result, item) => {
    const key = breakdown === 'category' ? item.category : item.tag ?? 'No tag'
    return { ...result, [key]: (result[key] ?? 0) + item.amount }
  }, {})
  const groups = Object.entries(grouped).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  const gradient = groups.length
    ? groups.map((_, index) => `${palette[index % palette.length]} ${groups.slice(0, index).reduce((sum, item) => sum + item.amount, 0) / selectedTotal * 100}% ${groups.slice(0, index + 1).reduce((sum, item) => sum + item.amount, 0) / selectedTotal * 100}%`).join(',')
    : '#173751 0 100%'
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))
  const shiftMonth = (amount: number) => {
    const [year, monthNumber] = month.split('-').map(Number)
    const value = new Date(year, monthNumber - 1 + amount, 1)
    onChangeMonth(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`)
  }

  return <main aria-busy={loading} className="summary-page">
    <header className="summary-header">
      <button aria-label="Back" onClick={onBack} type="button"><Icon name="back" size={29} /></button>
      <div className="summary-month-nav">
        <button aria-label="Previous month" onClick={() => shiftMonth(-1)} type="button"><Icon name="back" size={27} /></button>
        <button aria-label={`Select month, ${monthLabel}`} className="month-label-button" onClick={() => setMonthPickerOpen(true)} type="button"><Icon name="calendar" size={19} /><strong>{monthLabel}</strong></button>
        <button aria-label="Next month" disabled={month >= latestMonth} onClick={() => shiftMonth(1)} type="button"><Icon name="chevron-right" size={27} /></button>
      </div>
      <button aria-label="Wallets, coming later" disabled title="Coming later" type="button"><Icon name="wallet" size={24} /></button>
    </header>
    <section className="summary-totals">
      <div><span><Icon name="arrow-down" size={15} /> Income</span><b className="green">+{money.format(total('income'))}</b></div>
      <strong>Balance {money.format(total('income') - total('expense'))}</strong>
      <div><span><Icon name="arrow-up" size={15} /> Expenses</span><b>{money.format(total('expense'))}</b></div>
    </section>
    <div className="summary-tabs">{(['expense', 'income', 'transfer'] as const).map((value) => <button className={type === value ? 'active' : ''} key={value} onClick={() => setType(value)} type="button">{value}</button>)}</div>
    <section className="chart-area">
      <div className="chart-tools"><button aria-label="Chart view" className={view === 'chart' ? 'active' : ''} onClick={() => setView('chart')} type="button"><Icon name="chart" /></button><button aria-label="List view" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} type="button"><Icon name="list" /></button></div>
      {view === 'chart' && <div className="donut" style={{ background: `conic-gradient(${gradient})` }}><div><span>{type}</span><small>{monthLabel}</small><strong>{money.format(selectedTotal)} ฿</strong></div></div>}
      <div className="coming-row"><button disabled title="Coming later" type="button"><Icon name="chart" /> Trend <small>Coming later</small></button><button disabled title="Coming later" type="button"><Icon name="budget" /> Budget <small>Coming later</small></button></div>
      <div className="breakdown-tabs"><button className={breakdown === 'category' ? 'active' : ''} onClick={() => setBreakdown('category')} type="button"><Icon name="grid" /> Categories</button><button className={breakdown === 'tag' ? 'active' : ''} onClick={() => setBreakdown('tag')} type="button"><Icon name="tag" /> Tags</button></div>
      <div className="breakdown-list">{groups.map((group) => <div key={group.name}><span className="breakdown-icon"><Icon name={breakdown === 'category' ? 'grid' : 'tag'} /></span><strong>{group.name}</strong><b>{money.format(group.amount)}</b></div>)}{!groups.length && <p>No {type} entries this month.</p>}</div>
    </section>
    {monthPickerOpen && <MonthPickerDialog latestMonth={latestMonth} month={month} onCancel={() => setMonthPickerOpen(false)} onSelect={(value) => { setMonthPickerOpen(false); onChangeMonth(value) }} />}
  </main>
}
