import { afterEach, describe, expect, it, vi } from 'vitest'
import copyText from './copyText'

afterEach(() => vi.unstubAllGlobals())

describe('copy text', () => {
  it('prefers the Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await copyText({ text: 'Error report', container: {} as HTMLElement })).toBe(true)
    expect(writeText).toHaveBeenCalledWith('Error report')
  })

  it.each(['unavailable', 'rejected', 'throws'])('selects a textarea inside the dialog when clipboard access is %s', async (mode) => {
    const writeText = mode === 'throws'
      ? vi.fn(() => { throw new Error('Denied') })
      : vi.fn().mockRejectedValue(new Error('Denied'))
    vi.stubGlobal('navigator', mode === 'unavailable' ? {} : { clipboard: { writeText } })
    const { container, textarea, previousFocus, execCommand } = selectionFallback()
    expect(await copyText({ text: 'Error report', container })).toBe(true)
    expect(container.appendChild).toHaveBeenCalledWith(textarea)
    expect(textarea.value).toBe('Error report')
    expect(textarea.readOnly).toBe(true)
    expect(textarea.select).toHaveBeenCalledOnce()
    expect(textarea.setSelectionRange).toHaveBeenCalledWith(0, 12)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(textarea.remove).toHaveBeenCalledOnce()
    expect(previousFocus.focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it.each([false, 'throws'])('reports failure and removes the textarea when the fallback returns %s', async (result) => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
    const { container, textarea, execCommand } = selectionFallback()
    execCommand.mockImplementation(() => { if (result === 'throws') throw new Error('Unsupported'); return false })
    expect(await copyText({ text: 'Error report', container })).toBe(false)
    expect(textarea.remove).toHaveBeenCalledOnce()
  })
})

function selectionFallback() {
  class Element { focus = vi.fn() }
  const previousFocus = new Element()
  const textarea = {
    value: '', readOnly: false, className: '', setAttribute: vi.fn(), focus: vi.fn(),
    select: vi.fn(), setSelectionRange: vi.fn(), remove: vi.fn(),
  }
  const execCommand = vi.fn(() => true)
  vi.stubGlobal('HTMLElement', Element)
  vi.stubGlobal('document', { activeElement: previousFocus, createElement: vi.fn(() => textarea), execCommand })
  return { container: { appendChild: vi.fn() } as unknown as HTMLElement, textarea, previousFocus, execCommand }
}
