import { useState } from 'react'
import bridge from '../bridge/client'
import { ManagerShell } from '../categories/CategoryManager'
import Icon from '../ui/Icon'
import isWithinCharacterLimit from '../text/isWithinCharacterLimit'
import VisualKeyboard from '../ui/VisualKeyboard'
import type { Tag } from './model'
import mapTag from './model'

interface Props { busy: boolean; tags: Tag[]; initialAdding?: boolean; visualKeyboard?: boolean; onBack(): void; onChange(items: Tag[]): void; setError(value?: string): void; setNotice(value?: string): void }
export default function TagManager({ tags, initialAdding = false, visualKeyboard = false, onBack, onChange, setError }: Props) {
  const [editing, setEditing] = useState<Tag>()
  const [adding, setAdding] = useState(initialAdding)
  const [name, setName] = useState('')
  const reset = () => { setEditing(undefined); setAdding(false); setName('') }
  const save = async () => {
    const value = name.trim()
    if (!value || !isWithinCharacterLimit({ value, limit: 20 })) return setError('Tag names must be 1–20 characters.')
    try {
      const result = editing ? await bridge.request('tags.update', { id: editing.id, tag: { name: value } }) : await bridge.request('tags.create', { tag: { name: value } })
      const tag = mapTag(result); onChange(editing ? tags.map((item) => item.id === editing.id ? tag : item) : [...tags, tag]); reset()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save tag.') }
  }
  const remove = async () => {
    if (!editing || !window.confirm(`Delete #${editing.name}? Existing transactions keep this tag.`)) return
    try { await bridge.request('tags.delete', { id: editing.id }); onChange(tags.filter((item) => item.id !== editing.id)); reset() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not delete tag.') }
  }
  const suggestions = ['❤️ Treat myself', 'Friends', 'Credit card', 'Cash', 'Japan trip']
  return <ManagerShell action={<button className="manager-text-action" disabled type="button">Manage</button>} onBack={onBack} title="My tags" variant="tags">
    <p className="manager-count manager-count-title">#My tags ({tags.length}/100)</p>
    <div className="manager-list tag-list">{tags.map((item) => <button className={editing?.id === item.id ? 'selected' : ''} key={item.id} onClick={() => { setEditing(item); setAdding(true); setName(item.name) }} type="button"><span className="manager-icon">#</span><strong>{item.name}</strong><Icon name="menu" size={20} /></button>)}</div>
    <button className="manager-add-button" disabled={tags.length >= 100} onClick={() => setAdding(true)} type="button"><Icon name="plus" size={27} /> Add tag</button>
    {adding && <div className={`manager-overlay tag-editor-overlay ${visualKeyboard ? 'with-keyboard' : ''}`}>
      <button aria-label="Close editor" className="manager-scrim" onClick={reset} type="button" />
      <div className="manager-editor tag-editor">
        <header><h3>{editing ? 'Edit tag' : 'Add tag'}</h3><button aria-label="Close" onClick={reset} type="button"><Icon name="close" size={28} /></button></header>
        <label className="tag-input"><span>#</span><input autoFocus onChange={(event) => setName(event.target.value)} placeholder="Tag name, up to 20 characters" value={name} /><button aria-label="Save tag" disabled={!name.trim()} onClick={() => void save()} type="button"><Icon name="plus" size={24} /></button></label>
        <div className="tag-suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => setName(suggestion)} type="button">{suggestion}</button>)}</div>
        {editing && <button className="danger-link" onClick={() => void remove()} type="button">Delete tag</button>}
      </div>
      {visualKeyboard && <VisualKeyboard />}
    </div>}
  </ManagerShell>
}
