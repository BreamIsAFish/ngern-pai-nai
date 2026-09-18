import type { Transaction, TransactionInput } from '../transactions/model'

export interface AppStatus {
  signedIn: boolean
  sheetReady: boolean
  accountEmail?: string
  spreadsheetName?: string
}

export interface BridgeError {
  code: string
  message: string
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
  'google.signOut': { payload: Record<string, never>; result: AppStatus }
  'sheet.bootstrap': { payload: Record<string, never>; result: AppStatus }
  'transactions.list': { payload: Record<string, never>; result: Transaction[] }
  'transactions.create': { payload: { transaction: TransactionInput }; result: Transaction }
  'transactions.update': {
    payload: { id: string; transaction: TransactionInput }
    result: Transaction
  }
  'transactions.delete': { payload: { id: string }; result: { id: string } }
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

