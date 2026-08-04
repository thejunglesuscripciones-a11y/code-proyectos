import { describe, expect, it } from 'vitest'
import { createProjectDraft, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from './projects'

describe('createProjectDraft', () => {
  it('generates a unique id and keeps the given content', () => {
    const content = { clientId: 'client-1', name: 'Campaña Running', status: 'en_curso' as const }
    const draft = createProjectDraft(content)
    expect(draft.id).toMatch(/^project-/)
    expect(draft).toMatchObject(content)
  })

  it('generates different ids on each call', () => {
    const content = { clientId: null, name: 'A', status: 'prospecto' as const }
    const a = createProjectDraft(content)
    const b = createProjectDraft(content)
    expect(a.id).not.toBe(b.id)
  })
})

describe('PROJECT_STATUSES / PROJECT_STATUS_LABELS', () => {
  it('has a label for every status', () => {
    for (const status of PROJECT_STATUSES) {
      expect(PROJECT_STATUS_LABELS[status]).toBeTruthy()
    }
  })
})
