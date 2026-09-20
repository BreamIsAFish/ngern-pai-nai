export type PullStage = 0 | 1 | 2 | 3 | 4 | 5

interface GetPullStageOptions {
  distance: number
  triggerDistance: number
}

/**
 * Converts a pull distance into one of five visual progress stages.
 *
 * @param options - The measured pull distance and refresh threshold in pixels.
 * @returns A stage from 0 for idle through 5 for ready to refresh.
 *
 * @example
 * getPullStage({ distance: 48, triggerDistance: 80 })
 */
export default function getPullStage({ distance, triggerDistance }: GetPullStageOptions): PullStage {
  if (distance <= 0 || triggerDistance <= 0) return 0
  return Math.min(5, Math.ceil((distance / triggerDistance) * 5)) as PullStage
}
