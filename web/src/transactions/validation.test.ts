import { describe, expect, it } from 'vitest'
import validateTransaction from './validation'

const validInput = {
  occurredAt: '2026-09-17',
  type: 'expense' as const,
  amount: 120,
  currency: 'THB',
  category: 'Food',
  note: '',
}

describe('validateTransaction', () => {
  it('accepts a complete transaction', () => {
    expect(validateTransaction(validInput)).toEqual({})
  })

  it.each([0, -1, Number.NaN])('rejects the invalid amount %s', (amount) => {
    expect(validateTransaction({ ...validInput, amount }).amount).toBe(
      'Enter an amount greater than zero.',
    )
  })

  it('requires a category and valid date', () => {
    expect(validateTransaction({ ...validInput, category: ' ', occurredAt: '' })).toEqual({
      amount: undefined,
      category: 'Choose a category.',
      occurredAt: 'Choose a valid date.',
    })
  })
})

