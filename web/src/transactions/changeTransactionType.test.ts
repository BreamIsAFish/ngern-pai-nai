import { describe, expect, it } from 'vitest'
import { defaultCategoryDefinitions } from '../categories/defaultCategories'
import type { Category } from '../categories/model'
import changeTransactionType, { defaultTransactionCategory } from './changeTransactionType'
import type { TransactionDraft } from './model'

const categories: Category[] = defaultCategoryDefinitions.map((category) => ({
  ...category, isDefault: true, createdAt: '', updatedAt: '',
}))
const draft: TransactionDraft = {
  localDate: '2026-09-17', localTime: '12:30', type: 'expense', category: 'Food',
  tag: 'Monthly', amount: 120, note: 'Lunch', destination: null,
  transactionNumber: null, source: 'manual', dateInferred: false,
}

describe('changeTransactionType', () => {
  it.each(['expense', 'income'] as const)('keeps a same-name category available under %s', (type) => {
    const original = { ...draft, type: type === 'expense' ? 'income' as const : 'expense' as const, category: 'Other' }
    expect(changeTransactionType({ draft: original, type, categories }).category).toBe('Other')
  })

  it.each(['expense', 'income', 'transfer'] as const)('uses the New entry default when the category is unavailable under %s', (type) => {
    const original = { ...draft, type: type === 'expense' ? 'income' as const : 'expense' as const, category: 'Unavailable' }
    expect(changeTransactionType({ draft: original, type, categories }).category).toBe(defaultTransactionCategory[type])
  })

  it('matches category names exactly within the target type', () => {
    expect(changeTransactionType({ draft: { ...draft, category: 'other' }, type: 'income', categories }).category).toBe('')
  })

  it('uses an empty category when the new type has no categories', () => {
    expect(changeTransactionType({ draft, type: 'income', categories: [] }).category).toBe('')
  })

  it('keeps the current selection and receipt merchant when clicking the active type', () => {
    const original = { ...draft, source: 'receipt_ai' as const, destination: 'Cafe' }
    expect(changeTransactionType({ draft: original, type: 'expense', categories })).toBe(original)
  })

  it('clears receipt merchant and tags when switching to transfer without changing the positive amount or provenance', () => {
    const original = { ...draft, source: 'receipt_ai' as const, destination: 'Cafe', transactionNumber: 'TX-1' }
    expect(changeTransactionType({ draft: original, type: 'transfer', categories })).toEqual({
      ...original, type: 'transfer', category: 'Transfer', destination: null, tag: null,
    })
    expect(original.destination).toBe('Cafe')
  })

  it.each(['expense', 'income'] as const)('clears the transfer destination when switching to %s', (type) => {
    const original = { ...draft, type: 'transfer' as const, category: 'Transfer', destination: 'Savings' }
    expect(changeTransactionType({ draft: original, type, categories })).toEqual({
      ...original, type, category: '', destination: null,
    })
  })

  it('keeps tags when switching between expense and income', () => {
    expect(changeTransactionType({ draft, type: 'income', categories }).tag).toBe('Monthly')
  })
})
