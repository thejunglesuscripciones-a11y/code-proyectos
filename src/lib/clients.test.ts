import { describe, expect, it } from 'vitest'
import { createClientDraft } from './clients'

describe('createClientDraft', () => {
  it('generates a unique id and keeps the given content', () => {
    const content = { name: 'Adidas Perú', contactName: 'Renzo', contactEmail: '', contactPhone: '', notes: '' }
    const draft = createClientDraft(content)
    expect(draft.id).toMatch(/^client-/)
    expect(draft).toMatchObject(content)
  })

  it('generates different ids on each call', () => {
    const content = { name: 'A', contactName: '', contactEmail: '', contactPhone: '', notes: '' }
    const a = createClientDraft(content)
    const b = createClientDraft(content)
    expect(a.id).not.toBe(b.id)
  })
})
