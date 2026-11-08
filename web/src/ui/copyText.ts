interface CopyTextOptions {
  text: string
  container: HTMLElement
}

/** Copies text, using a selected textarea inside the active modal for older WKWebViews. */
export default async function copyText({ text, container }: CopyTextOptions): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* Try the selection-based clipboard API when clipboard access is denied. */ }

  const previousFocus = document.activeElement
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.className = 'clipboard-textarea'
  textarea.setAttribute('aria-hidden', 'true')
  container.appendChild(textarea)
  try {
    textarea.focus({ preventScroll: true })
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true })
  }
}
