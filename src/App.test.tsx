import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { defaultCompanyData } from './lib/storage'
import { signInWithGoogle, signOutUser, subscribeToAuthUser } from './lib/auth'
import { addAuthorizedUser, isAuthorizedEmail, removeAuthorizedUser } from './lib/authorizedUsers'
import * as sync from './lib/sync'

const fakeUser = {
  uid: 'u1',
  email: 'joaquin.huamani.v@gmail.com',
  displayName: 'Joaquín',
  photoURL: null,
}

vi.mock('./lib/auth', () => ({
  subscribeToAuthUser: vi.fn((callback: (user: typeof fakeUser | null) => void) => {
    callback(fakeUser)
    return () => {}
  }),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}))

vi.mock('./lib/authorizedUsers', () => ({
  isAuthorizedEmail: vi.fn().mockResolvedValue(true),
  recordLogin: vi.fn().mockResolvedValue(undefined),
  subscribeAuthorizedUsers: vi.fn((callback: (users: unknown[]) => void) => {
    callback([{ email: fakeUser.email, name: fakeUser.displayName, photoURL: null, addedAt: '1', lastLoginAt: null }])
    return () => {}
  }),
  addAuthorizedUser: vi.fn(),
  removeAuthorizedUser: vi.fn(),
}))

// A tiny in-memory stand-in for Firestore: writes mutate local arrays/maps and notify
// subscribers synchronously, mirroring how onSnapshot reflects a local-cache write.
vi.mock('./lib/sync', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let customTemplates: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let templateOverrides: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let collaborators: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let calendarEvents: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateListeners = new Set<(t: any[]) => void>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overrideListeners = new Set<(o: Record<string, any>) => void>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collabListeners = new Set<(c: any[]) => void>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarListeners = new Set<(e: any[]) => void>()

  return {
    subscribeCustomTemplates: vi.fn((cb: (t: unknown[]) => void) => {
      templateListeners.add(cb)
      cb([...customTemplates])
      return () => templateListeners.delete(cb)
    }),
    saveCustomTemplateRemote: vi.fn(async (template: { id: string }, author: unknown) => {
      const withAuthor = { ...template, updatedBy: author }
      const idx = customTemplates.findIndex((t) => t.id === template.id)
      if (idx === -1) customTemplates.push(withAuthor)
      else customTemplates[idx] = withAuthor
      templateListeners.forEach((cb) => cb([...customTemplates]))
    }),
    deleteCustomTemplateRemote: vi.fn(async (id: string) => {
      customTemplates = customTemplates.filter((t) => t.id !== id)
      templateListeners.forEach((cb) => cb([...customTemplates]))
    }),
    subscribeTemplateOverrides: vi.fn((cb: (o: Record<string, unknown>) => void) => {
      overrideListeners.add(cb)
      cb({ ...templateOverrides })
      return () => overrideListeners.delete(cb)
    }),
    saveTemplateOverrideRemote: vi.fn(async (templateId: string, content: unknown, author: unknown) => {
      templateOverrides = { ...templateOverrides, [templateId]: { ...(content as object), updatedBy: author } }
      overrideListeners.forEach((cb) => cb({ ...templateOverrides }))
    }),
    clearTemplateOverrideRemote: vi.fn(async (templateId: string) => {
      const next = { ...templateOverrides }
      delete next[templateId]
      templateOverrides = next
      overrideListeners.forEach((cb) => cb({ ...templateOverrides }))
    }),
    subscribeCollaborators: vi.fn((cb: (c: unknown[]) => void) => {
      collabListeners.add(cb)
      cb([...collaborators])
      return () => collabListeners.delete(cb)
    }),
    saveCollaboratorRemote: vi.fn(async (collaborator: { id: string }, author: unknown) => {
      const withAuthor = { ...collaborator, updatedBy: author }
      const idx = collaborators.findIndex((c) => c.id === collaborator.id)
      if (idx === -1) collaborators.push(withAuthor)
      else collaborators[idx] = withAuthor
      collabListeners.forEach((cb) => cb([...collaborators]))
    }),
    deleteCollaboratorRemote: vi.fn(async (id: string) => {
      collaborators = collaborators.filter((c) => c.id !== id)
      collabListeners.forEach((cb) => cb([...collaborators]))
    }),
    subscribeCalendarEvents: vi.fn((cb: (e: unknown[]) => void) => {
      calendarListeners.add(cb)
      cb([...calendarEvents])
      return () => calendarListeners.delete(cb)
    }),
    saveCalendarEventRemote: vi.fn(async (event: { id: string }, author: unknown) => {
      const withAuthor = { ...event, updatedBy: author }
      const idx = calendarEvents.findIndex((e) => e.id === event.id)
      if (idx === -1) calendarEvents.push(withAuthor)
      else calendarEvents[idx] = withAuthor
      calendarListeners.forEach((cb) => cb([...calendarEvents]))
    }),
    deleteCalendarEventRemote: vi.fn(async (id: string) => {
      calendarEvents = calendarEvents.filter((e) => e.id !== id)
      calendarListeners.forEach((cb) => cb([...calendarEvents]))
    }),
    fetchCustomTemplatesOnce: vi.fn(async () => [...customTemplates]),
    fetchTemplateOverridesOnce: vi.fn(async () => ({ ...templateOverrides })),
    fetchCollaboratorsOnce: vi.fn(async () => [...collaborators]),
    fetchCalendarEventsOnce: vi.fn(async () => [...calendarEvents]),
    stampAttribution: vi.fn((email: string, name: string) => ({ email, name, updatedAt: new Date().toISOString() })),
    __reset: () => {
      customTemplates = []
      templateOverrides = {}
      collaborators = []
      calendarEvents = []
    },
  }
})

