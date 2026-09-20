import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../ui/Icon'

interface Props {
  latestMonth: string
  month: string
  onCancel?(): void
  onSelect?(month: string): void
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const valueForMonth = (year: number, monthIndex: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`

const labelForMonth = (month: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
}).format(new Date(`${month}-01T12:00:00`))

export default function MonthPickerDialog({ latestMonth, month, onCancel, onSelect }: Props) {
  const [draftMonth, setDraftMonth] = useState(month)
  const [visibleYear, setVisibleYear] = useState(Number(month.slice(0, 4)))
  const latestYear = Number(latestMonth.slice(0, 4))

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onCancel])

  const chooseLatestMonth = () => {
    setDraftMonth(latestMonth)
    setVisibleYear(latestYear)
  }

  return createPortal(
    <div className="month-picker-overlay">
      <button aria-label="Close month picker" className="month-picker-scrim" onClick={onCancel} type="button" />
      <section aria-label="Select month" aria-modal="true" className="month-picker-dialog" role="dialog">
        <header>
          <h2>Monthly <Icon name="chevron-right" size={22} /></h2>
          <button aria-label="Month picker settings, coming later" disabled title="Coming later" type="button"><Icon name="settings" size={27} /></button>
        </header>
        <strong className="month-picker-selection">{labelForMonth(draftMonth)}</strong>
        <div className="month-picker-rule" />
        <div className="month-picker-year-nav">
          <button aria-label="Previous year" onClick={() => setVisibleYear((year) => year - 1)} type="button"><Icon name="back" size={23} /></button>
          <strong>{visibleYear}</strong>
          <button aria-label="Next year" disabled={visibleYear >= latestYear} onClick={() => setVisibleYear((year) => year + 1)} type="button"><Icon name="chevron-right" size={23} /></button>
        </div>
        <div className="month-picker-grid">
          {monthNames.map((name, monthIndex) => {
            const value = valueForMonth(visibleYear, monthIndex)
            return <button aria-pressed={draftMonth === value} disabled={value > latestMonth} key={name} onClick={() => setDraftMonth(value)} type="button">{name}</button>
          })}
        </div>
        <footer>
          <button className="month-picker-current" onClick={chooseLatestMonth} type="button">This month</button>
          <button className="month-picker-cancel" onClick={onCancel} type="button">Cancel</button>
          <button className="month-picker-select" onClick={() => onSelect?.(draftMonth)} type="button">Select</button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
