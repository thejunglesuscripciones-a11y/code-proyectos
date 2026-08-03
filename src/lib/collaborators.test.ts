import { describe, expect, it } from 'vitest'
import { collaboratorCopyText, createCollaboratorDraft, initials, readFileAsDataUrl } from './collaborators'
import type { Collaborator } from '../types'

describe('initials', () => {
  it('takes the first letter of the first two words, uppercased', () => {
    expect(initials('renzo quispe')).toBe('RQ')
  })

  it('handles a single-word name', () => {
    expect(initials('Sasha')).toBe('S')
  })

  it('ignores a third word', () => {
    expect(initials('Ana María López')).toBe('AM')
  })

  it('collapses extra whitespace between words', () => {
    expect(initials('  Renzo   Quispe  ')).toBe('RQ')
  })

  it('returns an empty string for a blank name', () => {
    expect(initials('   ')).toBe('')
  })
})

describe('createCollaboratorDraft', () => {
  it('generates a unique id and keeps the given content', () => {
    const content = { name: 'Renzo', role: 'Camarógrafo', phone: '', dni: '', photo: null, customFields: [] }
    const draft = createCollaboratorDraft(content)
    expect(draft.id).toMatch(/^collab-/)
    expect(draft).toMatchObject(content)
  })

  it('generates different ids on each call', () => {
    const content = { name: 'A', role: '', phone: '', dni: '', photo: null, customFields: [] }
    const a = createCollaboratorDraft(content)
    const b = createCollaboratorDraft(content)
    expect(a.id).not.toBe(b.id)
  })
})

const baseCollaborator: Collaborator = {
  id: 'collab-1',
  name: 'Antonio Ramírez',
  role: 'Director',
  phone: '+51 987 654 321',
  dni: '12345678',
  photo: null,
  customFields: [{ id: 'instagram', label: 'Instagram', value: '@antonio.jf' }],
}

describe('collaboratorCopyText', () => {
  it('builds a block with name, role, phone, dni and filled custom fields', () => {
    expect(collaboratorCopyText(baseCollaborator)).toBe(
      'Antonio Ramírez\nDirector\nTeléfono: +51 987 654 321\nDNI: 12345678\nInstagram: @antonio.jf',
    )
  })

  it('omits role, phone, dni and custom fields that are empty', () => {
    const minimal: Collaborator = {
      id: 'collab-2',
      name: 'Sasha',
      role: '',
      phone: '',
      dni: '',
      photo: null,
      customFields: [{ id: 'instagram', label: 'Instagram', value: '' }],
    }
    expect(collaboratorCopyText(minimal)).toBe('Sasha')
  })
})

describe('readFileAsDataUrl', () => {
  it('resolves with a data URL for the given file', async () => {
    const file = new File(['fake-image-bytes'], 'foto.jpg', { type: 'image/jpeg' })
    await expect(readFileAsDataUrl(file)).resolves.toMatch(/^data:image\/jpeg/)
  })
})
