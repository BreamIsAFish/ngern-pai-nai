import { useEffect, useMemo, useRef, useState } from 'react'
import bridge from '../bridge/client'
import type { ReceiptImageSelection } from '../bridge/types'
import mapTransaction, { type Transaction } from '../transactions/model'
import { utcMonthForTransaction } from '../transactions/time'
import Icon from '../ui/Icon'

type ItemStatus = 'queued' | 'processing' | 'added' | 'duplicate' | 'failed' | 'cancelled' | 'deleted'
interface ResultItem { id: string; name: string; status: ItemStatus; transaction?: Transaction; warnings: string[]; message?: string; requestId?: string }
interface Props {
  selection: Required<Pick<ReceiptImageSelection, 'batchId' | 'images'>>
  onClose?(): void
  onEdit?(transaction: Transaction): void
  onTransactionAdded?(transaction: Transaction): void
  onTransactionDeleted?(id: string): void
}

const statusLabels: Record<ItemStatus, string> = {
  queued: 'รอดำเนินการ', processing: 'กำลังอ่าน', added: 'เพิ่มแล้ว', duplicate: 'ซ้ำ ไม่ได้เพิ่ม', failed: 'ไม่สำเร็จ', cancelled: 'ยกเลิกแล้ว', deleted: 'ลบแล้ว',
}

export default function ReceiptImportModal({ selection, onClose, onEdit, onTransactionAdded, onTransactionDeleted }: Props) {
  const [items, setItems] = useState<ResultItem[]>(selection.images.map((image) => ({ ...image, status: 'queued', warnings: [] })))
  const itemsRef = useRef(items)
  const queueRef = useRef(selection.images.map((image) => image.id))
  const activeRef = useRef(0)
  const cancelledRef = useRef(false)
  const mountedRef = useRef(true)

  const update = (id: string, values: Partial<ResultItem>) => {
    const next = itemsRef.current.map((item) => item.id === id ? { ...item, ...values } : item)
    itemsRef.current = next
    setItems(next)
  }

  const pumpRef = useRef<() => void>(() => undefined)
  pumpRef.current = () => {
    while (!cancelledRef.current && activeRef.current < 3 && queueRef.current.length) {
      const imageId = queueRef.current.shift()!
      if (itemsRef.current.find((item) => item.id === imageId)?.status !== 'queued') continue
      activeRef.current += 1
      update(imageId, { status: 'processing', message: undefined, requestId: undefined })
      void bridge.request('receipts.process', { batchId: selection.batchId, imageId }).then((result) => {
        if (!mountedRef.current) return
        if (result.status === 'added' || result.status === 'duplicate') {
          const transaction = mapTransaction(result.transaction)
          update(imageId, { status: result.status, transaction, warnings: result.warnings })
          if (result.status === 'added') onTransactionAdded?.(transaction)
        } else if (result.status === 'failed') {
          update(imageId, { status: 'failed', warnings: result.warnings, message: result.message, requestId: result.requestId })
        } else {
          update(imageId, { status: 'cancelled', warnings: result.warnings })
        }
      }).catch((error) => {
        if (mountedRef.current) update(imageId, { status: 'failed', message: error instanceof Error ? error.message : 'อ่านใบเสร็จไม่ได้' })
      }).finally(() => {
        activeRef.current -= 1
        if (mountedRef.current) pumpRef.current()
      })
    }
  }

  useEffect(() => {
    mountedRef.current = true
    pumpRef.current()
    return () => { mountedRef.current = false }
  }, [])

  const processing = items.some((item) => item.status === 'queued' || item.status === 'processing')
  const counts = useMemo(() => items.reduce<Record<string, number>>((result, item) => ({ ...result, [item.status]: (result[item.status] ?? 0) + 1 }), {}), [items])

  const retry = (ids: string[]) => {
    for (const id of ids) update(id, { status: 'queued', message: undefined, requestId: undefined })
    queueRef.current.push(...ids)
    pumpRef.current()
  }

  const cancel = async () => {
    cancelledRef.current = true
    queueRef.current = []
    const next = itemsRef.current.map((item) => item.status === 'queued' ? { ...item, status: 'cancelled' as const } : item)
    itemsRef.current = next
    setItems(next)
    try {
      await bridge.request('receipts.cancel', { batchId: selection.batchId })
    } catch {
      // The local queue is already cancelled. In-flight requests will settle safely.
    }
  }

  const close = async () => {
    if (processing) return
    try {
      await bridge.request('receipts.discard', { batchId: selection.batchId })
      onClose?.()
    } catch {
      window.alert('ปิดผลการสแกนไม่ได้ กรุณาลองอีกครั้ง')
    }
  }

  const remove = async (item: ResultItem) => {
    if (!item.transaction || !window.confirm('ลบรายการนี้? การลบไม่สามารถย้อนกลับได้')) return
    try {
      await bridge.request('transactions.delete', { id: item.transaction.id, utcMonth: utcMonthForTransaction(item.transaction) })
      update(item.id, { status: 'deleted' })
      onTransactionDeleted?.(item.transaction.id)
    } catch {
      window.alert('ลบรายการไม่ได้ กรุณาลองอีกครั้ง')
    }
  }

  return <div className="receipt-results-layer">
    <div className="receipt-scrim" />
    <section aria-labelledby="receipt-results-title" className="receipt-results-dialog" role="dialog">
      <header><div><h2 id="receipt-results-title">ผลการสแกนใบเสร็จ</h2><small>เพิ่มแล้ว {counts.added ?? 0} · ซ้ำ {counts.duplicate ?? 0} · ไม่สำเร็จ {counts.failed ?? 0}</small></div><button aria-label="ปิด" disabled={processing} onClick={() => void close()} type="button"><Icon name="close" size={26} /></button></header>
      <div className="receipt-results-list">{items.map((item, index) => <article className={`receipt-result ${item.status}`} key={item.id}>
        <span className="receipt-result-number">{index + 1}</span>
        <div><strong>{item.name}</strong><b>{statusLabels[item.status]}</b>{item.transaction && <span>{item.transaction.destination ?? 'ไม่พบชื่อร้าน'} · {new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(item.transaction.amount)} ฿</span>}{item.message && <em>{item.message}</em>}{item.requestId && <small>Request ID: {item.requestId}</small>}{item.warnings.map((warning) => <small key={warning}>• {warning}</small>)}</div>
        <nav>{item.status === 'added' && <><button onClick={() => item.transaction && onEdit?.(item.transaction)} type="button">แก้ไข</button><button onClick={() => void remove(item)} type="button">ลบ</button></>}{item.status === 'duplicate' && <button onClick={() => item.transaction && onEdit?.(item.transaction)} type="button">ดูรายการเดิม</button>}{item.status === 'failed' && <button onClick={() => retry([item.id])} type="button">ลองใหม่</button>}</nav>
      </article>)}</div>
      <footer>{processing ? <button className="danger-action" onClick={() => void cancel()} type="button">ยกเลิกรายการที่เหลือ</button> : <><button disabled={!items.some((item) => item.status === 'failed')} onClick={() => retry(items.filter((item) => item.status === 'failed').map((item) => item.id))} type="button">ลองใหม่ทั้งหมด</button><button className="primary-action" onClick={() => void close()} type="button">เสร็จสิ้น</button></>}</footer>
    </section>
  </div>
}
