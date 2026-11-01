/** Reads the comma-separated tag value stored in the transaction wire field. */
export function parseTags(value: string | null): string[] {
  if (!value) return []
  const seen = new Set<string>()
  return value.split(',').map((tag) => tag.trim()).filter((tag) => {
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Writes selected tags to the existing transaction wire field. */
export function serializeTags(tags: string[]): string | null {
  const value = parseTags(tags.join(', '))
  return value.length ? value.join(', ') : null
}

export function toggleTag(tags: string[], tag: string): string[] {
  const selected = tags.some((item) => item.toLowerCase() === tag.toLowerCase())
  return selected ? tags.filter((item) => item.toLowerCase() !== tag.toLowerCase()) : [...tags, tag]
}

export const formatTags = (value: string | null): string => parseTags(value).map((tag) => `#${tag}`).join(' ')
