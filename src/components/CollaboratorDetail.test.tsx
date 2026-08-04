import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CollaboratorDetail } from './CollaboratorDetail'
import type { Collaborator } from '../types'

const collaborator: Collaborator = {
  id: 'collab-1',
  name: 'Antonio Ramírez',
  role: 'Director',
  phone: '+51 987 654 321',
  dni: '12345678',
  photo: null,
  customFields: [
    { id: 'instagram', label: 'Instagram', value: '@antonio.jf' },
    { id: 'banco', label: 'Banco', value: '' },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('CollaboratorDetail', () => {
  it('shows the name, role, photo/initials, phone, dni and filled custom fields', () => {
    render(<CollaboratorDetail collaborator={collaborator} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Antonio Ramírez')).toBeInTheDocument()
    expect(screen.getByText('Director')).toBeInTheDocument()
    expect(screen.getByText('AR')).toBeInTheDocument()
    expect(screen.getByText('+51 987 654 321')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('@antonio.jf')).toBeInTheDocument()
  })

  it('does not render a custom field row when its value is empty', () => {
    render(<CollaboratorDetail collaborator={collaborator} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText('Banco')).not.toBeInTheDocument()
  })

  it('renders the photo when the collaborator has one', () => {
    const withPhoto = { ...collaborator, photo: 'data:image/png;base64,fake' }
    render(<CollaboratorDetail collaborator={withPhoto} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('img', { name: 'Antonio Ramírez' })).toHaveAttribute('src', 'data:image/png;base64,fake')
  })

  it('copies name, role, phone, dni and filled fields, and shows the "¡Copiado!" indicator, then reverts', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<CollaboratorDetail collaborator={collaborator} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Copiar información/ }))

    expect(writeText).toHaveBeenCalledWith(
      'Antonio Ramírez\nDirector\nTeléfono: +51 987 654 321\nDNI: 12345678\nInstagram: @antonio.jf',
    )
    expect(await screen.findByText('¡Copiado!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    await waitFor(() => expect(screen.queryByText('¡Copiado!')).not.toBeInTheDocument())
  })

  it('calls onBack, onEdit and onDelete', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<CollaboratorDetail collaborator={collaborator} onBack={onBack} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Volver' }))
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: /Eliminar/ }))

    expect(onBack).toHaveBeenCalled()
    expect(onEdit).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalled()
  })

  it('shows a placeholder dash for an empty phone or dni', () => {
    const bare = { ...collaborator, phone: '', dni: '' }
    render(<CollaboratorDetail collaborator={bare} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('shows an "Editado por" caption when the collaborator has attribution', () => {
    const withAttribution = {
      ...collaborator,
      updatedBy: { name: 'Sasha', email: 'sashahuamani2@gmail.com', updatedAt: '2026-01-01T00:00:00.000Z' },
    }
    render(<CollaboratorDetail collaborator={withAttribution} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/Editado por Sasha/)).toBeInTheDocument()
  })

  it('does not show a caption when there is no attribution', () => {
    render(<CollaboratorDetail collaborator={collaborator} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText(/Editado por/)).not.toBeInTheDocument()
  })

  it('falls back to the email in the caption when the attribution has no name', () => {
    const withAttribution = {
      ...collaborator,
      updatedBy: { name: '', email: 'antonio@gorilia.com', updatedAt: '2026-01-01T00:00:00.000Z' },
    }
    render(<CollaboratorDetail collaborator={withAttribution} onBack={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/Editado por antonio@gorilia.com/)).toBeInTheDocument()
  })
})
