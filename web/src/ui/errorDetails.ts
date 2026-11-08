import { BridgeRequestError } from '../bridge/createNativeBridge'

export interface ErrorDetails {
  message: string
  appTime: string
  userAgent: string
  type?: string
  code?: string
  operation?: string
  data?: unknown
}

export type ReportError = (error?: unknown, fallback?: string) => void

/** Keeps diagnostic fields when presenting a caught error to the user. */
export default function errorDetails(error: unknown, fallback = 'Something went wrong. Please try again.'): ErrorDetails {
  const context = { appTime: new Date().toISOString(), userAgent: navigator.userAgent }
  if (error instanceof Error) {
    return {
      ...context,
      message: error.message || fallback,
      type: error.name,
      ...(error instanceof BridgeRequestError ? { code: error.code, data: error.data, operation: error.operation } : {}),
    }
  }
  return {
    ...context,
    message: typeof error === 'string' && error ? error : fallback,
    ...(error !== undefined && typeof error !== 'string' ? { data: error } : {}),
  }
}
