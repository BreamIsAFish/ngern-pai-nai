import { useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import getPullStage from './getPullStage'

interface PullToRefreshProps {
  children: ReactNode
  refreshing: boolean
  onRefresh?(): void
}

const triggerDistance = 80

export default function PullToRefresh({ children, refreshing, onRefresh }: PullToRefreshProps) {
  const startY = useRef<number | undefined>(undefined)
  const distance = useRef(0)
  const [stage, setStage] = useState<ReturnType<typeof getPullStage>>(0)

  const reset = () => {
    startY.current = undefined
    distance.current = 0
    setStage(0)
  }

  const startPull = (event: TouchEvent<HTMLDivElement>) => {
    if (refreshing || window.scrollY > 0) return
    startY.current = event.touches[0]?.clientY
  }

  const movePull = (event: TouchEvent<HTMLDivElement>) => {
    if (startY.current === undefined || refreshing || window.scrollY > 0) return
    const nextDistance = Math.max(0, (event.touches[0]?.clientY ?? startY.current) - startY.current)
    distance.current = nextDistance
    setStage(getPullStage({ distance: nextDistance, triggerDistance }))
    if (nextDistance > 8) event.preventDefault()
  }

  const finishPull = () => {
    const shouldRefresh = distance.current >= triggerDistance
    reset()
    if (shouldRefresh) onRefresh?.()
  }

  const indicatorStage = refreshing ? 5 : stage
  const message = refreshing
    ? 'Refreshing your Sheet...'
    : indicatorStage === 5
      ? 'Release to refresh'
      : 'Pull to refresh'

  return (
    <div
      className={`pull-refresh-shell pull-stage-${indicatorStage}${refreshing ? ' is-refreshing' : ''}`}
      onTouchCancel={reset}
      onTouchEnd={finishPull}
      onTouchMove={movePull}
      onTouchStart={startPull}
    >
      <div aria-live="polite" className="pull-refresh-indicator">
        <span aria-hidden="true" className="pull-refresh-cat">฿</span>
        <span>{message}</span>
      </div>
      {children}
    </div>
  )
}
