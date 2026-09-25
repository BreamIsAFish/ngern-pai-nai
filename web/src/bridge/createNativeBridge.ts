import serializeBridgeRequest from './serializeBridgeRequest'
import type { BridgeClient, BridgeOperation, BridgeOperations, BridgeResponse } from './types'

interface PendingRequest {
  operation: BridgeOperation
  reject(error: Error): void
  resolve(value: unknown): void
}

export class BridgeRequestError extends Error {
  constructor(public readonly code: string, message: string, public readonly data?: unknown) {
    super(message)
    this.name = 'BridgeRequestError'
  }
}

/** Creates a correlated request client for the narrow Flutter JavaScript channel. */
export default function createNativeBridge(): BridgeClient {
  const pending = new Map<string, PendingRequest>()

  window.NgernPaiNaiBridge = {
    receive(message) {
      let response: BridgeResponse
      try {
        response = JSON.parse(message) as BridgeResponse
      } catch (error) {
        console.error('[FlutterBridge] Invalid response JSON.', error)
        return
      }

      const request = pending.get(response.id)
      if (!request) return
      pending.delete(response.id)

      if (response.ok) {
        request.resolve(response.data)
      } else {
        console.error(`[FlutterBridge] ${request.operation} failed.`, {
          code: response.error.code,
          message: response.error.message,
        })
        request.reject(new BridgeRequestError(response.error.code, response.error.message, response.error.data))
      }
    },
  }

  return {
    request<Operation extends BridgeOperation>(
      operation: Operation,
      payload: BridgeOperations[Operation]['payload'],
    ): Promise<BridgeOperations[Operation]['result']> {
      const id = crypto.randomUUID()
      const message = serializeBridgeRequest({
        id,
        operation,
        payload: payload as Record<string, unknown>,
      })

      return new Promise((resolve, reject) => {
        pending.set(id, { operation, resolve, reject })
        window.FlutterBridge?.postMessage(message)
        const timeoutMs = operation === 'openai.openSettings' ? 900_000 : operation === 'receipts.process' ? 90_000 : 20_000
        window.setTimeout(() => {
          if (!pending.has(id)) return
          pending.delete(id)
          console.error(`[FlutterBridge] ${operation} timed out.`)
          reject(new Error('The app did not respond. Please try again.'))
        }, timeoutMs)
      })
    },
  }
}
