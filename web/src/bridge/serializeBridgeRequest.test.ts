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

  it('preserves Thai text in the native bridge envelope', () => {
    const serialized = serializeBridgeRequest({
      id: 'request-thai',
      operation: 'transactions.create',
      payload: {
        transaction: {
          category: 'อาหาร',
          note: 'ข้าวกลางวันกับแม่',
          tag: 'รายเดือน',
        },
      },
    })

    expect(JSON.parse(serialized).payload.transaction).toEqual({
      category: 'อาหาร',
      note: 'ข้าวกลางวันกับแม่',
      tag: 'รายเดือน',
    })
  })
})
