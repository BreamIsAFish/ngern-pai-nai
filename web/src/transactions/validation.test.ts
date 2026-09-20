import { describe, expect, it } from 'vitest'
import validateTransaction from './validation'

const validInput = {
  localDate: '2026-09-17',
  localTime: '12:30',
  type: 'expense' as const,
  amount: 120,
  category: 'Food',
  tag: null,
  note: '',
  destination: null,
}

describe('validateTransaction', () => {
  it('accepts a complete transaction', () => {
    expect(validateTransaction(validInput, new Date('2026-09-18T00:00:00Z'))).toEqual({})
  })

  it.each([0, -1, Number.NaN])('rejects the invalid amount %s', (amount) => {
    expect(validateTransaction({ ...validInput, amount }, new Date('2026-09-18T00:00:00Z')).amount).toBe(
      'Enter an amount greater than zero.',
    )
  })

  it('requires a category and valid date', () => {
    expect(validateTransaction({ ...validInput, category: ' ', localDate: '' }, new Date('2026-09-18T00:00:00Z'))).toEqual({
      category: 'Choose a category.',
      localDate: 'Choose a valid date.',
      localTime: 'Choose a valid time.',
    })
  })

  it('rejects a future local timestamp', () => {
    expect(validateTransaction(validInput, new Date('2026-09-17T12:29:00')).localDate).toBe('Future transactions are not allowed.')
  })

  it('accepts Thai category, tag, and note text', () => {
    expect(validateTransaction({
      ...validInput,
      category: 'อาหาร',
      tag: 'รายเดือน',
      note: 'ข้าวกลางวันกับแม่',
    }, new Date('2026-09-18T00:00:00Z'))).toEqual({})
  })
})
