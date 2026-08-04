import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPanel } from './CalendarPanel'
import type { CalendarEvent } from '../types'

const events: CalendarEvent[] = [
  { id: '1', date: '2026-08-15', time: '10:00', title: 'Reunión', note: '', blocked: false },
  { id: '2', date: '2026-08-20', time: '', title: 'No disponible', note: '', blocked: true },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof CalendarPanel>> = {}) {
  return render(<CalendarPanel events={events} onSelectDay={vi.fn()} onTabChange={vi.fn()} {...overrides} />)
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 7, 4))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CalendarPanel', () => {
  it('shows the current month and year', () => {
    renderPanel()
    expect(screen.getByText('Agosto 2026')).toBeInTheDocument()
  })

  it('calls onSelectDay with the tapped day’s date key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onSelectDay = vi.fn()
    renderPanel({ onSelectDay })

    await user.click(screen.getByLabelText('2026-08-15'))

    expect(onSelectDay).toHaveBeenCalledWith('2026-08-15')
  })

  it('navigates to the next and previous month', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('Septiembre 2026')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByText('Julio 2026')).toBeInTheDocument()
  })

  it('shows the tab bar with Calendario active, and calls onTabChange', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onTabChange = vi.fn()
    renderPanel({ onTabChange })

    expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Templates' }))
    expect(onTabChange).toHaveBeenCalledWith('templates')
  })
})
