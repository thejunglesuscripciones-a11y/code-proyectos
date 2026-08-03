import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CollaboratorEditor } from './CollaboratorEditor'
import type { Collaborator } from '../types'

const collaborator: Collaborator = {
  id: 'collab-1',
  name: 'Antonio Ramírez',
  role: 'Director',
  phone: '+51 987 654 321',
  dni: '12345678',
  photo: null,
  customFields: [{ id: 'instagram', label: 'Instagram', value: '@antonio.jf' }],
}

describe('CollaboratorEditor', () => {
  it('starts blank with a default Instagram field when creating a new collaborator', () => {
    render(<CollaboratorEditor collaborator={null} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue('')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Instagram')
    expect(screen.getByLabelText('Valor')).toHaveValue('')
  })

  it('pre-fills every field when editing an existing collaborator', () => {
    render(<CollaboratorEditor collaborator={collaborator} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue('Antonio Ramírez')
    expect(screen.getByLabelText(/Rol/)).toHaveValue('Director')
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('+51 987 654 321')
    expect(screen.getByLabelText(/DNI/)).toHaveValue('12345678')
    expect(screen.getByLabelText('Valor')).toHaveValue('@antonio.jf')
  })

  it('blocks saving and shows an error when the name is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={onSave} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving for an invalid phone', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={onSave} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre completo/), 'Renzo')
    await user.type(screen.getByLabelText(/Teléfono/), '12345')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Teléfono inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving for an invalid dni', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={onSave} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre completo/), 'Renzo')
    await user.type(screen.getByLabelText(/DNI/), '123')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('DNI inválido (8 dígitos)')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves with trimmed values and the custom fields, including the default Instagram row', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={onSave} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/Nombre completo/), '  Renzo Quispe  ')
    await user.type(screen.getByLabelText(/Rol/), 'Camarógrafo freelance')
    await user.type(screen.getByLabelText(/Teléfono/), '+51 987 654 321')
    await user.type(screen.getByLabelText(/DNI/), '12345678')
    await user.type(screen.getByLabelText('Valor'), '@renzo.q')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith({
      name: 'Renzo Quispe',
      role: 'Camarógrafo freelance',
      phone: '+51 987 654 321',
      dni: '12345678',
      photo: null,
      customFields: [{ id: 'instagram', label: 'Instagram', value: '@renzo.q' }],
    })
  })

  it('adds a new custom field with a generated id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={onSave} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/Nombre completo/), 'Renzo')
    await user.type(screen.getByLabelText('Nuevo campo'), 'Banco')
    await user.click(screen.getByRole('button', { name: 'Agregar campo' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        customFields: [
          { id: 'instagram', label: 'Instagram', value: '' },
          { id: 'banco', label: 'Banco', value: '' },
        ],
      }),
    )
  })

  it('removes a custom field before saving', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={collaborator} onSave={onSave} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Eliminar campo Instagram' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ customFields: [] }))
  })

  it('previews and saves an uploaded photo', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={onSave} onClose={vi.fn()} />)

    const file = new File(['fake-bytes'], 'foto.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await screen.findByAltText('Foto del colaborador')
    await user.type(screen.getByLabelText(/Nombre completo/), 'Renzo')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ photo: expect.stringMatching(/^data:image\/jpeg/) }))
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CollaboratorEditor collaborator={null} onSave={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('adding a field via Enter clears the input', async () => {
    const user = userEvent.setup()
    render(<CollaboratorEditor collaborator={null} onSave={vi.fn()} onClose={vi.fn()} />)
    const input = screen.getByLabelText('Nuevo campo')
    await user.type(input, 'Correo{Enter}')
    expect(input).toHaveValue('')
  })

  it('does not add a field with a blank name', async () => {
    const user = userEvent.setup()
    render(<CollaboratorEditor collaborator={null} onSave={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Agregar campo' }))
    expect(screen.getAllByLabelText('Nombre')).toHaveLength(1)
  })
})
