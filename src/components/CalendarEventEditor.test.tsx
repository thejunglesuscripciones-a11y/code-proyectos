import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarEventEditor } from './CalendarEventEditor'
import type { CalendarEvent, Client, EventComment, Person, Project } from '../types'

const clients: Client[] = [{ id: 'client-1', name: 'Adidas Perú', contactName: '', contactEmail: '', contactPhone: '', notes: '' }]
const projects: Project[] = [
  { id: 'project-1', clientId: 'client-1', name: 'Campaña Running', status: 'en_curso' },
  { id: 'project-2', clientId: 'other-client', name: 'Proyecto de otro cliente', status: 'en_curso' },
]
const people: Person[] = [
  { id: 'person-1', name: 'Diego Zúñiga', roleLabel: '', isExternal: false, contactInfo: '' },
  { id: 'person-2', name: 'Kiara', roleLabel: '', isExternal: false, contactInfo: '' },
]

const existingEvent: CalendarEvent = {
  id: 'event-1',
  type: 'grabacion',
  title: 'Adidas — Campaña Running',
  clientId: 'client-1',
  projectId: 'project-1',
  startAt: '2026-08-04T09:00',
  endAt: '2026-08-04T11:00',
  locationText: 'Barranco',
  personIds: ['person-1'],
  notes: 'Traer equipo extra',
  status: 'confirmado',
}

function renderEditor(overrides: Partial<React.ComponentProps<typeof CalendarEventEditor>> = {}) {
  return render(
    <CalendarEventEditor
      event={null}
      defaultStartAt="2026-08-04T09:00"
      defaultEndAt="2026-08-04T10:00"
      clients={clients}
      projects={projects}
      people={people}
      allEvents={[]}
      comments={[]}
      onSave={vi.fn().mockResolvedValue(undefined)}
      onAddComment={vi.fn().mockResolvedValue(undefined)}
      onClose={vi.fn()}
      {...overrides}
    />,
  )
}

describe('CalendarEventEditor', () => {
  it('starts with sensible defaults for a new event', () => {
    renderEditor()
    expect(screen.getByLabelText(/Título/)).toHaveValue('')
    expect(screen.getByLabelText(/Inicio/)).toHaveValue('2026-08-04T09:00')
    expect(screen.getByRole('button', { name: 'Confirmado' })).toBeInTheDocument()
    expect(screen.queryByText('Comentarios')).not.toBeInTheDocument()
  })

  it('pre-fills every field when editing an existing event', () => {
    renderEditor({ event: existingEvent, defaultStartAt: existingEvent.startAt, defaultEndAt: existingEvent.endAt })
    expect(screen.getByLabelText(/Título/)).toHaveValue('Adidas — Campaña Running')
    expect(screen.getByLabelText(/Ubicación/)).toHaveValue('Barranco')
    expect(screen.getByLabelText(/Notas/)).toHaveValue('Traer equipo extra')
    expect(screen.getByRole('button', { name: /Diego Zúñiga/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters the project list by the chosen client', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.selectOptions(screen.getByLabelText(/Cliente/), 'client-1')
    expect(screen.getByRole('option', { name: 'Campaña Running' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Proyecto de otro cliente' })).not.toBeInTheDocument()
  })

  it('blocks saving and shows an error when the title is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderEditor({ onSave })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Escribe un título para el evento')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving when the end time is not after the start time', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderEditor({ onSave, defaultEndAt: '2026-08-04T08:00' })
    await user.type(screen.getByLabelText(/Título/), 'Evento')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('La hora de fin debe ser después de la hora de inicio')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves a new event with the chosen type, client/project, people and status', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderEditor({ onSave })

    await user.type(screen.getByLabelText(/Título/), 'Nuevo evento')
    await user.click(screen.getByRole('button', { name: 'Reunión' }))
    await user.selectOptions(screen.getByLabelText(/Cliente/), 'client-1')
    await user.selectOptions(screen.getByLabelText(/Proyecto/), 'project-1')
    await user.click(screen.getByRole('button', { name: /Diego Zúñiga/ }))
    await user.click(screen.getByRole('button', { name: 'Tentativo' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith(
      {
        type: 'reunion',
        title: 'Nuevo evento',
        clientId: 'client-1',
        projectId: 'project-1',
        startAt: '2026-08-04T09:00',
        endAt: '2026-08-04T10:00',
        locationText: '',
        personIds: ['person-1'],
        notes: '',
        status: 'tentativo',
      },
      undefined,
    )
  })

  it('saves an edited event with its id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderEditor({ event: existingEvent, defaultStartAt: existingEvent.startAt, defaultEndAt: existingEvent.endAt, onSave })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Adidas — Campaña Running' }), 'event-1')
  })

  it('shows a conflict warning when the assigned person overlaps another event', () => {
    const conflicting: CalendarEvent = { ...existingEvent, id: 'event-2', title: 'Skechers' }
    renderEditor({
      defaultStartAt: '2026-08-04T10:00',
      defaultEndAt: '2026-08-04T12:00',
      allEvents: [conflicting],
      event: { ...existingEvent, id: 'event-3', personIds: ['person-1'] },
    })
    expect(screen.getByText(/Conflicto de horario/)).toBeInTheDocument()
    expect(screen.getByText(/Skechers/)).toBeInTheDocument()
  })

  it('shows an error and keeps the form open when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    renderEditor({ onSave })
    await user.type(screen.getByLabelText(/Título/), 'X')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('lists comments and posts a new one for an existing event', async () => {
    const user = userEvent.setup()
    const onAddComment = vi.fn().mockResolvedValue(undefined)
    const comments: EventComment[] = [
      {
        id: 'comment-1',
        eventId: 'event-1',
        authorName: 'Antonio',
        authorEmail: 'antonio@gorilia.com',
        text: 'Confirmado con el cliente',
        createdAt: '2026-08-04T08:00:00.000Z',
      },
    ]
    renderEditor({ event: existingEvent, defaultStartAt: existingEvent.startAt, defaultEndAt: existingEvent.endAt, comments, onAddComment })

    expect(screen.getByText('Confirmado con el cliente')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Agregar comentario/), 'Todo listo')
    await user.click(screen.getByRole('button', { name: 'Comentar' }))
    expect(onAddComment).toHaveBeenCalledWith('Todo listo')
  })

  it('calls onClose when the back button is tapped', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderEditor({ onClose })
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onClose).toHaveBeenCalled()
  })
})
