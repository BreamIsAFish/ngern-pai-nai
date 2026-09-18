import { useCallback, useEffect, useState } from 'react'
import bridge from '../bridge/client'
import type { AppStatus } from '../bridge/types'
import DashboardPage from '../dashboard/DashboardPage'
import SettingsPage from '../settings/SettingsPage'
import SetupPage from '../setup/SetupPage'
import type { Transaction, TransactionInput } from '../transactions/model'
import mapTransaction from '../transactions/model'
import TransactionForm from '../transactions/TransactionForm'
import LoadingScreen from '../ui/LoadingScreen'

type Screen = 'dashboard' | 'settings'

export default function App() {
  const [status, setStatus] = useState<AppStatus>()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [editing, setEditing] = useState<Transaction | null>()
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [online, setOnline] = useState(navigator.onLine)

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const nextStatus = await bridge.request('app.getStatus', {})
      setStatus(nextStatus)
      if (nextStatus.signedIn && nextStatus.sheetReady) {
        const rows = await bridge.request('transactions.list', {})
        setTransactions(rows.map(mapTransaction))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open your data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  const connect = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await bridge.request('google.signIn', {})
      const nextStatus = await bridge.request('sheet.bootstrap', {})
      setStatus(nextStatus)
      const rows = await bridge.request('transactions.list', {})
      setTransactions(rows.map(mapTransaction))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google connection failed.')
    } finally {
      setBusy(false)
    }
  }

  const save = async (input: TransactionInput) => {
    setBusy(true)
    setError(undefined)
    try {
      if (editing) {
        const updated = await bridge.request('transactions.update', { id: editing.id, transaction: input })
        setTransactions((current) => current.map((item) => item.id === editing.id ? mapTransaction(updated) : item))
      } else {
        const created = await bridge.request('transactions.create', { transaction: input })
        setTransactions((current) => [mapTransaction(created), ...current])
      }
      setEditing(undefined)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the transaction.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (transaction: Transaction) => {
    if (!window.confirm(`Delete ${transaction.note || transaction.category}?`)) return
    setBusy(true)
    try {
      await bridge.request('transactions.delete', { id: transaction.id })
      setTransactions((current) => current.filter((item) => item.id !== transaction.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete the transaction.')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    setBusy(true)
    try {
      const nextStatus = await bridge.request('google.signOut', {})
      setStatus(nextStatus)
      setTransactions([])
      setScreen('dashboard')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not disconnect Google.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!status?.signedIn || !status.sheetReady) return <SetupPage busy={busy} error={error} onConnect={() => void connect()} />

  return (
    <>
      {!online && <div className="offline-banner">You are offline. Existing entries remain visible, but changes will not save.</div>}
      {error && <button className="toast" onClick={() => setError(undefined)} type="button">{error}<span>Dismiss</span></button>}
      {screen === 'settings' ? (
        <SettingsPage busy={busy} onBack={() => setScreen('dashboard')} onSignOut={() => void signOut()} status={status} />
      ) : (
        <DashboardPage
          onAdd={() => setEditing(null)}
          onDelete={(transaction) => void remove(transaction)}
          onEdit={setEditing}
          onOpenSettings={() => setScreen('settings')}
          status={status}
          transactions={transactions}
        />
      )}
      {editing !== undefined && <TransactionForm busy={busy} onCancel={() => setEditing(undefined)} onSubmit={(input) => void save(input)} transaction={editing ?? undefined} />}
    </>
  )
}

