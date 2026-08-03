import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UnauthorizedScreen } from './UnauthorizedScreen'

describe('UnauthorizedScreen', () => {
  it('shows the blocked email', () => {
    render(<UnauthorizedScreen email="desconocido@gmail.com" onSignOut={vi.fn()} />)
    expect(screen.getByText('desconocido@gmail.com')).toBeInTheDocument()
  })

  it('calls onSignOut when the button is clicked', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    render(<UnauthorizedScreen email="desconocido@gmail.com" onSignOut={onSignOut} />)
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/ }))
    expect(onSignOut).toHaveBeenCalled()
  })
})
