import type { TransactionType } from '../transactions/model'

export type CategoryType = TransactionType
export interface CategoryInput { name: string; type: CategoryType; iconUrl: string | null }
export interface Category extends CategoryInput { id: string; isDefault: boolean; createdAt: string; updatedAt: string }

export default function mapCategory(value: unknown): Category {
  if (!value || typeof value !== 'object') throw new Error('Category data is missing.')
  const row = value as Record<string, unknown>
  const type = row.type === 'income' || row.type === 'expense' || row.type === 'transfer' ? row.type : null
  if (!type || !String(row.name ?? '').trim()) throw new Error('Category data is invalid.')
  return {
    id: String(row.id ?? ''), name: String(row.name), type,
    iconUrl: typeof row.iconUrl === 'string' && row.iconUrl ? row.iconUrl : null,
    isDefault: row.isDefault === true, createdAt: String(row.createdAt ?? ''), updatedAt: String(row.updatedAt ?? ''),
  }
}
