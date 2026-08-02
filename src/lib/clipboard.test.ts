import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './clipboard'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('copyToClipboard', () => {
  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const ok = await copyToClipboard('hola mundo')

    expect(writeText).toHaveBeenCalledWith('hola mundo')
    expect(ok).toBe(true)
  })

  it('falls back to execCommand when Clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    const ok = await copyToClipboard('texto de respaldo')

    expect(execCommandSpy).toHaveBeenCalledWith('copy')
    expect(ok).toBe(true)
  })

  it('falls back to execCommand when Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    const ok = await copyToClipboard('texto')

    expect(execCommandSpy).toHaveBeenCalledWith('copy')
    expect(ok).toBe(true)
  })

  it('returns false when both the Clipboard API and the fallback fail', async () => {
    vi.stubGlobal('navigator', {})
    vi.spyOn(document, 'execCommand').mockReturnValue(false)

    const ok = await copyToClipboard('texto')

    expect(ok).toBe(false)
  })

  it('returns false and cleans up the textarea when the fallback throws', async () => {
    vi.stubGlobal('navigator', {})
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('not supported')
    })

    const ok = await copyToClipboard('texto')

    expect(ok).toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('does not leave a stray textarea in the DOM after the fallback runs', async () => {
    vi.stubGlobal('navigator', {})
    vi.spyOn(document, 'execCommand').mockReturnValue(true)

    await copyToClipboard('texto')

    expect(document.querySelector('textarea')).toBeNull()
  })
})
