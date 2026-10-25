import type { TransactionType } from '../transactions/model'

const backgrounds: Record<TransactionType, string> = {
  expense: 'var(--icon-expense)',
  income: 'var(--icon-income)',
  transfer: 'var(--icon-transfer)',
}

/** Returns the category icon tile color for a transaction type, so every screen colors icons the same way. */
export default function categoryIconBackground(type: TransactionType): string {
  return backgrounds[type]
}
