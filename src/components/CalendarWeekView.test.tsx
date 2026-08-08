import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarWeekView } from './CalendarWeekView'
import { GRID_START_HOUR, PX_PER_HOUR } from '../lib/calendarEvents'
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
    endAt: '2026-08-04T11:00',
    locationText: 'Barranco',
    personIds: ['person-1'],
    notes: '',
    status: 'confirmado',
  },
  {
    id: 'event-2',
    type: 'reunion',
    title: 'Brief tentativo',
    clientId: null,
    projectId: null,
    startAt: '2026-08-05T10:00',
    endAt: '2026-08-05T11:00',
    locationText: '',
    personIds: [],
    notes: '',
    status: 'tentativo',
  },
]

function renderWeek(overrides: Partial<React.ComponentProps<typeof CalendarWeekView>> = {}) {
  return render(
    <CalendarWeekView
      weekStart={new Date(2026, 7, 3)}
      events={events}
      people={people}
      conflictEventIds={new Set()}
      onSelectEvent={vi.fn()}
      onCreateAt={vi.fn()}
      onMoveEvent={vi.fn()}
      {...overrides}
    />,
  )
}

describe('CalendarWeekView', () => {
  it('renders the 7 day headers starting Monday', () => {
    renderWeek()
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('09')).toBeInTheDocument()
    expect(screen.getAllByText('Lun')).toHaveLength(1)
  })

  it('renders an event block with its title, time range and location', () => {
    renderWeek()
    expect(screen.getByText('Adidas — Campaña Running')).toBeInTheDocument()
    expect(screen.getByText('09:00–11:00 · Barranco')).toBeInTheDocument()
  })

  it('shows a conflict indicator when the event id is in conflictEventIds', () => {
    renderWeek({ conflictEventIds: new Set(['event-1']) })
    expect(screen.getByTitle('Conflicto de horario')).toBeInTheDocument()
  })

  it('calls onSelectEvent when an event block is clicked', async () => {
    const user = userEvent.setup()
    const onSelectEvent = vi.fn()
    renderWeek({ onSelectEvent })
    await user.click(screen.getByText('Adidas — Campaña Running'))
    expect(onSelectEvent).toHaveBeenCalledWith(events[0])
  })

  it('calls onSelectEvent on Enter key', () => {
    const onSelectEvent = vi.fn()
    renderWeek({ onSelectEvent })
    fireEvent.keyDown(screen.getByText('Adidas — Campaña Running').closest('[role="button"]')!, { key: 'Enter' })
    expect(onSelectEvent).toHaveBeenCalledWith(events[0])
  })

  it('calls onCreateAt when an empty hour slot is clicked', async () => {
    const user = userEvent.setup()
    const onCreateAt = vi.fn()
    renderWeek({ onCreateAt })
    await user.click(screen.getByLabelText('Nuevo evento 2026-08-03 9:00'))
    expect(onCreateAt).toHaveBeenCalledWith(new Date(2026, 7, 3), 9)
  })

  it('moves an event on drag and drop into a new day/hour', () => {
    const onMoveEvent = vi.fn()
    renderWeek({ onMoveEvent })

    const eventBlock = screen.getByText('Adidas — Campaña Running').closest('[role="button"]')!
    fireEvent.dragStart(eventBlock)

    const targetColumn = screen.getByLabelText('Nuevo evento 2026-08-05 10:00').parentElement!
    vi.spyOn(targetColumn, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {},
    } as DOMRect)
    // jsdom's DragEvent doesn't implement MouseEvent's clientY from the init dict,
    // so build a plain event and attach it manually instead of fireEvent.drop(el, { clientY }).
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'clientY', { value: (10 - GRID_START_HOUR) * PX_PER_HOUR })
    fireEvent(targetColumn, dropEvent)

    expect(onMoveEvent).toHaveBeenCalledWith(events[0], new Date(2026, 7, 5), 10)
  })
})
