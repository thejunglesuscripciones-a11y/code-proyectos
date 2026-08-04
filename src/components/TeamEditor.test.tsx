import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamEditor } from './TeamEditor'
import type { Person } from '../types'

const person: Person = { id: 'person-1', name: 'Diego Zúñiga', roleLabel: 'Camarógrafo', isExternal: true, contactInfo: '+51 999 111 222' }

describe('TeamEditor', () => {
  it('starts blank when adding a new person', () => {
    render(<TeamEditor person={null} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.queryByLabelText('Eliminar persona')).not.toBeInTheDocument()
  })

  it('pre-fills every field when editing an existing person', () => {
    render(<TeamEditor person={person} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Diego Zúñiga')
    expect(screen.getByLabelText(/Rol/)).toHaveValue('Camarógrafo')
    expect(screen.getByLabelText(/Teléfono o email/)).toHaveValue('+51 999 111 222')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('blocks saving and shows an error when the name is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TeamEditor person={null} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves trimmed values with isExternal toggled on', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<TeamEditor person={null} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre/), '  Kiara  ')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Kiara', roleLabel: '', isExternal: true, contactInfo: '' })
  })

  it('shows an error and keeps the form open when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    render(<TeamEditor person={null} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre/), 'Kiara')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('calls onDelete when editing and the delete button is tapped', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TeamEditor person={person} onSave={vi.fn()} onDelete={onDelete} onClose={vi.fn()} />)
    await user.click(screen.getByLabelText('Eliminar persona'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('calls onClose when the close button is tapped', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TeamEditor person={null} onSave={vi.fn()} onDelete={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
