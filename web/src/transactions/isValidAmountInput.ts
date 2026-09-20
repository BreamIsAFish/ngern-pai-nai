/**
 * Checks whether an amount field contains only digits and up to two decimal places.
 *
 * @param value - The current text in the amount field.
 * @returns Whether the field can accept the proposed value.
 */
export default function isValidAmountInput(value: string): boolean {
  return /^\d*(?:\.\d{0,2})?$/.test(value)
}
