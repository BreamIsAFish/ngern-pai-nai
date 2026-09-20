import { describe, expect, it } from 'vitest'
import isValidAmountInput from './isValidAmountInput'

describe('isValidAmountInput', () => {
  it.each(['', '0', '200', '12.3', '12.34', '.5'])('accepts the numeric amount input %s', (value) => {
    expect(isValidAmountInput(value)).toBe(true)
  })

  it.each(['-20', '12a', '1,000', '12.345', '1.2.3', ' '])('rejects the nonnumeric amount input %s', (value) => {
    expect(isValidAmountInput(value)).toBe(false)
  })
})
