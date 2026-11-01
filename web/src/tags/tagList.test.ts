import { describe, expect, it } from 'vitest'
import { formatTags, parseTags, serializeTags, toggleTag } from './tagList'

describe('tag list wire format', () => {
  it('parses trimmed, nonempty, case-insensitively unique tags', () => {
    expect(parseTags(' food, trip, FOOD, ,  ')).toEqual(['food', 'trip'])
    expect(parseTags('Monthly')).toEqual(['Monthly'])
    expect(parseTags(null)).toEqual([])
  })

  it('serializes tags with the existing comma-space format', () => {
    expect(serializeTags([' food ', 'trip', 'FOOD', ''])).toBe('food, trip')
    expect(serializeTags([])).toBeNull()
  })

  it('toggles selected tags and formats all tags for display', () => {
    expect(toggleTag(['food'], 'trip')).toEqual(['food', 'trip'])
    expect(toggleTag(['Food', 'trip'], 'food')).toEqual(['trip'])
    expect(formatTags('food, trip')).toBe('#food #trip')
  })
})
