import { describe, expect, it } from 'vitest'
import categoryIconBackground from './categoryIconBackground'

describe('categoryIconBackground', () => {
  it('colors icons by transaction type: yellow expense, green income, blue transfer', () => {
    expect(categoryIconBackground('expense')).toBe('var(--icon-expense)')
    expect(categoryIconBackground('income')).toBe('var(--icon-income)')
    expect(categoryIconBackground('transfer')).toBe('var(--icon-transfer)')
  })
})
