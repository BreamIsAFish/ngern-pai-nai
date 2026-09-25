import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '../categories/model'
import MonthPickerDialog from '../month-picker/MonthPickerDialog'
import type { Transaction } from '../transactions/model'
import TransactionList from '../transactions/TransactionList'
import { transactionLocalMonth } from '../transactions/time'
import CatIllustration from '../ui/CatIllustration'
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
  const [scrolled, setScrolled] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(props.monthPickerOpenInitially ?? false)
  const rows = useMemo(() => props.transactions.filter((item) => transactionLocalMonth(item) === props.month), [props.month, props.transactions])
  const expense = rows.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
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
          <header className={`yellow-header ${props.showCoach ? 'with-coach' : ''}`}>
            <div className="home-tools">
              <button aria-label="Wallets, coming later" disabled title="Coming later" type="button"><Icon name="wallet" size={25} /></button>
              <span />
              <button aria-label="Search" onClick={props.onOpenSearch} type="button"><Icon name="search" size={24} /></button>
              <button aria-label="Wallets, coming later" disabled title="Coming later" type="button"><Icon name="wallet" size={24} /></button>
            </div>
            {props.showCoach && <div className="dashboard-coach"><div className="coach-message"><strong>Meow logged 10 entries today</strong><span>Open the app and Meow gets started.</span></div><div className="coach-time"><Icon name="calendar" size={17} /> Last entry today at 20:21</div><CatIllustration className="coach-cat" /></div>}
            <div className="month-nav"><button aria-label="Previous month" onClick={() => shiftMonth(-1)} type="button"><Icon name="back" size={28} /></button><button aria-label={`Select month, ${label}`} className="month-label-button" onClick={() => setMonthPickerOpen(true)} type="button"><Icon name="calendar" size={19} /><strong>{label}</strong></button><button aria-label="Next month" disabled={nextMonthDisabled} onClick={() => shiftMonth(1)} type="button"><Icon name="chevron-right" size={28} /></button></div>
            <div className="month-total"><div><span>Total expenses</span><strong>{props.loading ? '—' : `${money.format(expense)} ฿`}</strong></div><button disabled={props.loading} onClick={props.onOpenSummary} type="button"><Icon name="chart" size={18} /> Summary</button></div>
          </header>
          {props.showCoach && scrolled && createPortal(<header className="compact-dashboard-header">
            <div className="compact-dashboard-tools"><button aria-label="Wallets, coming later" disabled type="button"><Icon name="wallet" size={23} /></button><div className="compact-month-nav"><button aria-label="Previous month" onClick={() => shiftMonth(-1)} type="button"><Icon name="back" size={25} /></button><button aria-label={`Select month, ${label}`} className="month-label-button" onClick={() => setMonthPickerOpen(true)} type="button"><Icon name="calendar" size={18} /><strong>{label}</strong></button><button aria-label="Next month" disabled={nextMonthDisabled} onClick={() => shiftMonth(1)} type="button"><Icon name="chevron-right" size={25} /></button></div><button aria-label="Search" onClick={props.onOpenSearch} type="button"><Icon name="search" size={23} /></button><button aria-label="Wallets, coming later" disabled type="button"><Icon name="wallet" size={23} /></button></div>
            <div className="compact-dashboard-total"><div><span>Total expenses</span><strong>{props.loading ? '—' : `${money.format(expense)} ฿`}</strong></div><button disabled={props.loading} onClick={props.onOpenSummary} type="button"><Icon name="chart" size={18} /> Summary</button></div>
          </header>, document.body)}
          <section className="ledger">{props.loading ? <div aria-live="polite" className="month-loading" role="status"><Icon name="refresh" size={28} /><strong>Loading {label}...</strong><span>Reading transactions from your Sheet</span></div> : <TransactionList categories={props.categories} onEdit={props.onEdit} transactions={rows} />}</section>
        </section>
        <div className="entry-fabs"><button className="receipt-fab" onClick={props.onScanReceipt} type="button"><Icon name="receipt" size={23} /> สแกนใบเสร็จ</button><button className="add-fab" onClick={props.onAdd} type="button"><Icon name="plus" size={25} /> Add entry</button></div>
        <nav className="bottom-nav"><button className="active" type="button"><Icon name="home" size={25} /><span>Home</span></button><button onClick={props.onOpenProfile} type="button"><Icon name="profile" size={25} /><span>Profile</span></button></nav>
        {monthPickerOpen && <MonthPickerDialog latestMonth={props.latestMonth} month={props.month} onCancel={() => setMonthPickerOpen(false)} onSelect={(value) => { setMonthPickerOpen(false); props.onChangeMonth(value) }} />}
      </main>
    </PullToRefresh>
  )
}
