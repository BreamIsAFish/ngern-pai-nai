import type { Category } from '../categories/model'
import { defaultCategoryDefinitions } from '../categories/defaultCategories'
import type { Tag } from '../tags/model'
import type { Transaction } from '../transactions/model'
import type { BridgeClient, BridgeOperation, BridgeOperations } from './types'

const iso = new URLSearchParams(window.location.search).has('visual') ? '2026-09-20T12:00:00.000Z' : new Date().toISOString()
const today = iso.slice(0, 10)
const previousDayDate = new Date(iso)
previousDayDate.setUTCDate(previousDayDate.getUTCDate() - 1)
const previousDay = previousDayDate.toISOString().slice(0, 10)
const seedCategories: Category[] = defaultCategoryDefinitions.map((definition) => ({
  ...definition, isDefault: true, createdAt: iso, updatedAt: iso,
}))
const seedTags: Tag[] = [{ id: 'tag-1', name: 'Monthly', createdAt: iso, updatedAt: iso }]
const seedTransactions: Transaction[] = [
  { id: 'mock-1', date: today, time: '05:30:00', type: 'expense', category: 'Food', tag: null, amount: 120, note: 'Lunch with May', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
  { id: 'mock-2', date: `${today.slice(0, 7)}-01`, time: '02:00:00', type: 'income', category: 'Salary', tag: 'Monthly', amount: 48000, note: 'Monthly salary', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
  { id: 'mock-3', date: today, time: '01:15:00', type: 'expense', category: 'Transport', tag: null, amount: 65, note: 'Train', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
  { id: 'mock-4', date: today, time: '00:30:00', type: 'transfer', category: 'Transfer', tag: null, amount: 1000, note: 'To savings', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
]
const seedHomeHistory: Transaction[] = [
  { id: 'mock-7', date: today, time: '06:00:00', type: 'income', category: 'Refunds', tag: null, amount: 6383.62, note: 'AIMET refund', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
  { id: 'mock-8', date: previousDay, time: '05:15:00', type: 'expense', category: 'Food', tag: null, amount: 891, note: 'Dinner', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
  { id: 'mock-5', date: previousDay, time: '04:45:00', type: 'transfer', category: 'Transfer', tag: null, amount: 3000, note: 'Move to emergency fund', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
  { id: 'mock-6', date: previousDay, time: '03:20:00', type: 'transfer', category: 'Transfer', tag: null, amount: 1500, note: 'Set aside for bills', destination: null, transactionNumber: null, source: 'manual', dateInferred: false, createdAt: iso, updatedAt: iso },
]

/** Browser-only in-memory bridge for interface development and screenshots. */
export default function createMockBridge(): BridgeClient {
  const visualState = new URLSearchParams(window.location.search).get('visual')
  let signedIn = true
  let spreadsheetTrashed = visualState === 'sheet-trash'
  let sheetReady = !spreadsheetTrashed
  let spreadsheetId = 'demo-sheet-id'
  let transactions = [...seedTransactions, ...(visualState?.startsWith('home-') ? seedHomeHistory : [])]
  let categories = [...seedCategories]
  let tags = [...seedTags]
  let openAiConfigured = true
  let privacyNoticeSeen = true
  const status = () => ({
    signedIn,
    sheetReady,
    spreadsheetTrashed,
    accountEmail: signedIn ? 'demo@gmail.com' : undefined,
    spreadsheetName: sheetReady || spreadsheetTrashed ? 'NgernPaiNai_data' : undefined,
    spreadsheetUrl: sheetReady || spreadsheetTrashed ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : undefined,
  })
  const stamp = () => new Date().toISOString()

  return {
    async request<Operation extends BridgeOperation>(operation: Operation, payload: BridgeOperations[Operation]['payload']): Promise<BridgeOperations[Operation]['result']> {
      await new Promise((resolve) => window.setTimeout(resolve, 80))
      let result: unknown
      switch (operation) {
        case 'app.getStatus': result = status(); break
        case 'google.signIn': signedIn = true; result = status(); break
        case 'google.disconnect': signedIn = false; sheetReady = false; spreadsheetTrashed = false; result = status(); break
        case 'sheet.bootstrap': result = status(); break
        case 'sheet.restore': spreadsheetTrashed = false; sheetReady = true; result = status(); break
        case 'sheet.createReplacement': {
          spreadsheetTrashed = false; sheetReady = true; spreadsheetId = 'replacement-sheet-id'; transactions = []; tags = []; result = status(); break
        }
        case 'sheet.resetTransactions': transactions = []; result = status(); break
        case 'openai.getStatus': result = { configured: openAiConfigured, verified: openAiConfigured, model: 'gpt-6-luna', privacyNoticeSeen }; break
        case 'openai.openSettings': openAiConfigured = true; result = { configured: true, verified: true, model: 'gpt-6-luna', privacyNoticeSeen }; break
        case 'receipts.acceptPrivacy': privacyNoticeSeen = true; result = { accepted: true }; break
        case 'receipts.pick': {
          const source = (payload as BridgeOperations['receipts.pick']['payload']).source
          result = { cancelled: false, batchId: 'mock-batch', images: source === 'camera' ? [{ id: 'receipt-1', name: 'receipt.jpg' }] : [{ id: 'receipt-1', name: 'receipt-1.jpg' }, { id: 'receipt-2', name: 'receipt-2.jpg' }] }
          break
        }
        case 'receipts.process': {
          const { imageId } = payload as BridgeOperations['receipts.process']['payload']
          const transaction: Transaction = { id: `mock-${imageId}`, date: today, time: '05:30:00', type: 'expense', category: null, tag: null, amount: imageId === 'receipt-1' ? 245 : 89, note: 'อาหารและเครื่องดื่ม', destination: 'ร้านตัวอย่าง', transactionNumber: `TX-${imageId}`, source: 'receipt_ai', dateInferred: false, createdAt: stamp(), updatedAt: stamp() }
          if (visualState === 'receipt-results' && imageId === 'receipt-2') {
            result = { status: 'duplicate', transaction: seedTransactions[0], warnings: [] }
            break
          }
          if (visualState === 'receipt-results' && imageId === 'receipt-3') {
            result = { status: 'failed', message: 'อ่านยอดเงินรวมสุทธิเป็นบาทไม่ได้', requestId: 'req_demo', warnings: [] }
            break
          }
          transactions = [transaction, ...transactions]
          result = { status: 'added', transaction, warnings: [] }
          break
        }
        case 'receipts.cancel': result = { cancelled: true }; break
        case 'receipts.discard': result = { discarded: true }; break
        case 'receipts.takeInterrupted': result = { completed: 0 }; break
        case 'transactions.list': {
          const months = (payload as BridgeOperations['transactions.list']['payload']).utcMonths
          result = { transactions: transactions.filter((item) => months.includes(item.date.slice(0, 7).replace('-', '_'))), skippedRows: 0 }
          break
        }
        case 'transactions.create': {
          const input = (payload as BridgeOperations['transactions.create']['payload']).transaction
          const transaction = { ...input, id: crypto.randomUUID(), createdAt: stamp(), updatedAt: stamp() }
          transactions = [transaction, ...transactions]; result = transaction; break
        }
        case 'transactions.update': {
          const update = payload as BridgeOperations['transactions.update']['payload']
          const old = transactions.find((item) => item.id === update.id)
          if (!old) throw new Error('Transaction not found.')
          const transaction = { ...old, ...update.transaction, updatedAt: stamp() }
          transactions = transactions.map((item) => item.id === update.id ? transaction : item); result = transaction; break
        }
        case 'transactions.delete': {
          const { id } = payload as BridgeOperations['transactions.delete']['payload']
          transactions = transactions.filter((item) => item.id !== id); result = { id }; break
        }
        case 'categories.list': result = [...categories]; break
        case 'categories.create': {
          const input = (payload as BridgeOperations['categories.create']['payload']).category
          const category = { ...input, id: crypto.randomUUID(), isDefault: false, createdAt: stamp(), updatedAt: stamp() }
          categories = [...categories, category]; result = category; break
        }
        case 'categories.update': {
          const update = payload as BridgeOperations['categories.update']['payload']
          const old = categories.find((item) => item.id === update.id)
          if (!old || old.isDefault) throw new Error('Default categories cannot be changed.')
          const category = { ...old, ...update.category, updatedAt: stamp() }
          categories = categories.map((item) => item.id === update.id ? category : item); result = category; break
        }
        case 'categories.delete': {
          const { id } = payload as BridgeOperations['categories.delete']['payload']
          categories = categories.filter((item) => item.id !== id); result = { id }; break
        }
        case 'tags.list': result = [...tags]; break
        case 'tags.create': {
          const input = (payload as BridgeOperations['tags.create']['payload']).tag
          const tag = { ...input, id: crypto.randomUUID(), createdAt: stamp(), updatedAt: stamp() }
          tags = [...tags, tag]; result = tag; break
        }
        case 'tags.update': {
          const update = payload as BridgeOperations['tags.update']['payload']
          const old = tags.find((item) => item.id === update.id)
          if (!old) throw new Error('Tag not found.')
          const tag = { ...old, ...update.tag, updatedAt: stamp() }
          tags = tags.map((item) => item.id === update.id ? tag : item); result = tag; break
        }
        case 'tags.delete': {
          const { id } = payload as BridgeOperations['tags.delete']['payload']
          tags = tags.filter((item) => item.id !== id); result = { id }; break
        }
      }
      return result as BridgeOperations[Operation]['result']
    },
  }
}
