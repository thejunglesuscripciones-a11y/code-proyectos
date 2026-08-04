import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TabBar } from './TabBar'

describe('TabBar', () => {
  it('marks the active tab as pressed', () => {
    render(<TabBar active="templates" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Templates' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Colaboradores' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the tapped tab', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TabBar active="templates" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Colaboradores' }))

    expect(onChange).toHaveBeenCalledWith('collabs')
  })

  it('marks calendar as active when selected', () => {
    render(<TabBar active="calendar" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'true')
  })
})
