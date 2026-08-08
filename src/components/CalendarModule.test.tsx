import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarModule } from './CalendarModule'
import { GRID_START_HOUR, PX_PER_HOUR } from '../lib/calendarEvents'
import type { CalendarEvent, Client, Person, Project } from '../types'

vi.mock('../lib/sync', () => ({
  subscribeEventComments: vi.fn((_eventId: string, cb: (c: unknown[]) => void) => {
    cb([])
    return () => {}
  }),
  saveCommentRemote: vi.fn().mockResolvedValue(undefined),
}))

const author = { name: 'Antonio', email: 'antonio@gorilia.com', updatedAt: '2026-01-01T00:00:00.000Z' }

const people: Person[] = [{ id: 'person-1', name: 'Diego Zúñiga', roleLabel: '', isExternal: false, contactInfo: '' }]
const clients: Client[] = []
const projects: Project[] = []

const events: CalendarEvent[] = [
  {
    id: 'event-1',
    type: 'grabacion',
    title: 'Adidas — Campaña Running',
    clientId: null,
    projectId: null,
    startAt: '2026-08-04T09:00',
    endAt: '2026-08-04T11:00',
    locationText: '',
    personIds: ['person-1'],
    notes: '',
    status: 'confirmado',
  },
]

function renderModule(overrides: Partial<React.ComponentProps<typeof CalendarModule>> = {}) {
  return render(
    <CalendarModule
      events={events}
      clients={clients}
      projects={projects}
      people={people}
      currentAuthor={() => author}
      onSaveEvent={vi.fn().mockResolvedValue(undefined)}
      onSaveClient={vi.fn().mockResolvedValue(undefined)}
      onDeleteClient={vi.fn()}
      onSaveProject={vi.fn().mockResolvedValue(undefined)}
      onDeleteProject={vi.fn()}
      onSavePerson={vi.fn().mockResolvedValue(undefined)}
      onDeletePerson={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 7, 4, 8, 0))
})

describe('CalendarModule', () => {
  it('shows the week view by default with the current week range', () => {
    renderModule()
    expect(screen.getByText('03 — 09 ago 2026')).toBeInTheDocument()
    expect(screen.getByText('Adidas — Campaña Running')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('switches to Mes and Día views', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModule()

    await user.click(screen.getByRole('tab', { name: 'mes' }))
    expect(screen.getByText('Agosto 2026')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'dia' }))
    expect(screen.getByRole('button', { name: /Nuevo$/ })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('navigating from month view to a day switches to Día for that date', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderModule()

    await user.click(screen.getByRole('tab', { name: 'mes' }))
    await user.click(screen.getByLabelText('2026-08-04'))

    expect(screen.getByText('Adidas — Campaña Running')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'dia' })).toHaveAttribute('aria-selected', 'true')
    vi.useRealTimers()
  })

  it('shows the conflict banner when two events overlap for the same person', () => {
    const overlapping: CalendarEvent = { ...events[0], id: 'event-2', title: 'Skechers', startAt: '2026-08-04T10:00', endAt: '2026-08-04T12:00' }
    renderModule({ events: [events[0], overlapping] })
    expect(screen.getByText(/está asignado a dos eventos que se cruzan/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('opens Gestionar and navigates to Clientes, creates a client, and returns to the list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onSaveClient = vi.fn().mockResolvedValue(undefined)
    renderModule({ onSaveClient })

    await user.click(screen.getByRole('button', { name: 'Gestionar' }))
    await user.click(screen.getByRole('button', { name: 'Clientes' }))
    await user.click(screen.getByRole('button', { name: /Nuevo cliente/ }))
    await user.type(screen.getByLabelText(/Nombre/), 'Adidas Perú')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSaveClient).toHaveBeenCalledWith(expect.objectContaining({ name: 'Adidas Perú' }), undefined)
    expect(await screen.findByRole('dialog', { name: 'Clientes' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('moves an event via drag-and-drop in the week view, calling onSaveEvent with the new time', () => {
    const onSaveEvent = vi.fn().mockResolvedValue(undefined)
    renderModule({ onSaveEvent })

    const eventBlock = screen.getByText('Adidas — Campaña Running').closest('[role="button"]')!
    fireEvent.dragStart(eventBlock)

    const targetColumn = screen.getByLabelText('Nuevo evento 2026-08-05 10:00').parentElement!
    vi.spyOn(targetColumn, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {},
    } as DOMRect)
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'clientY', { value: (10 - GRID_START_HOUR) * PX_PER_HOUR })
    fireEvent(targetColumn, dropEvent)

    expect(onSaveEvent).toHaveBeenCalledWith(
      expect.objectContaining({ startAt: '2026-08-05T10:00', endAt: '2026-08-05T12:00' }),
      'event-1',
    )
    vi.useRealTimers()
  })

  it('calls onClose when "Cerrar calendario" is tapped', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onClose = vi.fn()
    renderModule({ onClose })
    await user.click(screen.getByRole('button', { name: 'Cerrar calendario' }))
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
