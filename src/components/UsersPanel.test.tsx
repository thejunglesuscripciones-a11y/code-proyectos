import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UsersPanel } from './UsersPanel'
import type { AuthorizedUser } from '../types'

const users: AuthorizedUser[] = [
  {
    email: 'antonio@gorilia.com',
    name: 'Antonio',
    photoURL: 'https://x/antonio.png',
    addedAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: '2026-01-02T00:00:00.000Z',
  },
  {
    email: 'nueva@persona.com',
    name: '',
    photoURL: null,
    addedAt: '2026-01-03T00:00:00.000Z',
    lastLoginAt: null,
  },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof UsersPanel>> = {}) {
  return render(
    <UsersPanel
      users={users}
      currentEmail="joaquin.huamani.v@gmail.com"
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onSignOut={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  )
}

describe('UsersPanel', () => {
  it('shows each authorized user by name, or by email when they have not logged in yet', () => {
    renderPanel()
    expect(screen.getByText('Antonio')).toBeInTheDocument()
    expect(screen.getByText('nueva@persona.com')).toBeInTheDocument()
  })

  it('shows the photo when there is one, and initials otherwise', () => {
    renderPanel()
    expect(screen.getByRole('img', { name: 'Antonio' })).toHaveAttribute('src', 'https://x/antonio.png')
    expect(screen.getByText('NU')).toBeInTheDocument()
  })

  it('calls onAdd with the trimmed email and clears the input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    renderPanel({ onAdd })

    const input = screen.getByLabelText(/Autorizar un correo nuevo/)
    await user.type(input, '  otra@persona.com  ')
    await user.click(screen.getByRole('button', { name: 'Autorizar correo' }))

    expect(onAdd).toHaveBeenCalledWith('otra@persona.com')
    expect(input).toHaveValue('')
  })

  it('adds an email via Enter', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    renderPanel({ onAdd })
    await user.type(screen.getByLabelText(/Autorizar un correo nuevo/), 'otra@persona.com{Enter}')
    expect(onAdd).toHaveBeenCalledWith('otra@persona.com')
  })

  it('does not call onAdd for a blank email', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    renderPanel({ onAdd })
    await user.click(screen.getByRole('button', { name: 'Autorizar correo' }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('calls onRemove with the email of the tapped user', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    renderPanel({ onRemove })
    await user.click(screen.getByRole('button', { name: 'Quitar acceso a antonio@gorilia.com' }))
    expect(onRemove).toHaveBeenCalledWith('antonio@gorilia.com')
  })

  it('calls onSignOut and shows the current email on the button', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    renderPanel({ onSignOut })
    const button = screen.getByRole('button', { name: /Cerrar sesión/ })
    expect(button).toHaveTextContent('joaquin.huamani.v@gmail.com')
    await user.click(button)
    expect(onSignOut).toHaveBeenCalled()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderPanel({ onClose })
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
