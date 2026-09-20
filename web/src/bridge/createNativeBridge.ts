import serializeBridgeRequest from './serializeBridgeRequest'
import type { BridgeClient, BridgeOperation, BridgeOperations, BridgeResponse } from './types'

interface PendingRequest {
  operation: BridgeOperation
  reject(error: Error): void
  resolve(value: unknown): void
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
        request.reject(new Error(response.error.message))
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
        window.setTimeout(() => {
          if (!pending.has(id)) return
          pending.delete(id)
          console.error(`[FlutterBridge] ${operation} timed out.`)
          reject(new Error('The app did not respond. Please try again.'))
        }, 20_000)
      })
    },
  }
}
