import { useMemo, useState } from 'react'
import type { Category } from '../categories/model'
import type { Transaction } from '../transactions/model'
import TransactionList from '../transactions/TransactionList'
import { latestUtcMonths, transactionInstant, utcMonthsForYear } from '../transactions/time'
import Icon from '../ui/Icon'
import VisualKeyboard from '../ui/VisualKeyboard'

interface Props { categories: Category[]; fetchTransactions(months: string[]): Promise<Transaction[]>; visualKeyboard?: boolean; onBack(): void; onEdit(item: Transaction): void }
export default function SearchPage({ categories, fetchTransactions, visualKeyboard = false, onBack, onEdit }: Props) {
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<'latest' | number>('latest')
  const [rows, setRows] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const search = async (nextRange: 'latest' | number = range) => { setLoading(true); try { setRows(await fetchTransactions(nextRange === 'latest' ? latestUtcMonths() : utcMonthsForYear(nextRange))) } finally { setLoading(false) } }
  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return []
    return rows.filter((item) => [item.tag, item.category, item.note, item.destination, String(item.amount)].some((value) => value?.toLocaleLowerCase().includes(term))).sort((a, b) => transactionInstant(b).getTime() - transactionInstant(a).getTime())
  }, [query, rows])
  const changeYear = (direction: number) => {
    const year = range === 'latest' ? new Date().getFullYear() - 1 : Math.min(new Date().getFullYear(), range + direction)
    const next = year >= new Date().getFullYear() ? 'latest' as const : year
    setRange(next); void search(next)
  }
  return <main className={`search-page ${visualKeyboard ? 'with-keyboard' : ''}`}><header><button aria-label="Back" onClick={onBack} type="button"><Icon name="back" size={31} /></button><label><Icon name="search" size={22} /><input autoFocus onChange={(event) => { setQuery(event.target.value); if (!rows.length) void search() }} placeholder="Search transactions" value={query} /></label></header><div className="search-range"><button aria-label="Previous year" onClick={() => changeYear(-1)} type="button"><Icon name="back" size={27} /></button><strong><Icon name="calendar" size={18} /> {range === 'latest' ? 'Latest 12 months' : range}</strong><button aria-label="Next year" disabled={range === 'latest'} onClick={() => changeYear(1)} type="button"><Icon name="chevron-right" size={27} /></button></div><section className="search-results">{loading ? <p>Searching your Sheet…</p> : query ? <><span>{matches.length} result{matches.length === 1 ? '' : 's'}</span><TransactionList categories={categories} onEdit={onEdit} transactions={matches} /></> : <div className="search-empty"><div className="search-cat">฿</div><h2>Find a transaction</h2><p>Search by recipient, note, category, tag, or amount.</p></div>}</section>{visualKeyboard && <VisualKeyboard actionLabel="done" />}</main>
}
