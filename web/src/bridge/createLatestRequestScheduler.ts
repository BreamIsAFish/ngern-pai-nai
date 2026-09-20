interface LatestRequestJob<Result> {
  request(): Promise<Result>
  onError(error: unknown): void
  onSettled(): void
  onSuccess(result: Result): void
}

interface LatestRequestSchedulerOptions {
  delayMs: number
}

interface LatestRequestScheduler {
  cancel(): void
  schedule<Result>(job: LatestRequestJob<Result>): void
}

/**
 * Debounces async work and applies results only when the job is still current.
 *
 * @param options - Configuration containing the debounce delay in milliseconds.
 * @returns A scheduler that can queue the latest job or cancel pending work.
 */
export default function createLatestRequestScheduler({ delayMs }: LatestRequestSchedulerOptions): LatestRequestScheduler {
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = () => {
    generation += 1
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  const schedule = <Result,>(job: LatestRequestJob<Result>) => {
    cancel()
    const jobGeneration = generation
    timer = setTimeout(async () => {
      timer = undefined
      try {
        const result = await job.request()
        if (generation === jobGeneration) job.onSuccess(result)
      } catch (error) {
        if (generation === jobGeneration) job.onError(error)
      } finally {
        if (generation === jobGeneration) job.onSettled()
      }
    }, delayMs)
  }

  return { cancel, schedule }
}