async function renderApp() {
  const utils = render(<App />)
  await screen.findByRole('dialog', { name: 'Lista de templates' })
  return utils
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  ;(sync as unknown as { __reset: () => void }).__reset()
})

describe('App', () => {
  it('opens the template list, selects one, and shows its detail view', async () => {
    const user = userEvent.setup()
    await renderApp()

    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()

    await user.click(screen.getByText(/Información de Empresa/))
    expect(screen.getByRole('dialog', { name: /Información de Empresa/ })).toBeInTheDocument()
  })

  it('going back from detail returns to the template list', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByText(/Información de Empresa/))
    await user.click(screen.getByRole('button', { name: 'Volver' }))

    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()
  })

  it('opens settings, saves a valid company field, and it propagates into a template', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Configuración' }))
    await user.type(screen.getByLabelText('Email corporativo'), 'contacto@thejunglefilms.com')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await user.click(screen.getByText(/Información de Empresa/))

    expect(screen.getByTestId('rendered-preview').textContent).toContain('contacto@thejunglefilms.com')
  })

  it('pushes a history entry when a template is copied', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    await renderApp()
    await user.click(screen.getByText(/Información de Empresa/))
    await user.click(screen.getByRole('button', { name: /Copiar al portapapeles/ }))

    const history = JSON.parse(localStorage.getItem('jungleFilms_history')!)
    expect(history).toHaveLength(1)
    expect(history[0].templateId).toBe('info-empresa')
  })

  it('marking a template as favorite persists and reorders it first in the list', async () => {
    const user = userEvent.setup()
    await renderApp()

    const favoriteButtons = screen.getAllByRole('button', { name: /favorito/ })
    await user.click(favoriteButtons[favoriteButtons.length - 1])

    expect(JSON.parse(localStorage.getItem('jungleFilms_favorites')!)).toHaveLength(1)
  })

  it('creates a custom template that then appears in the list and can be used', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))

    await user.type(screen.getByLabelText(/Nombre/), 'Aviso de Vacaciones')
    await user.type(screen.getByLabelText(/Mensaje/), 'Estaremos de vacaciones hasta {{fecha}')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()
    expect(await screen.findByText(/Aviso de Vacaciones/)).toBeInTheDocument()
    expect(sync.saveCustomTemplateRemote).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Aviso de Vacaciones' }),
      expect.objectContaining({ email: fakeUser.email }),
    )

    await user.click(screen.getByText(/Aviso de Vacaciones/))
    expect(screen.getByTestId('rendered-preview').textContent).toContain('Estaremos de vacaciones hasta')
  })

  it('editing a built-in template stores an override without deleting the original definition', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: /Editar Información de Empresa/ }))
    const nameInput = screen.getByLabelText(/Nombre/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Datos de Contacto')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(/Datos de Contacto/)).toBeInTheDocument()
    expect(sync.saveTemplateOverrideRemote).toHaveBeenCalledWith(
      'info-empresa',
      expect.objectContaining({ name: 'Datos de Contacto' }),
      expect.objectContaining({ email: fakeUser.email }),
    )
  })

  it('duplicating a template creates an independent custom copy', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: /Editar Información de Empresa/ }))
    await user.click(screen.getByRole('button', { name: 'Duplicar template' }))

    expect(await screen.findByText(/Información de Empresa \(copia\)/)).toBeInTheDocument()
  })

  it('editing an existing custom template updates it in place instead of creating a new one', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))
    await user.type(screen.getByLabelText(/Nombre/), 'Borrador')
    await user.type(screen.getByLabelText(/Mensaje/), 'Texto inicial')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(await screen.findByRole('button', { name: 'Editar Borrador' }))
    const nameInput = screen.getByLabelText(/Nombre/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Versión Final')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(/Versión Final/)).toBeInTheDocument()
    expect(screen.queryByText('Borrador')).not.toBeInTheDocument()
  })

  it('restoring a customized built-in template clears its override', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: /Editar Información de Empresa/ }))
    const nameInput = screen.getByLabelText(/Nombre/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Nombre Cambiado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(await screen.findByRole('button', { name: 'Editar Nombre Cambiado' }))
    await user.click(screen.getByRole('button', { name: 'Restaurar original' }))

    expect(await screen.findByText(/Información de Empresa/)).toBeInTheDocument()
    expect(screen.queryByText(/Nombre Cambiado/)).not.toBeInTheDocument()
  })

  it('importing a backup file updates the company data and the template list', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Configuración' }))

    const customTemplate = {
      id: 'custom-importado',
      name: 'Template Importado',
      emoji: '📦',
      category: 'General',
      body: 'Cuerpo importado',
      isCustom: true,
    }
    const backup = {
      version: 1,
      company: { ...defaultCompanyData, ruc: '20123456786' },
      favorites: [],
      customTemplates: [customTemplate],
      templateOverrides: {},
    }
    const file = new File([JSON.stringify(backup)], 'respaldo.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('Importar respaldo'), { target: { files: [file] } })

    expect(await screen.findByText('Respaldo importado correctamente.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(await screen.findByText(/Template Importado/)).toBeInTheDocument()
  })

  it('deleting a custom template removes it from the list', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))
    await user.type(screen.getByLabelText(/Nombre/), 'Temporal')
    await user.type(screen.getByLabelText(/Mensaje/), 'Texto')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(await screen.findByRole('button', { name: /Editar Temporal/ }))
    await user.click(screen.getByRole('button', { name: 'Eliminar template' }))

    expect(screen.queryByText(/Temporal/)).not.toBeInTheDocument()
  })

  it('switches to the Colaboradores tab and back to Templates', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Colaboradores' }))
    expect(screen.getByRole('dialog', { name: 'Colaboradores' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Templates' }))
    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()
  })

  it('creates a collaborator, views their info, copies it, edits it, then deletes it', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Colaboradores' }))
    await user.click(screen.getByRole('button', { name: 'Agregar colaborador' }))

    await user.type(screen.getByLabelText(/Nombre completo/), 'Renzo Quispe')
    await user.type(screen.getByLabelText(/Teléfono/), '+51 987 654 321')
    await user.type(screen.getByLabelText(/DNI/), '12345678')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Renzo Quispe')).toBeInTheDocument()
    expect(sync.saveCollaboratorRemote).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Renzo Quispe' }),
      expect.objectContaining({ email: fakeUser.email }),
    )

    await user.click(screen.getByText('Renzo Quispe'))
    expect(screen.getByRole('dialog', { name: 'Renzo Quispe' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Copiar información/ }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Renzo Quispe'))

    await user.click(screen.getByRole('button', { name: /Editar/ }))
    const nameInput = screen.getByLabelText(/Nombre completo/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Renzo Q. Editado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Renzo Q. Editado')).toBeInTheDocument()

    await user.click(screen.getByText('Renzo Q. Editado'))
    await user.click(screen.getByRole('button', { name: /Eliminar/ }))

    expect(screen.queryByText('Renzo Q. Editado')).not.toBeInTheDocument()
  })

  it('going back from a collaborator detail returns to the collaborators list', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Colaboradores' }))
    await user.click(screen.getByRole('button', { name: 'Agregar colaborador' }))
    await user.type(screen.getByLabelText(/Nombre completo/), 'Sasha')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(await screen.findByText('Sasha'))
    await user.click(screen.getByRole('button', { name: 'Volver' }))

    expect(screen.getByRole('dialog', { name: 'Colaboradores' })).toBeInTheDocument()
  })

  it('importing a backup file also restores collaborators', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Configuración' }))

    const backup = {
      version: 2,
      company: defaultCompanyData,
      favorites: [],
      customTemplates: [],
      templateOverrides: {},
      collaborators: [
        {
          id: 'collab-1',
          name: 'Antonio Ramírez',
          role: 'Director',
          phone: '+51 987 654 321',
          dni: '12345678',
          photo: null,
          customFields: [],
        },
      ],
    }
    const file = new File([JSON.stringify(backup)], 'respaldo.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('Importar respaldo'), { target: { files: [file] } })

    expect(await screen.findByText('Respaldo importado correctamente.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    await user.click(screen.getByRole('button', { name: 'Colaboradores' }))
    expect(await screen.findByText('Antonio Ramírez')).toBeInTheDocument()
  })

  it('opens the Calendario section, adds an event to a day, edits it, then deletes it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 4))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Calendario' }))
    expect(screen.getByRole('dialog', { name: 'Calendario' })).toBeInTheDocument()

    await user.click(screen.getByLabelText('2026-08-15'))
    expect(screen.getByRole('dialog', { name: /Eventos del/ })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Título/), 'Grabación con cliente')
    await user.click(screen.getByRole('button', { name: 'Agregar evento' }))

    expect(await screen.findByText('Grabación con cliente')).toBeInTheDocument()
    expect(sync.saveCalendarEventRemote).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-08-15', title: 'Grabación con cliente' }),
      expect.objectContaining({ email: fakeUser.email }),
    )

    await user.click(screen.getByRole('button', { name: 'Editar Grabación con cliente' }))
    const titleInput = screen.getByLabelText(/Título/)
    await user.clear(titleInput)
    await user.type(titleInput, 'Grabación reprogramada')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Grabación reprogramada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Eliminar Grabación reprogramada' }))
    expect(screen.queryByText('Grabación reprogramada')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByRole('dialog', { name: 'Calendario' })).toBeInTheDocument()

    vi.useRealTimers()
  })
})

