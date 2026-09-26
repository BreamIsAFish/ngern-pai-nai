import type { TransactionDraft } from './model'
import isWithinCharacterLimit from '../text/isWithinCharacterLimit'

export interface TransactionErrors {
  amount?: string
  category?: string
  localDate?: string
  localTime?: string
  note?: string
}

/** Validates the user's local date/time before it is converted to UTC. */
export default function validateTransaction(input: TransactionDraft, now = new Date()): TransactionErrors {
  const errors: TransactionErrors = {}
  const instant = new Date(`${input.localDate}T${input.localTime}:00`)
  if (!input.localDate || Number.isNaN(instant.getTime())) errors.localDate = 'Choose a valid date.'
  if (!input.localTime || Number.isNaN(instant.getTime())) errors.localTime = 'Choose a valid time.'
  if (!Number.isNaN(instant.getTime()) && instant.getTime() > now.getTime()) errors.localDate = 'Future transactions are not allowed.'
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = 'Enter an amount greater than zero.'
  }
  if (input.source === 'manual' && !input.category.trim()) {
    errors.category = 'Choose a category.'
  }
  if (!isWithinCharacterLimit({ value: input.note, limit: 160 })) {
    errors.note = 'Notes must be 160 characters or fewer.'
  }

  return errors
}
