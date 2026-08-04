import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectEditor } from './ProjectEditor'
import type { Client, Project } from '../types'

const clients: Client[] = [{ id: 'client-1', name: 'Adidas Perú', contactName: '', contactEmail: '', contactPhone: '', notes: '' }]

const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Campaña Running', status: 'en_curso' }

describe('ProjectEditor', () => {
  it('starts blank with default status when creating a new project', () => {
    render(<ProjectEditor project={null} clients={clients} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Prospecto' })).toHaveClass('shadow-jungle/30')
  })

  it('pre-fills fields when editing an existing project', () => {
    render(<ProjectEditor project={project} clients={clients} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Campaña Running')
    expect(screen.getByLabelText(/Cliente/)).toHaveValue('client-1')
    expect(screen.getByRole('button', { name: 'En curso' })).toHaveClass('shadow-jungle/30')
  })

  it('blocks saving and shows an error when the name is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ProjectEditor project={null} clients={clients} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves with the chosen client and status', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProjectEditor project={null} clients={clients} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre/), 'Nuevo proyecto')
    await user.selectOptions(screen.getByLabelText(/Cliente/), 'client-1')
    await user.click(screen.getByRole('button', { name: 'Entregado' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Nuevo proyecto', clientId: 'client-1', status: 'entregado' })
  })

  it('shows an error and keeps the form open when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    render(<ProjectEditor project={null} clients={clients} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre/), 'X')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('calls onDelete when editing and the delete button is tapped', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<ProjectEditor project={project} clients={clients} onSave={vi.fn()} onDelete={onDelete} onClose={vi.fn()} />)
    await user.click(screen.getByLabelText('Eliminar proyecto'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('calls onClose when the close button is tapped', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ProjectEditor project={null} clients={clients} onSave={vi.fn()} onDelete={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
