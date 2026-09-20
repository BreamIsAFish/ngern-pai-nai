import { describe, expect, it } from 'vitest'
import isWithinCharacterLimit from './isWithinCharacterLimit'

describe('isWithinCharacterLimit', () => {
  it('counts Thai letters and combining tone marks as visible characters', () => {
    const twentyThaiCharacters = 'ก้'.repeat(20)

    expect(isWithinCharacterLimit({ value: twentyThaiCharacters, limit: 20 })).toBe(true)
    expect(isWithinCharacterLimit({ value: `${twentyThaiCharacters}ก`, limit: 20 })).toBe(false)
  })
})
