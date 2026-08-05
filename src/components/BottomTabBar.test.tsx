import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BottomTabBar } from './BottomTabBar'

describe('BottomTabBar', () => {
  it('renders the three tabs with the active one marked', () => {
    render(<BottomTabBar active="calendario" onSelect={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Plantillas' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Equipo' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onSelect with the tapped tab', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BottomTabBar active="calendario" onSelect={onSelect} />)
    await user.click(screen.getByRole('tab', { name: 'Equipo' }))
    expect(onSelect).toHaveBeenCalledWith('equipo')
  })

  it('switches the active tab when the active prop changes', () => {
    const { rerender } = render(<BottomTabBar active="calendario" onSelect={vi.fn()} />)
    rerender(<BottomTabBar active="plantillas" onSelect={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Plantillas' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('aria-selected', 'false')
  })
})