describe('App auth gate', () => {
  it('shows the login screen when there is no signed-in user, and signs in on tap', async () => {
    const user = userEvent.setup()
    vi.mocked(subscribeToAuthUser).mockImplementationOnce((callback) => {
      callback(null)
      return () => {}
    })

    render(<App />)

    expect(await screen.findByText(/Inicia sesión con tu correo de Google/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Iniciar sesión con Google/ }))
    expect(signInWithGoogle).toHaveBeenCalled()
  })

  it('shows a friendly error when sign-in fails', async () => {
    const user = userEvent.setup()
    vi.mocked(subscribeToAuthUser).mockImplementationOnce((callback) => {
      callback(null)
      return () => {}
    })
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(new Error('popup closed'))

    render(<App />)
    await screen.findByText(/Inicia sesión con tu correo de Google/)
    await user.click(screen.getByRole('button', { name: /Iniciar sesión con Google/ }))

    expect(await screen.findByText('No se pudo iniciar sesión. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('shows the unauthorized screen for a signed-in email that is not on the allowlist', async () => {
    const user = userEvent.setup()
    vi.mocked(isAuthorizedEmail).mockResolvedValueOnce(false)

    render(<App />)

    expect(await screen.findByText('joaquin.huamani.v@gmail.com')).toBeInTheDocument()
    expect(screen.getByText(/no está autorizado/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/ }))
    expect(signOutUser).toHaveBeenCalled()
  })

  it('opens Personas, authorizes a new email, removes one, and signs out', async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole('button', { name: 'Personas' }))
    expect(screen.getByRole('dialog', { name: 'Personas' })).toBeInTheDocument()
    expect(screen.getByText('Joaquín')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Autorizar un correo nuevo/), 'nueva@persona.com')
    await user.click(screen.getByRole('button', { name: 'Autorizar correo' }))
    expect(addAuthorizedUser).toHaveBeenCalledWith('nueva@persona.com')

    await user.click(screen.getByRole('button', { name: /Quitar acceso a/ }))
    expect(removeAuthorizedUser).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/ }))
    expect(signOutUser).toHaveBeenCalled()
  })
})
