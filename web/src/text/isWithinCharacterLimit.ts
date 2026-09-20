interface CharacterLimitOptions {
  limit: number
  value: string
}

const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })

/** Checks a limit using visible Unicode characters, including Thai clusters. */
export default function isWithinCharacterLimit({ limit, value }: CharacterLimitOptions): boolean {
  let count = 0
  for (const _segment of segmenter.segment(value)) {
    count += 1
    if (count > limit) return false
  }
  return true
}
