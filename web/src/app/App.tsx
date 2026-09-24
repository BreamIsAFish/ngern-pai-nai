import { useCallback, useEffect, useRef, useState } from 'react'
import bridge from '../bridge/client'
import createLatestRequestScheduler from '../bridge/createLatestRequestScheduler'
import type { AppStatus } from '../bridge/types'
import CategoryManager from '../categories/CategoryManager'
import mapCategory, { type Category } from '../categories/model'
import DashboardPage from '../dashboard/DashboardPage'
import SearchPage from '../search/SearchPage'
import GoogleSheetPage from '../settings/GoogleSheetPage'
import SettingsPage from '../settings/SettingsPage'
import SetupPage from '../setup/SetupPage'
import SpreadsheetRecoveryPage from '../setup/SpreadsheetRecoveryPage'
import SummaryPage from '../summary/SummaryPage'
import TagManager from '../tags/TagManager'
import mapTag, { type Tag } from '../tags/model'
import type { Transaction, TransactionInput } from '../transactions/model'
import mapTransaction from '../transactions/model'
import TransactionForm from '../transactions/TransactionForm'
import { localDateValue, utcMonthForTransaction, utcMonthsForLocalMonth } from '../transactions/time'
import LoadingScreen from '../ui/LoadingScreen'
import { currentVisualState } from '../visual-qa/screens'

type Screen = 'home' | 'profile' | 'sheet' | 'summary' | 'search' | 'categories' | 'tags'

