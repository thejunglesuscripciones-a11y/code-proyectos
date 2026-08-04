import { describe, expect, it } from 'vitest'
import { createCommentDraft } from './comments'

describe('createCommentDraft', () => {
  it('builds a comment with a unique id, the given event/text, and the author attached', () => {
    const before = new Date().toISOString()
    const draft = createCommentDraft('event-1', 'Confirmado con el cliente', { name: 'Antonio', email: 'antonio@gorilia.com' })
    expect(draft.id).toMatch(/^comment-/)
    expect(draft.eventId).toBe('event-1')
    expect(draft.text).toBe('Confirmado con el cliente')
    expect(draft.authorName).toBe('Antonio')
    expect(draft.authorEmail).toBe('antonio@gorilia.com')
    expect(draft.createdAt >= before).toBe(true)
  })

  it('generates different ids on each call', () => {
    const author = { name: 'A', email: 'a@b.com' }
    const a = createCommentDraft('event-1', 'x', author)
    const b = createCommentDraft('event-1', 'x', author)
    expect(a.id).not.toBe(b.id)
  })
})
