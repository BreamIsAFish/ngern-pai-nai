import type { Transaction, TransactionType } from '../transactions/model'
import { parseTags } from '../tags/tagList'

export type Breakdown = 'category' | 'tag'

export const uncategorizedLabel = 'ไม่มีหมวดหมู่'
export const untaggedLabel = 'No tag'

export function breakdownKeys(item: Transaction, breakdown: Breakdown): string[] {
  if (breakdown === 'category') return [item.category ?? uncategorizedLabel]
  const tags = parseTags(item.tag)
  return tags.length ? tags : [untaggedLabel]
}

interface Options {
  breakdown: Breakdown
  name: string
  type: TransactionType
}

/** Lists the entries behind one Summary category or tag row. */
export default function filterBreakdownEntries(rows: Transaction[], { breakdown, name, type }: Options): Transaction[] {
  return rows.filter((item) => item.type === type && breakdownKeys(item, breakdown).includes(name))
}
