import { describe, expect, it } from 'vitest'
import serializeBridgeRequest from './serializeBridgeRequest'

describe('serializeBridgeRequest', () => {
  it('keeps the correlation ID, operation, and payload in the native envelope', () => {
    expect(JSON.parse(serializeBridgeRequest({
      id: 'request-42',
      operation: 'transactions.delete',
      payload: { id: 'tx-9' },
    }))).toEqual({
      id: 'request-42',
      operation: 'transactions.delete',
      payload: { id: 'tx-9' },
    })
  })
})

