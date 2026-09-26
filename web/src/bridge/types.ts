import type { Transaction, TransactionInput } from '../transactions/model'
import type { Category, CategoryInput } from '../categories/model'
import type { Tag, TagInput } from '../tags/model'

export interface AppStatus {
  signedIn: boolean
  sheetReady: boolean
  accountEmail?: string
  spreadsheetName?: string
  spreadsheetTrashed?: boolean
  spreadsheetUrl?: string
  schemaResetRequired?: boolean
}

export interface AiStatus {
  provider: 'openai' | 'google_ai_studio'
  providerName: string
  configured: boolean
  verified: boolean
  model: string
  privacyNoticeSeen: boolean
}

export interface ReceiptImageSelection {
  cancelled: boolean
  batchId?: string
  images: { id: string; name: string }[]
}

export type ReceiptProcessResult =
  | { status: 'added' | 'duplicate'; transaction: Transaction; warnings: string[] }
  | { status: 'failed'; message: string; requestId?: string; warnings: string[] }
  | { status: 'cancelled'; warnings: string[] }

export interface BridgeError {
  code: string
  message: string
  data?: unknown
}

export interface BridgeRequest {
  id: string
  operation: BridgeOperation
  payload: Record<string, unknown>
}

export type BridgeResponse =
  | { id: string; ok: true; data: unknown }
  | { id: string; ok: false; error: BridgeError }

export interface BridgeOperations {
  'app.getStatus': { payload: Record<string, never>; result: AppStatus }
  'google.signIn': { payload: Record<string, never>; result: AppStatus }
  'google.disconnect': { payload: Record<string, never>; result: AppStatus }
  'sheet.bootstrap': { payload: Record<string, never>; result: AppStatus }
  'sheet.restore': { payload: Record<string, never>; result: AppStatus }
  'sheet.createReplacement': { payload: Record<string, never>; result: AppStatus }
  'sheet.resetTransactions': { payload: Record<string, never>; result: AppStatus }
  'ai.getStatus': { payload: Record<string, never>; result: AiStatus }
  'ai.openSettings': { payload: Record<string, never>; result: AiStatus }
  'receipts.acceptPrivacy': { payload: Record<string, never>; result: { accepted: boolean } }
  'receipts.pick': { payload: { source: 'camera' | 'gallery' }; result: ReceiptImageSelection }
  'receipts.process': { payload: { batchId: string; imageId: string }; result: ReceiptProcessResult }
  'receipts.cancel': { payload: { batchId: string }; result: { cancelled: boolean } }
  'receipts.discard': { payload: { batchId: string }; result: { discarded: boolean } }
  'receipts.takeInterrupted': { payload: Record<string, never>; result: { completed: number } }
  'transactions.list': { payload: { utcMonths: string[] }; result: { transactions: Transaction[]; skippedRows: number } }
  'transactions.create': { payload: { transaction: TransactionInput }; result: Transaction }
  'transactions.update': {
    payload: { id: string; sourceUtcMonth: string; transaction: TransactionInput }
    result: Transaction
  }
  'transactions.delete': { payload: { id: string; utcMonth: string }; result: { id: string } }
  'categories.list': { payload: Record<string, never>; result: Category[] }
  'categories.create': { payload: { category: CategoryInput }; result: Category }
  'categories.update': { payload: { id: string; category: CategoryInput }; result: Category }
  'categories.delete': { payload: { id: string }; result: { id: string } }
  'tags.list': { payload: Record<string, never>; result: Tag[] }
  'tags.create': { payload: { tag: TagInput }; result: Tag }
  'tags.update': { payload: { id: string; tag: TagInput }; result: Tag }
  'tags.delete': { payload: { id: string }; result: { id: string } }
}

export type BridgeOperation = keyof BridgeOperations

export interface BridgeClient {
  request<Operation extends BridgeOperation>(
    operation: Operation,
    payload: BridgeOperations[Operation]['payload'],
  ): Promise<BridgeOperations[Operation]['result']>
}

declare global {
  interface Window {
    FlutterBridge?: { postMessage(message: string): void }
    NgernPaiNaiBridge?: { receive(message: string): void }
  }
}
