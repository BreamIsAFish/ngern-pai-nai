import { describe, expect, it } from 'vitest'
import resolveTheme from './resolveTheme'

describe('resolveTheme', () => {
  it('honors either explicit choice over the device preference', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the device when there is no valid saved choice', () => {
    for (const saved of [null, '', 'system', 'invalid']) {
      expect(resolveTheme(saved, true)).toBe('dark')
      expect(resolveTheme(saved, false)).toBe('light')
    }
  })
})
