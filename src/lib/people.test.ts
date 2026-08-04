import { describe, expect, it } from 'vitest'
import { createPersonDraft, personInitials } from './people'

describe('createPersonDraft', () => {
  it('generates a unique id and keeps the given content', () => {
    const content = { name: 'Diego Zúñiga', roleLabel: 'Camarógrafo', isExternal: false, contactInfo: '' }
    const draft = createPersonDraft(content)
    expect(draft.id).toMatch(/^person-/)
    expect(draft).toMatchObject(content)
  })

  it('generates different ids on each call', () => {
    const content = { name: 'A', roleLabel: '', isExternal: false, contactInfo: '' }
    const a = createPersonDraft(content)
    const b = createPersonDraft(content)
    expect(a.id).not.toBe(b.id)
  })
})

describe('personInitials', () => {
  it('takes the first letter of the first two words, uppercased', () => {
    expect(personInitials('diego zúñiga')).toBe('DZ')
  })

  it('handles a single-word name', () => {
    expect(personInitials('Sasha')).toBe('S')
  })

  it('ignores a third word', () => {
    expect(personInitials('Ana María López')).toBe('AM')
  })

  it('returns an empty string for a blank name', () => {
    expect(personInitials('   ')).toBe('')
  })
})
