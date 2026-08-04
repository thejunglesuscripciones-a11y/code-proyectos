import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClientEditor } from './ClientEditor'
import type { Client } from '../types'

const client: Client = {
  id: 'client-1',
  name: 'Adidas Perú',
  contactName: 'Renzo',
  contactEmail: 'renzo@adidas.com',
  contactPhone: '+51 987 654 321',
  notes: 'Cliente frecuente',
}

describe('ClientEditor', () => {
  it('starts blank when creating a new client', () => {
    render(<ClientEditor client={null} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('')
    expect(screen.queryByLabelText('Eliminar cliente')).not.toBeInTheDocument()
  })

  it('pre-fills every field when editing an existing client', () => {
    render(<ClientEditor client={client} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Adidas Perú')
    expect(screen.getByLabelText(/Persona de contacto/)).toHaveValue('Renzo')
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('+51 987 654 321')
    expect(screen.getByLabelText(/Email/)).toHaveValue('renzo@adidas.com')
    expect(screen.getByLabelText(/Notas/)).toHaveValue('Cliente frecuente')
  })

  it('blocks saving and shows an error when the name is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ClientEditor client={null} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves trimmed values', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ClientEditor client={null} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre/), '  Nike  ')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Nike', contactName: '', contactEmail: '', contactPhone: '', notes: '' })
  })

  it('shows an error and keeps the form open when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    render(<ClientEditor client={null} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre/), 'Nike')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('calls onDelete when editing and the delete button is tapped', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<ClientEditor client={client} onSave={vi.fn()} onDelete={onDelete} onClose={vi.fn()} />)
    await user.click(screen.getByLabelText('Eliminar cliente'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('calls onClose when the close button is tapped', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ClientEditor client={null} onSave={vi.fn()} onDelete={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
