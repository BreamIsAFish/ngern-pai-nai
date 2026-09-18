import type { TransactionInput } from './model'

export interface TransactionErrors {
  amount?: string
  category?: string
  occurredAt?: string
}

/** Validates transaction fields before they are sent to Flutter. */
export default function validateTransaction(input: TransactionInput): TransactionErrors {
  const errors: TransactionErrors = {}

  if (!input.occurredAt || Number.isNaN(Date.parse(`${input.occurredAt}T00:00:00`))) {
    errors.occurredAt = 'Choose a valid date.'
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = 'Enter an amount greater than zero.'
  }
  if (!input.category.trim()) {
    errors.category = 'Choose a category.'
  }

  return errors
}

