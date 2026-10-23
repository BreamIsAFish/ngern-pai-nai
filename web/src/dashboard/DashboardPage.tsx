import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '../categories/model'
import MonthPickerDialog from '../month-picker/MonthPickerDialog'
import type { Transaction } from '../transactions/model'
import TransactionList from '../transactions/TransactionList'
import { transactionLocalMonth } from '../transactions/time'
import Hamster from '../ui/Hamster'
import BottomNav from '../ui/BottomNav'
import ThemeToggle from '../theme/ThemeToggle'
import { filterTransactions, transactionTotals, type LedgerFilter } from './ledgerView'
import PullToRefresh from '../ui/PullToRefresh'
import Icon from '../ui/Icon'

interface Props {
  categories: Category[]; latestMonth: string; loading: boolean; month: string; monthPickerOpenInitially?: boolean; refreshing: boolean; showCoach?: boolean; transactions: Transaction[]
  onAdd(): void; onEdit(item: Transaction): void; onChangeMonth(value: string): void
  onScanReceipt(): void
  onOpenProfile(): void; onOpenSearch(): void; onOpenSummary(): void; onRefresh(): void
}

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export default function DashboardPage(props: Props) {
  const [filter, setFilter] = useState<LedgerFilter>('all')
  const [scrolled, setScrolled] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(props.monthPickerOpenInitially ?? false)
  const rows = useMemo(() => props.transactions.filter((item) => transactionLocalMonth(item) === props.month), [props.month, props.transactions])
  const totals = transactionTotals(rows)
  const filteredRows = filterTransactions(rows, filter)
  const nextMonthDisabled = props.month >= props.latestMonth
  const shiftMonth = (amount: number) => {
    const [year, month] = props.month.split('-').map(Number)
    const value = new Date(year, month - 1 + amount, 1)
    props.onChangeMonth(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`)
  }
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(`${props.month}-01T12:00:00`))
  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 220)
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])
  return (
    <PullToRefresh onRefresh={props.onRefresh} refreshing={props.refreshing}>
      <main className="home-page">
        <div aria-hidden="true" className="home-theme-layer" />
        <section className="home-content-layer">
          <header className="dashboard-header">
            <div className="home-header-row">
              <div className="month-nav"><button aria-label="Previous month" onClick={() => shiftMonth(-1)} type="button"><Icon name="back" size={18} /></button><button aria-label={`Select month, ${label}`} className="month-label-button" onClick={() => setMonthPickerOpen(true)} type="button"><strong>{label}</strong></button><button aria-label="Next month" disabled={nextMonthDisabled} onClick={() => shiftMonth(1)} type="button"><Icon name="chevron-right" size={18} /></button></div>
              <div className="home-tools"><button aria-label="Search" onClick={props.onOpenSearch} type="button"><Icon name="search" size={20} /></button><ThemeToggle /></div>
            </div>
            <section className="month-total"><span>Spent this month</span><strong>{props.loading ? '—' : `฿${money.format(totals.expense)}`}</strong><div className="month-other-totals"><span>Income {props.loading ? '—' : `+${money.format(totals.income)}`}</span><span>Transferred {props.loading ? '—' : money.format(totals.transfer)}</span></div><Hamster className="total-hamster" pose="peek" size={124} /></section>
          </header>
          {scrolled && createPortal(<header className="compact-dashboard-header">
            <div className="compact-month-nav"><button aria-label="Previous month" onClick={() => shiftMonth(-1)} type="button"><Icon name="back" size={20} /></button><button aria-label={`Select month, ${label}`} className="month-label-button" onClick={() => setMonthPickerOpen(true)} type="button"><strong>{label}</strong></button><button aria-label="Next month" disabled={nextMonthDisabled} onClick={() => shiftMonth(1)} type="button"><Icon name="chevron-right" size={20} /></button></div>
            <div className="compact-dashboard-total"><span>Spent this month</span><strong>{props.loading ? '—' : `฿${money.format(totals.expense)}`}</strong></div>
          </header>, document.body)}
          <div aria-label="Filter transactions" className="ledger-filters">{(['all', 'expense', 'income', 'transfer'] as const).map((value) => <button aria-pressed={filter === value} className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)} type="button">{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
          {props.showCoach && <div className="dashboard-coach"><Hamster pose="seed" size={58} /><div className="coach-message"><strong>10 entries tucked away today</strong><span>Your journal is ready when you are.</span><small>Last entry today at 20:21</small></div></div>}
          <section className="ledger">{props.loading ? <div aria-live="polite" className="month-loading" role="status"><Icon name="refresh" size={28} /><strong>Loading {label}...</strong><span>Reading transactions from your Sheet</span></div> : <TransactionList categories={props.categories} onEdit={props.onEdit} transactions={filteredRows} />}</section>
        </section>
        <BottomNav active="home" onHome={() => window.scrollTo(0, 0)} onSummary={props.onOpenSummary} onAdd={props.onAdd} onScanReceipt={props.onScanReceipt} onProfile={props.onOpenProfile} />
        {monthPickerOpen && <MonthPickerDialog latestMonth={props.latestMonth} month={props.month} onCancel={() => setMonthPickerOpen(false)} onSelect={(value) => { setMonthPickerOpen(false); props.onChangeMonth(value) }} />}
      </main>
    </PullToRefresh>
  )
}
