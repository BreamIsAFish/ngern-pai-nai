import { describe, expect, it } from 'vitest'
import createRandomId from './createRandomId'

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('createRandomId', () => {
  it('uses randomUUID when the browser provides it', () => {
    expect(createRandomId({
      getRandomValues: (array) => array,
      randomUUID: () => '11111111-2222-4333-8444-555555555555',
    })).toBe('11111111-2222-4333-8444-555555555555')
  })

  it('builds a v4 UUID from getRandomValues outside a secure context', () => {
    const id = createRandomId({ getRandomValues: (array) => crypto.getRandomValues(array) })
    expect(id).toMatch(uuidV4)
  })

  it('sets the version and variant bits on fixed bytes', () => {
    const id = createRandomId({
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
        if (array instanceof Uint8Array) array.fill(0xff)
        return array
      },
    })
    expect(id).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
  })
})
