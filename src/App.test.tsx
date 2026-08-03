import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { defaultCompanyData } from './lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('opens the template list, selects one, and shows its detail view', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()

    await user.click(screen.getByText(/Información de Empresa/))
    expect(screen.getByRole('dialog', { name: /Información de Empresa/ })).toBeInTheDocument()
  })

  it('going back from detail returns to the template list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText(/Información de Empresa/))
    await user.click(screen.getByRole('button', { name: 'Volver' }))

    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()
  })

  it('opens settings, saves a valid company field, and it propagates into a template', async () => {
    const user = userEvent.setup()
    render(<App />)

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

    render(<App />)
    await user.click(screen.getByText(/Información de Empresa/))
    await user.click(screen.getByRole('button', { name: /Copiar al portapapeles/ }))

    const history = JSON.parse(localStorage.getItem('jungleFilms_history')!)
    expect(history).toHaveLength(1)
    expect(history[0].templateId).toBe('info-empresa')
  })

  it('marking a template as favorite persists and reorders it first in the list', async () => {
    const user = userEvent.setup()
    render(<App />)

    const favoriteButtons = screen.getAllByRole('button', { name: /favorito/ })
    await user.click(favoriteButtons[favoriteButtons.length - 1])

    expect(JSON.parse(localStorage.getItem('jungleFilms_favorites')!)).toHaveLength(1)
  })

  it('creates a custom template that then appears in the list and can be used', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))

    await user.type(screen.getByLabelText(/Nombre/), 'Aviso de Vacaciones')
    await user.type(screen.getByLabelText(/Mensaje/), 'Estaremos de vacaciones hasta {{fecha}')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()
    expect(screen.getByText(/Aviso de Vacaciones/)).toBeInTheDocument()

    const customTemplates = JSON.parse(localStorage.getItem('jungleFilms_customTemplates')!)
    expect(customTemplates).toHaveLength(1)
    expect(customTemplates[0].name).toBe('Aviso de Vacaciones')

    await user.click(screen.getByText(/Aviso de Vacaciones/))
    expect(screen.getByTestId('rendered-preview').textContent).toContain('Estaremos de vacaciones hasta')
  })

  it('editing a built-in template stores an override without deleting the original definition', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Editar Información de Empresa/ }))
    const nameInput = screen.getByLabelText(/Nombre/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Datos de Contacto')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText(/Datos de Contacto/)).toBeInTheDocument()
    const overrides = JSON.parse(localStorage.getItem('jungleFilms_templateOverrides')!)
    expect(overrides['info-empresa'].name).toBe('Datos de Contacto')
  })

  it('duplicating a template creates an independent custom copy', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Editar Información de Empresa/ }))
    await user.click(screen.getByRole('button', { name: 'Duplicar template' }))

    expect(screen.getByText(/Información de Empresa \(copia\)/)).toBeInTheDocument()
    const customTemplates = JSON.parse(localStorage.getItem('jungleFilms_customTemplates')!)
    expect(customTemplates).toHaveLength(1)
    expect(customTemplates[0].name).toBe('Información de Empresa (copia)')
  })

  it('editing an existing custom template updates it in place instead of creating a new one', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))
    await user.type(screen.getByLabelText(/Nombre/), 'Borrador')
    await user.type(screen.getByLabelText(/Mensaje/), 'Texto inicial')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(screen.getByRole('button', { name: 'Editar Borrador' }))
    const nameInput = screen.getByLabelText(/Nombre/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Versión Final')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText(/Versión Final/)).toBeInTheDocument()
    const customTemplates = JSON.parse(localStorage.getItem('jungleFilms_customTemplates')!)
    expect(customTemplates).toHaveLength(1)
    expect(customTemplates[0].name).toBe('Versión Final')
  })

  it('restoring a customized built-in template clears its override', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Editar Información de Empresa/ }))
    const nameInput = screen.getByLabelText(/Nombre/)
    await user.clear(nameInput)
    await user.type(nameInput, 'Nombre Cambiado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(screen.getByRole('button', { name: 'Editar Nombre Cambiado' }))
    await user.click(screen.getByRole('button', { name: 'Restaurar original' }))

    expect(screen.getByText(/Información de Empresa/)).toBeInTheDocument()
    expect(screen.queryByText(/Nombre Cambiado/)).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('jungleFilms_templateOverrides')!)['info-empresa']).toBeUndefined()
  })

  it('importing a backup file updates the company data and the template list', async () => {
    const user = userEvent.setup()
    render(<App />)

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
    expect(screen.getByText(/Template Importado/)).toBeInTheDocument()
  })

  it('deleting a custom template removes it from the list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))
    await user.type(screen.getByLabelText(/Nombre/), 'Temporal')
    await user.type(screen.getByLabelText(/Mensaje/), 'Texto')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(screen.getByRole('button', { name: /Editar Temporal/ }))
    await user.click(screen.getByRole('button', { name: 'Eliminar template' }))

    expect(screen.queryByText(/Temporal/)).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('jungleFilms_customTemplates')!)).toHaveLength(0)
  })
})
