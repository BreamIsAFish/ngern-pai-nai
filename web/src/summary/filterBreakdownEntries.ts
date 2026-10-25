import type { Transaction, TransactionType } from '../transactions/model'

export type Breakdown = 'category' | 'tag'

export const uncategorizedLabel = 'ไม่มีหมวดหมู่'
export const untaggedLabel = 'No tag'

/** Returns the Summary group name a transaction belongs to. */
export function breakdownKey(item: Transaction, breakdown: Breakdown): string {
  return breakdown === 'category' ? item.category ?? uncategorizedLabel : item.tag ?? untaggedLabel
}

interface Options {
  breakdown: Breakdown
  name: string
  type: TransactionType
}

/** Lists the entries behind one Summary category or tag row. */
export default function filterBreakdownEntries(rows: Transaction[], { breakdown, name, type }: Options): Transaction[] {
  return rows.filter((item) => item.type === type && breakdownKey(item, breakdown) === name)
}
