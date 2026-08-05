import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CollaboratorsPanel } from './CollaboratorsPanel'
import type { Collaborator } from '../types'

const collaborators: Collaborator[] = [
  {
    id: 'collab-1',
    name: 'Antonio Ramírez',
    role: 'Director',
    phone: '+51 987 654 321',
    dni: '12345678',
    photo: null,
    customFields: [{ id: 'instagram', label: 'Instagram', value: '@antonio.jf' }],
  },
  {
    id: 'collab-2',
    name: 'Sasha Delgado',
    role: '',
    phone: '+51 999 111 222',
    dni: '87654321',
    photo: 'data:image/png;base64,fake',
    customFields: [],
  },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof CollaboratorsPanel>> = {}) {
  return render(
    <CollaboratorsPanel
      collaborators={collaborators}
      onSelect={vi.fn()}
      onCreate={vi.fn()}
      {...overrides}
    />,
  )
}

describe('CollaboratorsPanel', () => {
  it('lists every collaborator with their name and role', () => {
    renderPanel()
    expect(screen.getByText('Antonio Ramírez')).toBeInTheDocument()
    expect(screen.getByText('Director')).toBeInTheDocument()
    expect(screen.getByText('Sasha Delgado')).toBeInTheDocument()
  })

  it('shows initials when there is no photo, and renders an image when there is one', () => {
    renderPanel()
    expect(screen.getByText('AR')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,fake')
  })

  it('calls onSelect with the tapped collaborator', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPanel({ onSelect })
    await user.click(screen.getByText('Antonio Ramírez'))
    expect(onSelect).toHaveBeenCalledWith(collaborators[0])
  })

  it('calls onCreate when the "Agregar" card is tapped', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderPanel({ onCreate })
    await user.click(screen.getByRole('button', { name: 'Agregar colaborador' }))
    expect(onCreate).toHaveBeenCalled()
  })

  it('shows an empty-state hint when there are no collaborators', () => {
    renderPanel({ collaborators: [] })
    expect(screen.getByText(/Aún no agregas a nadie/)).toBeInTheDocument()
  })

})
