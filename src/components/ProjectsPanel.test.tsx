import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectsPanel } from './ProjectsPanel'
import type { Client, Project } from '../types'

const clients: Client[] = [{ id: 'client-1', name: 'Adidas Perú', contactName: '', contactEmail: '', contactPhone: '', notes: '' }]

const projects: Project[] = [
  { id: 'project-1', clientId: 'client-1', name: 'Campaña Running', status: 'en_curso' },
  { id: 'project-2', clientId: null, name: 'Sin cliente', status: 'prospecto' },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof ProjectsPanel>> = {}) {
  return render(<ProjectsPanel projects={projects} clients={clients} onSelect={vi.fn()} onCreate={vi.fn()} onBack={vi.fn()} {...overrides} />)
}

describe('ProjectsPanel', () => {
  it('lists every project with its status and client name when set', () => {
    renderPanel()
    expect(screen.getByText('Campaña Running')).toBeInTheDocument()
    expect(screen.getByText('Adidas Perú')).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText('Sin cliente')).toBeInTheDocument()
    expect(screen.getByText('Prospecto')).toBeInTheDocument()
  })

  it('calls onSelect with the tapped project', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPanel({ onSelect })
    await user.click(screen.getByText('Campaña Running'))
    expect(onSelect).toHaveBeenCalledWith(projects[0])
  })

  it('calls onCreate when "Nuevo proyecto" is tapped', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderPanel({ onCreate })
    await user.click(screen.getByRole('button', { name: /Nuevo proyecto/ }))
    expect(onCreate).toHaveBeenCalled()
  })

  it('calls onBack when the back button is tapped', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderPanel({ onBack })
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows an empty-state hint when there are no projects', () => {
    renderPanel({ projects: [] })
    expect(screen.getByText(/Aún no agregas proyectos/)).toBeInTheDocument()
  })
})
