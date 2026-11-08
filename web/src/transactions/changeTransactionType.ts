import type { Category } from '../categories/model'
import type { TransactionDraft, TransactionType } from './model'

export const defaultTransactionCategory: Record<TransactionType, string> = {
  expense: '',
  income: '',
  transfer: 'Transfer',
}

/** Switches a form draft's type, retaining only a category available for that type. */
export default function changeTransactionType({ draft, type, categories }: {
  draft: TransactionDraft
  type: TransactionType
  categories: Category[]
}): TransactionDraft {
  if (draft.type === type) return draft
  const categoryExists = categories.some((category) => category.type === type && category.name === draft.category)
  return {
    ...draft,
    type,
    category: categoryExists ? draft.category : defaultTransactionCategory[type],
    tag: type === 'transfer' ? null : draft.tag,
    destination: null,
  }
}
