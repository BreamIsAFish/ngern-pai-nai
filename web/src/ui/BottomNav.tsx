import Icon from './Icon'

interface Props {
  active: 'home' | 'summary' | 'profile'
  onHome(): void
  onSummary(): void
  onAdd(): void
  onScanReceipt(): void
  onProfile(): void
}

export default function BottomNav({ active, onHome, onSummary, onAdd, onScanReceipt, onProfile }: Props) {
  return <nav aria-label="Main" className="bottom-nav">
    <button aria-label="Home" aria-current={active === 'home' ? 'page' : undefined} className={active === 'home' ? 'active' : ''} onClick={onHome} type="button"><Icon name="home" size={22} /></button>
    <button aria-label="Summary" aria-current={active === 'summary' ? 'page' : undefined} className={active === 'summary' ? 'active' : ''} onClick={onSummary} type="button"><Icon name="chart" size={22} /></button>
    <button aria-label="Add entry" className="nav-add" onClick={onAdd} type="button"><Icon name="plus" size={26} /></button>
    <button aria-label="Scan receipt" onClick={onScanReceipt} type="button"><Icon name="receipt" size={22} /></button>
    <button aria-label="Profile" aria-current={active === 'profile' ? 'page' : undefined} className={active === 'profile' ? 'active' : ''} onClick={onProfile} type="button"><Icon name="profile" size={22} /></button>
  </nav>
}
