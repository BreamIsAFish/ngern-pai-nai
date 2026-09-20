export interface TagInput { name: string }
export interface Tag extends TagInput { id: string; createdAt: string; updatedAt: string }

export default function mapTag(value: unknown): Tag {
  if (!value || typeof value !== 'object') throw new Error('Tag data is missing.')
  const row = value as Record<string, unknown>
  if (!String(row.name ?? '').trim()) throw new Error('Tag data is invalid.')
  return { id: String(row.id ?? ''), name: String(row.name), createdAt: String(row.createdAt ?? ''), updatedAt: String(row.updatedAt ?? '') }
}
