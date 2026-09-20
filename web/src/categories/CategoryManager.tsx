import { useState } from 'react'
import bridge from '../bridge/client'
import Icon from '../ui/Icon'
import isWithinCharacterLimit from '../text/isWithinCharacterLimit'
import CategoryIcon from './CategoryIcon'
import type { Category, CategoryInput, CategoryType } from './model'
import mapCategory from './model'

interface Props { busy: boolean; categories: Category[]; initialType?: CategoryType; onBack(): void; onChange(items: Category[]): void; setError(value?: string): void; setNotice(value?: string): void }
export default function CategoryManager({ categories, initialType = 'expense', onBack, onChange, setError }: Props) {
  const [type, setType] = useState<CategoryType>(initialType)
  const [editing, setEditing] = useState<Category>()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const items = categories.filter((item) => item.type === type)
  const customCount = items.filter((item) => !item.isDefault).length
  const reset = () => { setEditing(undefined); setAdding(false); setName(''); setIconUrl('') }
  const edit = (item: Category) => { if (!item.isDefault) { setEditing(item); setAdding(true); setName(item.name); setIconUrl(item.iconUrl ?? '') } }
  const save = async () => {
    const input: CategoryInput = { name: name.trim(), type, iconUrl: iconUrl.trim() || null }
    if (!input.name || !isWithinCharacterLimit({ value: input.name, limit: 20 })) return setError('Category names must be 1–20 characters.')
    if (input.iconUrl && !input.iconUrl.startsWith('https://')) return setError('Icon URLs must use HTTPS.')
    try {
      const result = editing ? await bridge.request('categories.update', { id: editing.id, category: input }) : await bridge.request('categories.create', { category: input })
      const category = mapCategory(result)
      onChange(editing ? categories.map((item) => item.id === editing.id ? category : item) : [...categories, category]); reset()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save category.') }
  }
  const remove = async () => {
    if (!editing || !window.confirm(`Delete “${editing.name}”? Existing transactions keep this name.`)) return
    try { await bridge.request('categories.delete', { id: editing.id }); onChange(categories.filter((item) => item.id !== editing.id)); reset() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not delete category.') }
  }
  return <ManagerShell action={<button className="manager-text-action" disabled type="button">Manage</button>} onBack={onBack} title="My categories" variant="categories">
    <div className="manager-tabs"><button className={type === 'expense' ? 'active' : ''} onClick={() => { setType('expense'); reset() }} type="button"><Icon name="arrow-up" /> Expense</button><button className={type === 'income' ? 'active' : ''} onClick={() => { setType('income'); reset() }} type="button"><Icon name="arrow-down" /> Income</button></div>
    <div className="manager-count category-count"><strong>{type === 'expense' ? 'Expense categories' : 'Income categories'}</strong><span>Custom {customCount}/50</span></div>
    <div className="manager-list category-list">{items.map((item) => <button className={editing?.id === item.id ? 'selected' : ''} key={item.id} onClick={() => edit(item)} type="button"><span className="manager-icon"><CategoryIcon iconUrl={item.iconUrl} /></span><strong>{item.name}</strong><small>{item.isDefault ? 'Locked' : 'Tap to edit'}</small></button>)}</div>
    <button className="manager-add-button" disabled={customCount >= 50} onClick={() => setAdding(true)} type="button"><Icon name="plus" size={25} /> Add category</button>
    {adding && <div className="manager-overlay"><button aria-label="Close editor" className="manager-scrim" onClick={reset} type="button" /><div className="manager-editor"><header><h3>{editing ? 'Edit category' : 'Add category'}</h3><button aria-label="Close" onClick={reset} type="button"><Icon name="close" size={28} /></button></header><input onChange={(event) => setName(event.target.value)} placeholder="Category name" value={name} /><input onChange={(event) => setIconUrl(event.target.value)} placeholder="HTTPS icon URL (optional)" type="url" value={iconUrl} /><button className="primary-action" disabled={!name.trim() || (!editing && customCount >= 50)} onClick={() => void save()} type="button">{editing ? 'Save changes' : 'Add category'}</button>{editing && <button className="danger-link" onClick={() => void remove()} type="button">Delete category</button>}</div></div>}
  </ManagerShell>
}

export function ManagerShell({ action, children, onBack, title, variant }: { action?: React.ReactNode; children: React.ReactNode; onBack(): void; title: string; variant?: 'categories' | 'tags' }) {
  return <main className={`manager-page ${variant ? `${variant}-manager-page` : ''}`}><header><button aria-label="Back" onClick={onBack} type="button"><Icon name="back" size={30} /></button><h1>{title}</h1><span className="manager-header-action">{action}</span></header>{children}</main>
}
