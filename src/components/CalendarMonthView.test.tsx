import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarMonthView } from './CalendarMonthView'
import type { CalendarEvent } from '../types'

const events: CalendarEvent[] = [
  {
    id: 'event-1',
    type: 'grabacion',
    title: 'Adidas',
    clientId: null,
    projectId: null,
    startAt: '2026-08-15T09:00',
    endAt: '2026-08-15T13:00',
    locationText: '',
    personIds: ['person-1'],
    notes: '',
    status: 'confirmado',
  },
  {
    id: 'event-2',
    type: 'reunion',
    title: 'Cancelado',
    clientId: null,
    projectId: null,
    startAt: '2026-08-20T10:00',
    endAt: '2026-08-20T11:00',
    locationText: '',
    personIds: [],
    notes: '',
    status: 'cancelado',
  },
]

describe('CalendarMonthView', () => {
  it('renders a dot for each non-cancelled event on its day', () => {
    render(<CalendarMonthView year={2026} month={7} events={events} conflictEventIds={new Set()} onSelectDay={vi.fn()} />)
    const day15 = screen.getByLabelText('2026-08-15')
    expect(day15.querySelector('span.rounded-full')).not.toBeNull()
  })

  it('shows a conflict dot on days with a conflicting event', () => {
    render(<CalendarMonthView year={2026} month={7} events={events} conflictEventIds={new Set(['event-1'])} onSelectDay={vi.fn()} />)
    const day15 = screen.getByLabelText('2026-08-15')
    expect(day15.querySelectorAll('span.rounded-full').length).toBeGreaterThanOrEqual(2)
  })

  it('calls onSelectDay with the tapped date', async () => {
    const user = userEvent.setup()
    const onSelectDay = vi.fn()
    render(<CalendarMonthView year={2026} month={7} events={events} conflictEventIds={new Set()} onSelectDay={onSelectDay} />)
    await user.click(screen.getByLabelText('2026-08-15'))
    expect(onSelectDay).toHaveBeenCalledWith(new Date(2026, 7, 15))
  })

  it('renders 42 day cells for the month grid', () => {
    render(<CalendarMonthView year={2026} month={7} events={[]} conflictEventIds={new Set()} onSelectDay={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(42)
  })
})
