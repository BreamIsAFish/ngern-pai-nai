import { afterEach, describe, expect, it, vi } from 'vitest'
import createLatestRequestScheduler from './createLatestRequestScheduler'

describe('latest request scheduler', () => {
  afterEach(() => vi.useRealTimers())

  it('starts only the final request when the user changes selection quickly', async () => {
    vi.useFakeTimers()
    const scheduler = createLatestRequestScheduler({ delayMs: 200 })
    const requests: string[] = []
    const results: string[] = []
    const schedule = (month: string) => scheduler.schedule({
      request: async () => { requests.push(month); return month },
      onError: vi.fn(),
      onSettled: vi.fn(),
      onSuccess: (result) => results.push(result),
    })

    schedule('2026-08')
    schedule('2026-07')
    schedule('2026-06')
    await vi.advanceTimersByTimeAsync(200)

    expect(requests).toEqual(['2026-06'])
    expect(results).toEqual(['2026-06'])
  })

  it('ignores a slow response after a newer request has been scheduled', async () => {
    vi.useFakeTimers()
    const scheduler = createLatestRequestScheduler({ delayMs: 20 })
    const results: string[] = []
    let finishOldRequest: ((value: string) => void) | undefined

    scheduler.schedule({
      request: () => new Promise<string>((resolve) => { finishOldRequest = resolve }),
      onError: vi.fn(), onSettled: vi.fn(), onSuccess: (result) => results.push(result),
    })
    await vi.advanceTimersByTimeAsync(20)
    scheduler.schedule({
      request: async () => 'new',
      onError: vi.fn(), onSettled: vi.fn(), onSuccess: (result) => results.push(result),
    })
    await vi.advanceTimersByTimeAsync(20)
    finishOldRequest?.('old')
    await Promise.resolve()

    expect(results).toEqual(['new'])
  })
})
