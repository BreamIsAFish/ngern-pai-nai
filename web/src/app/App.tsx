import { useCallback, useEffect, useRef, useState } from 'react'
import bridge from '../bridge/client'
import { BridgeRequestError } from '../bridge/createNativeBridge'
import createLatestRequestScheduler from '../bridge/createLatestRequestScheduler'
import type { AppStatus, OpenAiStatus, ReceiptImageSelection } from '../bridge/types'
import CategoryManager from '../categories/CategoryManager'
import mapCategory, { type Category } from '../categories/model'
import DashboardPage from '../dashboard/DashboardPage'
import ReceiptImportModal from '../receipts/ReceiptImportModal'
import ReceiptSourceDialog from '../receipts/ReceiptSourceDialog'
import SearchPage from '../search/SearchPage'
import GoogleSheetPage from '../settings/GoogleSheetPage'
import SettingsPage from '../settings/SettingsPage'
import SetupPage from '../setup/SetupPage'
import SchemaResetPage from '../setup/SchemaResetPage'
import SpreadsheetRecoveryPage from '../setup/SpreadsheetRecoveryPage'
import SummaryPage from '../summary/SummaryPage'
import TagManager from '../tags/TagManager'
import mapTag, { type Tag } from '../tags/model'
import type { Transaction, TransactionInput } from '../transactions/model'
import mapTransaction from '../transactions/model'
import TransactionForm from '../transactions/TransactionForm'
import { localDateValue, transactionLocalMonth, utcMonthForTransaction, utcMonthsForLocalMonth } from '../transactions/time'
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
  const [openAiStatus, setOpenAiStatus] = useState<OpenAiStatus>()
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
  const [receiptSourceOpen, setReceiptSourceOpen] = useState(visualState === 'receipt-source')
  const [receiptSelection, setReceiptSelection] = useState<Required<Pick<ReceiptImageSelection, 'batchId' | 'images'>> | undefined>(
    visualState === 'receipt-results'
      ? { batchId: 'visual-receipts', images: [
        { id: 'receipt-1', name: 'กาแฟ.jpg' },
        { id: 'receipt-2', name: 'อาหารกลางวัน.jpg' },
        { id: 'receipt-3', name: 'รูปที่อ่านไม่ได้.jpg' },
      ] }
      : undefined,
  )
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
      const interrupted = await bridge.request('receipts.takeInterrupted', {})
      if (interrupted.completed > 0) setNotice(`เพิ่มรายการจากใบเสร็จก่อนแอปปิดสำเร็จ ${interrupted.completed} รายการ`)
      setOpenAiStatus(await bridge.request('openai.getStatus', {}))
      let nextStatus = await bridge.request('app.getStatus', {})
      if (nextStatus.signedIn) nextStatus = await bridge.request('sheet.bootstrap', {})
      setStatus(nextStatus)
      if (nextStatus.signedIn && nextStatus.sheetReady && !nextStatus.schemaResetRequired) {
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

  const resetTransactions = async () => {
    setBusy(true); setError(undefined)
    try { await bridge.request('sheet.resetTransactions', {}); await load() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'อัปเดต Google Sheet ไม่ได้') }
    finally { setBusy(false) }
  }

  const manageOpenAi = async () => {
    try { setOpenAiStatus(await bridge.request('openai.openSettings', {})) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'เปิดการตั้งค่า OpenAI ไม่ได้') }
  }

  const selectReceiptSource = async (source: 'camera' | 'gallery') => {
    setReceiptSourceOpen(false); setError(undefined)
    try {
      let current = openAiStatus ?? await bridge.request('openai.getStatus', {})
      if (!current.verified) {
        setNotice('ตั้งค่าและตรวจสอบ OpenAI API key ก่อนสแกนใบเสร็จ')
        current = await bridge.request('openai.openSettings', {})
        setOpenAiStatus(current)
        if (!current.verified) return
      }
      if (!current.privacyNoticeSeen) {
        const accepted = window.confirm('รูปใบเสร็จจะถูกส่งไปยัง OpenAI เพื่ออ่านข้อมูล รูปจะไม่ถูกเก็บหลังประมวลผล ต้องการดำเนินการต่อหรือไม่?')
        if (!accepted) return
        await bridge.request('receipts.acceptPrivacy', {})
        current = { ...current, privacyNoticeSeen: true }
        setOpenAiStatus(current)
      }
      const selection = await bridge.request('receipts.pick', { source })
      if (!selection.cancelled && selection.batchId) {
        setReceiptSelection({ batchId: selection.batchId, images: selection.images })
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'เลือกรูปใบเสร็จไม่ได้')
    }
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
    } catch (caught) {
      if (caught instanceof BridgeRequestError && caught.code === 'DUPLICATE_RECEIPT') {
        try { setEditing(mapTransaction(caught.data)); setError('รายการนี้ซ้ำกับรายการที่มีอยู่') }
        catch { setError(caught.message) }
      } else setError(caught instanceof Error ? caught.message : 'Could not save the transaction.')
    }
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
  if (status?.signedIn && status.schemaResetRequired) return <SchemaResetPage busy={busy} error={error} onConfirm={() => void resetTransactions()} />
  if (!status?.signedIn || !status.sheetReady) return <SetupPage busy={busy} error={error} onConnect={() => void connect()} />

  const common = { busy, setError, setNotice }
  const visibleTransactions = transactions
  const entryType = visualState === 'add-income' ? 'income' : visualState === 'add-transfer' ? 'transfer' : 'expense'
  return (
    <div className={`phone-canvas screen-${screen}`} data-visual-ready="true">
      {error && <button className="toast" onClick={() => setError(undefined)} type="button">{error}<span>Dismiss</span></button>}
      {notice && <button className="toast notice" onClick={() => setNotice(undefined)} type="button">{notice}<span>Dismiss</span></button>}
      {screen === 'home' && <DashboardPage categories={categories} latestMonth={localDateValue().slice(0, 7)} loading={monthLoading} month={month} monthPickerOpenInitially={visualState === 'home-month-picker'} onAdd={() => setEditing(null)} onChangeMonth={changeMonth} onEdit={setEditing} onOpenProfile={() => setScreen('profile')} onOpenSearch={() => setScreen('search')} onOpenSummary={() => setScreen('summary')} onRefresh={() => void refresh()} onScanReceipt={() => setReceiptSourceOpen(true)} refreshing={refreshing} showCoach={!visualState || visualState === 'home-dashboard' || visualState === 'home-month-picker'} transactions={visibleTransactions} />}
      {screen === 'profile' && <SettingsPage busy={busy} onDisconnect={() => void disconnect()} onHome={() => setScreen('home')} onManageOpenAi={() => void manageOpenAi()} onManageSheet={() => setScreen('sheet')} onManageCategories={() => setScreen('categories')} onManageTags={() => { setTagManagerAdding(false); setScreen('tags') }} openAiStatus={openAiStatus} status={status} />}
      {screen === 'sheet' && <GoogleSheetPage onBack={() => setScreen('profile')} onRefresh={() => void refreshSheetAccount()} refreshing={refreshing} status={status} />}
      {screen === 'summary' && <SummaryPage categories={categories} initialView={visualState === 'summary-categories' ? 'list' : 'chart'} latestMonth={localDateValue().slice(0, 7)} loading={monthLoading} month={month} monthPickerOpenInitially={visualState === 'summary-month-picker'} onBack={() => setScreen('home')} onChangeMonth={changeMonth} transactions={transactions} />}
      {screen === 'search' && <SearchPage categories={categories} fetchTransactions={fetchTransactions} onBack={() => setScreen('home')} onEdit={(item) => setEditing(item)} visualKeyboard={visualState === 'search'} />}
      {screen === 'categories' && <CategoryManager {...common} categories={categories} initialType={visualState === 'categories-income' ? 'income' : 'expense'} onBack={() => setScreen('profile')} onChange={setCategories} />}
      {screen === 'tags' && <TagManager {...common} initialAdding={tagManagerAdding || visualState === 'add-tag'} onBack={() => { setTagManagerAdding(false); setScreen('profile') }} onChange={setTags} tags={tags} visualKeyboard={visualState === 'add-tag'} />}
      {receiptSourceOpen && <ReceiptSourceDialog onCancel={() => setReceiptSourceOpen(false)} onSelect={(source) => void selectReceiptSource(source)} />}
      {receiptSelection && <ReceiptImportModal onClose={() => { setReceiptSelection(undefined); void loadMonth(month) }} onEdit={setEditing} onTransactionAdded={(transaction) => { if (transactionLocalMonth(transaction) === month) setTransactions((current) => [transaction, ...current.filter((item) => item.id !== transaction.id)]) }} onTransactionDeleted={(id) => setTransactions((current) => current.filter((item) => item.id !== id))} selection={receiptSelection} />}
      {editing !== undefined && <TransactionForm busy={busy} categories={categories} initialCategoryPickerOpen={visualState?.startsWith('add-expense-picker')} initialType={entryType} onCancel={() => setEditing(undefined)} onDelete={editing ? () => void remove(editing) : undefined} onManageCategories={() => { setEditing(undefined); setScreen('categories') }} onManageTags={() => { setEditing(undefined); setTagManagerAdding(true); setScreen('tags') }} onSubmit={(input) => void save(input)} tags={tags} transaction={editing ?? undefined} />}
    </div>
  )
}
