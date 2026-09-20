import { describe, expect, it } from 'vitest'
import { draftToUtcInput, latestUtcMonths, utcMonthsForLocalMonth } from './time'

describe('transaction time conversion', () => {
  it('converts local form values to UTC fields', () => {
    const input = draftToUtcInput({ localDate: '2026-09-17', localTime: '12:30', type: 'expense', category: 'Food', tag: null, amount: 10, note: '', destination: null })
    expect(new Date(`${input.date}T${input.time}Z`).getTime()).toBe(new Date('2026-09-17T12:30:00').getTime())
  })

  it('never requests more than twelve latest UTC tabs', () => {
    expect(latestUtcMonths(new Date('2026-09-19T00:00:00Z'))).toHaveLength(12)
  })

  it('covers UTC boundary tabs for one local month', () => {
    expect(utcMonthsForLocalMonth('2026-09').length).toBeLessThanOrEqual(2)
  })
})
