import { describe, expect, it } from 'vitest'
import { defaultCategoryDefinitions } from './defaultCategories'

describe('defaultCategoryDefinitions', () => {
  it('gives every browser default a unique stable ID and an HTTPS icon URL', () => {
    const ids = defaultCategoryDefinitions.map(({ id }) => id)

    expect(defaultCategoryDefinitions).toHaveLength(22)
    expect(new Set(ids).size).toBe(ids.length)
    for (const category of defaultCategoryDefinitions) {
      expect(new URL(category.iconUrl ?? '').protocol).toBe('https:')
    }
  })
})
