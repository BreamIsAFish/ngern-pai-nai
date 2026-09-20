import { describe, expect, it } from 'vitest'
import getPullStage from './getPullStage'

describe('getPullStage', () => {
  describe('Case: idle gesture', () => {
    it('returns no progress when the user has not pulled down', () => {
      expect(getPullStage({ distance: 0, triggerDistance: 80 })).toBe(0)
      expect(getPullStage({ distance: -12, triggerDistance: 80 })).toBe(0)
    })
  })

  describe('Case: active gesture', () => {
    it('maps the pull distance to five visual progress stages', () => {
      expect(getPullStage({ distance: 1, triggerDistance: 80 })).toBe(1)
      expect(getPullStage({ distance: 32, triggerDistance: 80 })).toBe(2)
      expect(getPullStage({ distance: 48, triggerDistance: 80 })).toBe(3)
      expect(getPullStage({ distance: 64, triggerDistance: 80 })).toBe(4)
      expect(getPullStage({ distance: 80, triggerDistance: 80 })).toBe(5)
    })

    it('caps progress after the refresh threshold', () => {
      expect(getPullStage({ distance: 240, triggerDistance: 80 })).toBe(5)
    })
  })

  describe('Case: invalid threshold', () => {
    it('returns no progress when the threshold cannot be used', () => {
      expect(getPullStage({ distance: 50, triggerDistance: 0 })).toBe(0)
    })
  })
})
