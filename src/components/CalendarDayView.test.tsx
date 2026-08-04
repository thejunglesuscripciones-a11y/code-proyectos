import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarDayView } from './CalendarDayView'
import type { CalendarEvent, Person } from '../types'

const people: Person[] = [{ id: 'person-1', name: 'Diego Zúñiga', roleLabel: '', isExternal: false, contactInfo: '' }]

const events: CalendarEvent[] = [
  {
    id: 'event-1',
    type: 'grabacion',
    title: 'Adidas — Campaña Running',
    clientId: null,
    projectId: null,
    startAt: '2026-08-04T09:00',
    endAt: '2026-08-04T13:00',
    locationText: 'Barranco',
    personIds: ['person-1'],
    notes: '',
    status: 'confirmado',
  },
  {
    id: 'event-2',
    type: 'reunion',
    title: 'Reunión cancelada',
    clientId: null,
    projectId: null,
    startAt: '2026-08-04T15:00',
    endAt: '2026-08-04T16:00',
    locationText: '',
    personIds: [],
    notes: '',
    status: 'cancelado',
  },
]

describe('CalendarDayView', () => {
  it('lists the events for the given day, sorted by time', () => {
    render(<CalendarDayView date={new Date(2026, 7, 4)} events={events} people={people} conflictEventIds={new Set()} onSelectEvent={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByText('Adidas — Campaña Running')).toBeInTheDocument()
    expect(screen.getByText('09:00–13:00 · Barranco')).toBeInTheDocument()
    expect(screen.getByTitle('Diego Zúñiga')).toBeInTheDocument()
  })

  it('shows cancelled events with a distinct label and strikethrough', () => {
    render(<CalendarDayView date={new Date(2026, 7, 4)} events={events} people={people} conflictEventIds={new Set()} onSelectEvent={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByText(/Cancelado/)).toBeInTheDocument()
    expect(screen.getByText('Reunión cancelada')).toHaveClass('line-through')
  })

  it('shows an empty-state message when there are no events that day', () => {
    render(<CalendarDayView date={new Date(2026, 7, 5)} events={events} people={people} conflictEventIds={new Set()} onSelectEvent={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByText('Sin eventos este día.')).toBeInTheDocument()
  })

  it('calls onSelectEvent when a card is tapped', async () => {
    const user = userEvent.setup()
    const onSelectEvent = vi.fn()
    render(<CalendarDayView date={new Date(2026, 7, 4)} events={events} people={people} conflictEventIds={new Set()} onSelectEvent={onSelectEvent} onCreate={vi.fn()} />)
    await user.click(screen.getByText('Adidas — Campaña Running'))
    expect(onSelectEvent).toHaveBeenCalledWith(events[0])
  })

  it('calls onCreate when "Nuevo" is tapped', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<CalendarDayView date={new Date(2026, 7, 4)} events={events} people={people} conflictEventIds={new Set()} onSelectEvent={vi.fn()} onCreate={onCreate} />)
    await user.click(screen.getByRole('button', { name: /Nuevo/ }))
    expect(onCreate).toHaveBeenCalled()
  })
})
