import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('opens the template list, selects one, and shows its detail view', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Abrir templates' }))
    expect(screen.getByRole('dialog', { name: 'Lista de templates' })).toBeInTheDocument()

    await user.click(screen.getByText(/Información de Empresa/))
    expect(screen.getByRole('dialog', { name: /Información de Empresa/ })).toBeInTheDocument()
  })

  it('going back from detail returns to the template list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Abrir templates' }))
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

    await user.click(screen.getByRole('button', { name: 'Abrir templates' }))
    await user.click(screen.getByText(/Información de Empresa/))

    expect(screen.getByTestId('rendered-preview').textContent).toContain('contacto@thejunglefilms.com')
  })

  it('pushes a history entry when a template is copied', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Abrir templates' }))
    await user.click(screen.getByText(/Información de Empresa/))
    await user.click(screen.getByRole('button', { name: /Copiar al portapapeles/ }))

    const history = JSON.parse(localStorage.getItem('jungleFilms_history')!)
    expect(history).toHaveLength(1)
    expect(history[0].templateId).toBe('info-empresa')
  })

  it('marking a template as favorite persists and reorders it first in the list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Abrir templates' }))
    const favoriteButtons = screen.getAllByRole('button', { name: /favorito/ })
    await user.click(favoriteButtons[favoriteButtons.length - 1])

    expect(JSON.parse(localStorage.getItem('jungleFilms_favorites')!)).toHaveLength(1)
  })
})
