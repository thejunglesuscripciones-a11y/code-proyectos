import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginScreen } from './LoginScreen'

describe('LoginScreen', () => {
  it('calls onSignIn when the Google button is clicked', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()
    render(<LoginScreen onSignIn={onSignIn} loading={false} error={null} />)

    await user.click(screen.getByRole('button', { name: /Iniciar sesión con Google/ }))
    expect(onSignIn).toHaveBeenCalled()
  })

  it('disables the button and shows "Conectando…" while loading', () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={true} error={null} />)
    const button = screen.getByRole('button', { name: /Conectando/ })
    expect(button).toBeDisabled()
  })

  it('shows an error message when given one', () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={false} error="No se pudo iniciar sesión." />)
    expect(screen.getByText('No se pudo iniciar sesión.')).toBeInTheDocument()
  })

  it('does not show an error message when there is none', () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={false} error={null} />)
    expect(screen.queryByText(/No se pudo/)).not.toBeInTheDocument()
  })
})
