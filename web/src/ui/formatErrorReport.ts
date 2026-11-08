import type { ErrorDetails } from './errorDetails'

/** Formats the displayed error and its captured app context as a plain-text report. */
export default function formatErrorReport(error: ErrorDetails): string {
  return [
    `Message: ${error.message}`,
    `Code: ${error.code ?? 'Not available'}`,
    `Type: ${error.type ?? 'Not available'}`,
    `Operation: ${error.operation ?? 'Not available'}`,
    `Details JSON: ${JSON.stringify(error.data ?? null, null, 2)}`,
    `App time ISO: ${error.appTime}`,
    `User agent: ${error.userAgent}`,
  ].join('\n')
}
