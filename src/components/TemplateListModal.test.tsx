import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TemplateListModal } from './TemplateListModal'
import { templates } from '../lib/templates'

describe('TemplateListModal', () => {
  it('lists all 8 templates by default', () => {
    render(
      <TemplateListModal
        templates={templates}
        favorites={[]}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getAllByRole('button', { name: /favorito/ })).toHaveLength(8)
  })

  it('filters by search query matching the name', async () => {
    const user = userEvent.setup()
    render(
      <TemplateListModal
        templates={templates}
        favorites={[]}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    await user.type(screen.getByPlaceholderText('Buscar template...'), 'cotización')
    expect(screen.getByText(/Solicitar Cotización/)).toBeInTheDocument()
    expect(screen.queryByText(/Información de Empresa/)).not.toBeInTheDocument()
  })

  it('shows an empty state when the search has no matches', async () => {
    const user = userEvent.setup()
    render(
      <TemplateListModal
        templates={templates}
        favorites={[]}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    await user.type(screen.getByPlaceholderText('Buscar template...'), 'xyz-no-existe')
    expect(screen.getByText('Sin resultados.')).toBeInTheDocument()
  })

  it('sorts favorited templates first', () => {
    const lastTemplate = templates[templates.length - 1]
    render(
      <TemplateListModal
        templates={templates}
        favorites={[lastTemplate.id]}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    const names = screen.getAllByRole('button', { name: new RegExp(lastTemplate.name) })
    expect(names[0]).toBeInTheDocument()
    const allTitles = screen.getAllByText(/^(📋|🎬|💰|💳|✅|📝|📅|📊)/)
    expect(allTitles[0].textContent).toContain(lastTemplate.name)
  })

  it('calls onSelect with the chosen template', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <TemplateListModal
        templates={templates}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    await user.click(screen.getByText(/Información de Empresa/))
    expect(onSelect).toHaveBeenCalledWith(templates[0])
  })

  it('calls onToggleFavorite without triggering onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggleFavorite = vi.fn()
    render(
      <TemplateListModal
        templates={templates}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        onClose={vi.fn()}
      />,
    )
    await user.click(screen.getAllByRole('button', { name: /favorito/ })[0])
    expect(onToggleFavorite).toHaveBeenCalledWith(templates[0].id)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
