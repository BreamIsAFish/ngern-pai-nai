import type { BridgeClient, BridgeOperation, BridgeOperations } from './types'
import type { Transaction } from '../transactions/model'

const today = new Date()
const isoToday = today.toISOString().slice(0, 10)
const monthStart = `${isoToday.slice(0, 7)}-01`

const seedTransactions: Transaction[] = [
  {
    id: 'mock-1',
    occurredAt: isoToday,
    type: 'expense',
    amount: 120,
    currency: 'THB',
    category: 'Food',
    note: 'Lunch with May',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'mock-2',
    occurredAt: monthStart,
    type: 'income',
    amount: 48000,
    currency: 'THB',
    category: 'Salary',
    note: 'Monthly salary',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'mock-3',
    occurredAt: isoToday,
    type: 'expense',
    amount: 65,
    currency: 'THB',
    category: 'Transport',
    note: 'Train',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
]

/** Creates a browser-only bridge with in-memory data for interface development. */
export default function createMockBridge(): BridgeClient {
  let signedIn = true
  let sheetReady = true
  let transactions = [...seedTransactions]

  return {
    async request<Operation extends BridgeOperation>(
      operation: Operation,
      payload: BridgeOperations[Operation]['payload'],
    ): Promise<BridgeOperations[Operation]['result']> {
      await new Promise((resolve) => window.setTimeout(resolve, 180))

      const status = () => ({
        signedIn,
        sheetReady,
        accountEmail: signedIn ? 'demo@gmail.com' : undefined,
        spreadsheetName: sheetReady ? 'Ngern Pai Nai' : undefined,
      })

      let result: unknown
      switch (operation) {
        case 'app.getStatus':
          result = status()
          break
        case 'google.signIn':
          signedIn = true
          result = status()
          break
        case 'google.signOut':
          signedIn = false
          sheetReady = false
          result = status()
          break
        case 'sheet.bootstrap':
          if (!signedIn) throw new Error('Connect Google before creating a sheet.')
          sheetReady = true
          result = status()
          break
        case 'transactions.list':
          result = [...transactions]
          break
        case 'transactions.create': {
          const input = (payload as BridgeOperations['transactions.create']['payload']).transaction
          const timestamp = new Date().toISOString()
          const transaction: Transaction = {
            ...input,
            id: crypto.randomUUID(),
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          transactions = [transaction, ...transactions]
          result = transaction
          break
        }
        case 'transactions.update': {
          const update = payload as BridgeOperations['transactions.update']['payload']
          const previous = transactions.find((transaction) => transaction.id === update.id)
          if (!previous) throw new Error('Transaction not found.')
          const transaction: Transaction = {
            ...previous,
            ...update.transaction,
            updatedAt: new Date().toISOString(),
          }
          transactions = transactions.map((item) => item.id === update.id ? transaction : item)
          result = transaction
          break
        }
        case 'transactions.delete': {
          const id = (payload as BridgeOperations['transactions.delete']['payload']).id
          transactions = transactions.filter((transaction) => transaction.id !== id)
          result = { id }
          break
        }
      }

      return result as BridgeOperations[Operation]['result']
    },
  }
}

