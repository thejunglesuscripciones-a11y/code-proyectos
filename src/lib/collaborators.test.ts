import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  collaboratorCopyText,
  createCollaboratorDraft,
  initials,
  readFileAsDataUrl,
  readImageAsCompressedDataUrl,
} from './collaborators'
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

describe('readImageAsCompressedDataUrl', () => {
  const realCreateElement = document.createElement.bind(document)

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('draws the decoded image onto a canvas and returns the recompressed jpeg', async () => {
    class DecodingImage {
      naturalWidth = 1600
      naturalHeight = 1200
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', DecodingImage)

    const drawImage = vi.fn()
    let canvasSize = { width: 0, height: 0 }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag !== 'canvas') return realCreateElement(tag)
      const canvas = {
        getContext: () => ({ drawImage }),
        toDataURL: () => 'data:image/jpeg;base64,compressed',
        set width(v: number) {
          canvasSize.width = v
        },
        get width() {
          return canvasSize.width
        },
        set height(v: number) {
          canvasSize.height = v
        },
        get height() {
          return canvasSize.height
        },
      }
      return canvas as unknown as HTMLCanvasElement
    })

    const file = new File(['fake-image-bytes'], 'foto.jpg', { type: 'image/jpeg' })
    await expect(readImageAsCompressedDataUrl(file)).resolves.toBe('data:image/jpeg;base64,compressed')
    expect(drawImage).toHaveBeenCalled()
    // Downscaled to fit within the 640px max dimension, keeping the 4:3 aspect ratio.
    expect(canvasSize).toEqual({ width: 640, height: 480 })
  })

  it('falls back to the original data URL when a 2d canvas context is unavailable', async () => {
    class DecodingImage {
      naturalWidth = 100
      naturalHeight = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', DecodingImage)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag !== 'canvas') return realCreateElement(tag)
      return { getContext: () => null } as unknown as HTMLCanvasElement
    })

    const file = new File(['fake-image-bytes'], 'foto.jpg', { type: 'image/jpeg' })
    await expect(readImageAsCompressedDataUrl(file)).resolves.toMatch(/^data:image\/jpeg/)
  })

  it('falls back to the original data URL when the image fails to decode', async () => {
    class BrokenImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('Image', BrokenImage)

    const file = new File(['fake-image-bytes'], 'foto.jpg', { type: 'image/jpeg' })
    await expect(readImageAsCompressedDataUrl(file)).resolves.toMatch(/^data:image\/jpeg/)
  })
})
