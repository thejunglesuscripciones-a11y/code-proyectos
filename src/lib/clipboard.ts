/**
 * Copies text to the clipboard, falling back to the execCommand/textarea trick
 * for contexts without the async Clipboard API (older WebViews, non-HTTPS).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to legacy fallback below
    }
  }

  const textarea = document.createElement('textarea')
  try {
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}
