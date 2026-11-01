import type { Transaction } from '../transactions/model'
import { parseTags } from '../tags/tagList'

export default function matchesTransactionSearch(item: Transaction, query: string): boolean {
  const term = query.toLocaleLowerCase()
  return [...parseTags(item.tag), item.category, item.note, item.destination, String(item.amount)]
    .some((value) => value?.toLocaleLowerCase().includes(term))
}
