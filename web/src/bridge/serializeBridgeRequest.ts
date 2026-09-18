import type { BridgeOperation, BridgeRequest } from './types'

interface SerializeBridgeRequestOptions {
  id: string
  operation: BridgeOperation
  payload: Record<string, unknown>
}

/** Serializes one typed request for the native Flutter bridge. */
export default function serializeBridgeRequest(options: SerializeBridgeRequestOptions): string {
  const request: BridgeRequest = {
    id: options.id,
    operation: options.operation,
    payload: options.payload,
  }
  return JSON.stringify(request)
}