export default function App() {
  const visualState = currentVisualState()
  const initialScreen: Screen = visualState?.startsWith('categories') ? 'categories'
    : visualState?.startsWith('summary') ? 'summary'
      : visualState === 'search' ? 'search'
        : visualState === 'tags' || visualState === 'add-tag' ? 'tags'
          : visualState === 'profile' ? 'profile' : 'home'
  const [status, setStatus] = useState<AppStatus>()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [month, setMonth] = useState(localDateValue().slice(0, 7))
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [editing, setEditing] = useState<Transaction | null | undefined>(visualState?.startsWith('add-') && visualState !== 'add-tag' ? null : undefined)
  const [busy, setBusy] = useState(false)
  const [monthLoading, setMonthLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [tagManagerAdding, setTagManagerAdding] = useState(false)
  const monthLoadScheduler = useRef(createLatestRequestScheduler({ delayMs: 220 }))

  const fetchTransactions = useCallback(async (utcMonths: string[]) => {
    const result = await bridge.request('transactions.list', { utcMonths })
    if (result.skippedRows) setNotice(`${result.skippedRows} malformed Sheet row${result.skippedRows === 1 ? ' was' : 's were'} skipped.`)
    return result.transactions.map(mapTransaction)
  }, [])

  const loadMonth = useCallback(async (value: string) => {
    setTransactions(await fetchTransactions(utcMonthsForLocalMonth(value)))
  }, [fetchTransactions])

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      let nextStatus = await bridge.request('app.getStatus', {})
      if (nextStatus.signedIn) nextStatus = await bridge.request('sheet.bootstrap', {})
      setStatus(nextStatus)
      if (nextStatus.signedIn && nextStatus.sheetReady) {
        const [rows, categoryRows, tagRows] = await Promise.all([
          fetchTransactions(utcMonthsForLocalMonth(month)), bridge.request('categories.list', {}), bridge.request('tags.list', {}),
        ])
        setTransactions(rows); setCategories(categoryRows.map(mapCategory)); setTags(tagRows.map(mapTag))
        if (visualState === 'edit-transaction' && rows[0]) setEditing(rows[0])
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open your data.')
    } finally { setLoading(false) }
  }, [fetchTransactions, month, visualState])

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => monthLoadScheduler.current.cancel(), [])

  const connect = async () => {
    setBusy(true); setError(undefined)
    try {
      await bridge.request('google.signIn', {})
      await load()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Google connection failed.') }
    finally { setBusy(false) }
  }

  const recoverSpreadsheet = async (operation: 'sheet.restore' | 'sheet.createReplacement') => {
    setBusy(true); setError(undefined)
    try {
      setStatus(await bridge.request(operation, {}))
      await load()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not recover your spreadsheet.') }
    finally { setBusy(false) }
  }

  const changeMonth = (value: string) => {
    if (value > localDateValue().slice(0, 7)) return
    setMonth(value); setMonthLoading(true); setError(undefined)
    monthLoadScheduler.current.schedule({
      request: () => fetchTransactions(utcMonthsForLocalMonth(value)),
      onSuccess: setTransactions,
      onError: (caught) => setError(caught instanceof Error ? caught.message : 'Could not load this month.'),
      onSettled: () => setMonthLoading(false),
    })
  }

  const save = async (input: TransactionInput) => {
    setBusy(true); setError(undefined)
    try {
      if (editing) await bridge.request('transactions.update', { id: editing.id, sourceUtcMonth: utcMonthForTransaction(editing), transaction: input })
      else await bridge.request('transactions.create', { transaction: input })
      setEditing(undefined); if (screen === 'search') setScreen('home'); await loadMonth(month)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save the transaction.') }
    finally { setBusy(false) }
  }

  const remove = async (transaction: Transaction) => {
    setBusy(true)
    try {
      await bridge.request('transactions.delete', { id: transaction.id, utcMonth: utcMonthForTransaction(transaction) })
      setEditing(undefined); if (screen === 'search') setScreen('home'); await loadMonth(month)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not delete the transaction.') }
    finally { setBusy(false) }
  }

  const refresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const [categoryRows, tagRows] = await Promise.all([bridge.request('categories.list', {}), bridge.request('tags.list', {}), loadMonth(month)])
      setCategories(categoryRows.map(mapCategory)); setTags(tagRows.map(mapTag))
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not refresh your Sheet.') }
    finally { setRefreshing(false) }
  }

  const refreshSheetAccount = async () => {
    if (refreshing) return
    setRefreshing(true); setError(undefined)
    try { setStatus(await bridge.request('sheet.bootstrap', {})) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not refresh your Google Sheet account.') }
    finally { setRefreshing(false) }
  }

  const disconnect = async () => {
    setBusy(true)
    try { setStatus(await bridge.request('google.disconnect', {})); setTransactions([]); setScreen('home') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not disconnect Google.') }
    finally { setBusy(false) }
  }

  if (loading) return <LoadingScreen />
  if (status?.signedIn && status.spreadsheetTrashed) return <SpreadsheetRecoveryPage busy={busy} error={error} onCreateNew={() => void recoverSpreadsheet('sheet.createReplacement')} onRestore={() => void recoverSpreadsheet('sheet.restore')} spreadsheetUrl={status.spreadsheetUrl} />
  if (!status?.signedIn || !status.sheetReady) return <SetupPage busy={busy} error={error} onConnect={() => void connect()} />

  const common = { busy, setError, setNotice }
  const visibleTransactions = transactions
  const entryType = visualState === 'add-income' ? 'income' : visualState === 'add-transfer' ? 'transfer' : 'expense'
  return (
    <div className={`phone-canvas screen-${screen}`} data-visual-ready="true">
      {error && <button className="toast" onClick={() => setError(undefined)} type="button">{error}<span>Dismiss</span></button>}
      {notice && <button className="toast notice" onClick={() => setNotice(undefined)} type="button">{notice}<span>Dismiss</span></button>}
      {screen === 'home' && <DashboardPage categories={categories} latestMonth={localDateValue().slice(0, 7)} loading={monthLoading} month={month} monthPickerOpenInitially={visualState === 'home-month-picker'} onAdd={() => setEditing(null)} onChangeMonth={changeMonth} onEdit={setEditing} onOpenProfile={() => setScreen('profile')} onOpenSearch={() => setScreen('search')} onOpenSummary={() => setScreen('summary')} onRefresh={() => void refresh()} refreshing={refreshing} showCoach={!visualState || visualState === 'home-dashboard' || visualState === 'home-month-picker'} transactions={visibleTransactions} />}
      {screen === 'profile' && <SettingsPage busy={busy} onDisconnect={() => void disconnect()} onHome={() => setScreen('home')} onManageSheet={() => setScreen('sheet')} onManageCategories={() => setScreen('categories')} onManageTags={() => { setTagManagerAdding(false); setScreen('tags') }} status={status} />}
      {screen === 'sheet' && <GoogleSheetPage onBack={() => setScreen('profile')} onRefresh={() => void refreshSheetAccount()} refreshing={refreshing} status={status} />}
      {screen === 'summary' && <SummaryPage categories={categories} initialView={visualState === 'summary-categories' ? 'list' : 'chart'} latestMonth={localDateValue().slice(0, 7)} loading={monthLoading} month={month} monthPickerOpenInitially={visualState === 'summary-month-picker'} onBack={() => setScreen('home')} onChangeMonth={changeMonth} transactions={transactions} />}
      {screen === 'search' && <SearchPage categories={categories} fetchTransactions={fetchTransactions} onBack={() => setScreen('home')} onEdit={(item) => setEditing(item)} visualKeyboard={visualState === 'search'} />}
      {screen === 'categories' && <CategoryManager {...common} categories={categories} initialType={visualState === 'categories-income' ? 'income' : 'expense'} onBack={() => setScreen('profile')} onChange={setCategories} />}
      {screen === 'tags' && <TagManager {...common} initialAdding={tagManagerAdding || visualState === 'add-tag'} onBack={() => { setTagManagerAdding(false); setScreen('profile') }} onChange={setTags} tags={tags} visualKeyboard={visualState === 'add-tag'} />}
      {editing !== undefined && <TransactionForm busy={busy} categories={categories} initialCategoryPickerOpen={visualState?.startsWith('add-expense-picker')} initialType={entryType} onCancel={() => setEditing(undefined)} onDelete={editing ? () => void remove(editing) : undefined} onManageCategories={() => { setEditing(undefined); setScreen('categories') }} onManageTags={() => { setEditing(undefined); setTagManagerAdding(true); setScreen('tags') }} onSubmit={(input) => void save(input)} tags={tags} transaction={editing ?? undefined} />}
    </div>
  )
}
