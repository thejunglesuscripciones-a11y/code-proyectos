import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TemplateListModal } from './TemplateListModal'
import { builtInTemplates as templates } from '../lib/templates'

function renderModal(overrides: Partial<React.ComponentProps<typeof TemplateListModal>> = {}) {
  return render(
    <TemplateListModal
      templates={templates}
      favorites={[]}
      onSelect={vi.fn()}
      onToggleFavorite={vi.fn()}
      onCreate={vi.fn()}
      onEdit={vi.fn()}
      {...overrides}
    />,
  )
}

describe('TemplateListModal', () => {
  it('lists all 8 templates by default', () => {
    renderModal()
    expect(screen.getAllByRole('button', { name: /favorito/ })).toHaveLength(8)
  })

  it('filters by search query matching the name', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByPlaceholderText('Buscar template...'), 'cotización')
    expect(screen.getByText(/Solicitar Cotización/)).toBeInTheDocument()
    expect(screen.queryByText(/Información de Empresa/)).not.toBeInTheDocument()
  })

  it('shows an empty state when the search has no matches', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByPlaceholderText('Buscar template...'), 'xyz-no-existe')
    expect(screen.getByText('Sin resultados.')).toBeInTheDocument()
  })

  it('sorts favorited templates first', () => {
    const lastTemplate = templates[templates.length - 1]
    renderModal({ favorites: [lastTemplate.id] })
    const allTitles = screen.getAllByText(/^(📋|🎬|💰|💳|✅|📝|📅|📊)/)
    expect(allTitles[0].textContent).toContain(lastTemplate.name)
  })

  it('calls onSelect with the chosen template', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderModal({ onSelect })
    await user.click(screen.getByText(/Información de Empresa/))
    expect(onSelect).toHaveBeenCalledWith(templates[0])
  })

  it('calls onToggleFavorite without triggering onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggleFavorite = vi.fn()
    renderModal({ onSelect, onToggleFavorite })
    await user.click(screen.getAllByRole('button', { name: /favorito/ })[0])
    expect(onToggleFavorite).toHaveBeenCalledWith(templates[0].id)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls onCreate when the "+" button is clicked', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderModal({ onCreate })
    await user.click(screen.getByRole('button', { name: 'Nuevo template' }))
    expect(onCreate).toHaveBeenCalled()
  })

  it('calls onEdit with the corresponding template when its pencil icon is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderModal({ onEdit })
    await user.click(screen.getByRole('button', { name: `Editar ${templates[0].name}` }))
    expect(onEdit).toHaveBeenCalledWith(templates[0])
  })
})
