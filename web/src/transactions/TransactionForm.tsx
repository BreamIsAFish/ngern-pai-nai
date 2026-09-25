import { useMemo, useState } from 'react'
import CategoryIcon from '../categories/CategoryIcon'
import CategoryPickerDialog from '../categories/CategoryPickerDialog'
import type { Category } from '../categories/model'
import type { Tag } from '../tags/model'
import type { Transaction, TransactionDraft, TransactionInput, TransactionType } from './model'
import { draftToUtcInput, localDateValue, localTimeValue, transactionToDraft } from './time'
import validateTransaction from './validation'
import Icon from '../ui/Icon'
import isValidAmountInput from './isValidAmountInput'

interface Props { busy: boolean; categories: Category[]; initialCategoryPickerOpen?: boolean; initialType?: TransactionType; tags: Tag[]; transaction?: Transaction; onCancel(): void; onSubmit(input: TransactionInput): void; onDelete?(): void; onManageCategories?(): void; onManageTags?(): void }

export default function TransactionForm({ busy, categories, initialCategoryPickerOpen = false, initialType = 'expense', tags, transaction, onCancel, onSubmit, onDelete, onManageCategories, onManageTags }: Props) {
  const initialCategory = initialType === 'transfer' ? 'Transfer' : ''
  const initial = transaction ? transactionToDraft(transaction) : { localDate: localDateValue(), localTime: localTimeValue(), type: initialType, category: initialCategory, tag: null, amount: 0, note: '', destination: null, transactionNumber: null, source: 'manual' as const, dateInferred: false }
  const [draft, setDraft] = useState<TransactionDraft>(initial)
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [submitted, setSubmitted] = useState(false)
  const [menu, setMenu] = useState(false)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(initialCategoryPickerOpen)
  const errors = submitted ? validateTransaction({ ...draft, amount: Number(amount) }) : {}
  const available = useMemo(() => categories.filter((item) => item.type === draft.type), [categories, draft.type])
  const selectedCategory = available.find((item) => item.name === draft.category)
  const setType = (type: TransactionType) => setDraft((old) => ({ ...old, type, category: type === 'transfer' ? 'Transfer' : '', tag: type === 'transfer' ? null : old.tag }))
  const submit = () => {
    const next = { ...draft, amount: Number(amount), category: draft.type === 'transfer' ? 'Transfer' : draft.category, dateInferred: draft.source === 'receipt_ai' ? false : draft.dateInferred }
    setSubmitted(true)
    if (!Object.keys(validateTransaction(next)).length) onSubmit(draftToUtcInput(next))
  }
  const confirmDelete = () => { if (onDelete && window.confirm('Delete this transaction? This cannot be undone.')) onDelete() }
  return <main className="transaction-screen">
    <header className="entry-header"><button aria-label="Close" onClick={onCancel} type="button"><Icon name="close" size={28} /></button><div className="entry-tabs">{(['expense', 'income', 'transfer'] as const).map((type) => <button className={draft.type === type ? 'active' : ''} disabled={draft.source === 'receipt_ai' && type !== 'expense'} key={type} onClick={() => setType(type)} type="button"><b><Icon name={type === 'expense' ? 'arrow-up' : type === 'income' ? 'arrow-down' : 'transfer'} size={24} /></b><span>{type[0].toUpperCase() + type.slice(1)}</span></button>)}</div>{transaction ? <div className="more-wrap"><button aria-label="More" onClick={() => setMenu(!menu)} type="button"><Icon name="more" size={27} /></button>{menu && <button className="delete-menu" onClick={confirmDelete} type="button">Delete transaction</button>}</div> : <span />}</header>
    <div className="entry-body">
      <div className="entry-date"><Icon name="calendar" size={23} /><input max={localDateValue()} onChange={(event) => setDraft({ ...draft, localDate: event.target.value })} type="date" value={draft.localDate} /><input onChange={(event) => setDraft({ ...draft, localTime: event.target.value })} type="time" value={draft.localTime} /></div>
      {errors.localDate && <em className="field-error">{errors.localDate}</em>}
      <label className={`amount-panel ${draft.type}`}><span><Icon name={draft.type === 'expense' ? 'arrow-up' : draft.type === 'income' ? 'arrow-down' : 'transfer'} size={43} /></span><input aria-invalid={Boolean(errors.amount)} aria-label="Amount" autoComplete="off" autoFocus inputMode="decimal" onChange={(event) => { if (isValidAmountInput(event.target.value)) setAmount(event.target.value) }} pattern="[0-9]*([.][0-9]{0,2})?" placeholder="0" required type="text" value={amount} /><b>฿</b></label>
      {errors.amount && <em className="field-error">{errors.amount}</em>}
      {draft.type !== 'transfer' && <button aria-invalid={Boolean(errors.category)} aria-label={draft.category ? `Category, ${draft.category}` : 'Choose category'} className={`category-selection-button ${categoryPickerOpen ? 'open' : ''}`} onClick={() => setCategoryPickerOpen(true)} type="button"><span className="category-selection-icon"><CategoryIcon iconUrl={selectedCategory?.iconUrl ?? null} /></span><span><strong>{draft.category || 'Choose category / tag'}</strong>{draft.tag && <small>#{draft.tag}</small>}</span><Icon name="chevron-right" size={22} /></button>}
      {errors.category && <em className="field-error">{errors.category}</em>}
      <label className="note-panel"><span><Icon name="note" /></span><input aria-invalid={Boolean(errors.note)} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Add note" value={draft.note} /></label>
      {errors.note && <em className="field-error">{errors.note}</em>}
      {draft.source === 'receipt_ai' && <>
        <label className="note-panel"><span><Icon name="store" /></span><input onChange={(event) => setDraft({ ...draft, destination: event.target.value || null })} placeholder="ชื่อร้าน" value={draft.destination ?? ''} /></label>
        <label className="note-panel"><span><Icon name="receipt" /></span><input onChange={(event) => setDraft({ ...draft, transactionNumber: event.target.value || null })} placeholder="เลขที่รายการ" value={draft.transactionNumber ?? ''} /></label>
        {draft.dateInferred && <p className="receipt-date-warning">วันที่เดิมอ่านไม่ได้ กรุณาตรวจสอบวันที่ก่อนบันทึก</p>}
      </>}
      {draft.type !== 'transfer' && <button className="future-option" disabled title="Coming later" type="button"><Icon name="repeat" /> <span>Schedule again</span><small>Coming later</small></button>}
      {draft.type === 'transfer' && <p className="transfer-help">Transfers are excluded from income and expense totals. Use them for moving money between accounts.</p>}
    </div>
    <button className="save-entry" disabled={busy} onClick={submit} type="button">{busy ? 'Saving…' : 'Save'}</button>
    {categoryPickerOpen && <CategoryPickerDialog
      categories={available}
      onCancel={() => setCategoryPickerOpen(false)}
      onClearTag={() => setDraft({ ...draft, tag: null })}
      onManageCategories={() => { setCategoryPickerOpen(false); onManageCategories?.() }}
      onManageTags={() => { setCategoryPickerOpen(false); onManageTags?.() }}
      onSelectCategory={(category) => { setDraft({ ...draft, category: category.name }); setCategoryPickerOpen(false) }}
      onToggleTag={(tag) => setDraft({ ...draft, tag: draft.tag === tag.name ? null : tag.name })}
      selectedCategory={draft.category}
      selectedTag={draft.tag}
      tags={tags}
    />}
  </main>
}
