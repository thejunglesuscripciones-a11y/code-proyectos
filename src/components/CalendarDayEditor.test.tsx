import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarDayEditor } from './CalendarDayEditor'
import { formatDayLabel } from '../lib/calendar'
import type { CalendarEvent } from '../types'

const dayEvents: CalendarEvent[] = [
  { id: 'event-1', date: '2026-08-10', time: '15:00', title: 'Grabación', note: 'Traer batería extra', blocked: false },
  { id: 'event-2', date: '2026-08-10', time: '', title: 'Antonio no disponible', note: '', blocked: true },
]

function renderEditor(overrides: Partial<React.ComponentProps<typeof CalendarDayEditor>> = {}) {
  return render(
    <CalendarDayEditor
      date="2026-08-10"
      events={dayEvents}
      onSave={vi.fn().mockResolvedValue(undefined)}
      onDelete={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  )
}

describe('CalendarDayEditor', () => {
  it('shows the formatted day as the header', () => {
    renderEditor()
    expect(screen.getByText(formatDayLabel('2026-08-10'))).toBeInTheDocument()
  })

  it('lists the day’s events with time/note, and shows blocked ones', () => {
    renderEditor()
    expect(screen.getByText('Grabación')).toBeInTheDocument()
    expect(screen.getByText('15:00 · Traer batería extra')).toBeInTheDocument()
    expect(screen.getByText('Antonio no disponible')).toBeInTheDocument()
  })

  it('blocks saving and shows an error when the title is blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderEditor({ onSave })

    await user.click(screen.getByRole('button', { name: 'Agregar evento' }))

    expect(screen.getByText('Escribe un título para el evento')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves a new event with trimmed values and no id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderEditor({ onSave })

    await user.type(screen.getByLabelText(/Título/), '  Reunión con cliente  ')
    await user.type(screen.getByLabelText(/Nota/), 'Llevar contrato')
    await user.click(screen.getByRole('button', { name: 'Agregar evento' }))

    expect(onSave).toHaveBeenCalledWith(
      { date: '2026-08-10', time: '', title: 'Reunión con cliente', note: 'Llevar contrato', blocked: false },
      undefined,
    )
  })

  it('marks an event as blocked when the checkbox is checked', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderEditor({ onSave })

    await user.type(screen.getByLabelText(/Título/), 'No disponible')
    await user.click(screen.getByLabelText(/Marcar el día como no disponible/))
    await user.click(screen.getByRole('button', { name: 'Agregar evento' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ blocked: true }), undefined)
  })

  it('pre-fills the form when editing an existing event, and saves with its id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderEditor({ onSave })

    await user.click(screen.getByRole('button', { name: 'Editar Grabación' }))
    expect(screen.getByLabelText(/Título/)).toHaveValue('Grabación')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(onSave).toHaveBeenCalledWith(
      { date: '2026-08-10', time: '15:00', title: 'Grabación', note: 'Traer batería extra', blocked: false },
      'event-1',
    )
  })

  it('cancels editing and returns to the "new event" form', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('button', { name: 'Editar Grabación' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByText('Nuevo evento')).toBeInTheDocument()
    expect(screen.getByLabelText(/Título/)).toHaveValue('')
  })

  it('calls onDelete with the event id', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderEditor({ onDelete })

    await user.click(screen.getByRole('button', { name: 'Eliminar Grabación' }))

    expect(onDelete).toHaveBeenCalledWith('event-1')
  })

  it('calls onClose when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderEditor({ onClose })

    await user.click(screen.getByRole('button', { name: 'Volver' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('shows an error and keeps the form when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    renderEditor({ onSave })

    await user.type(screen.getByLabelText(/Título/), 'Reunión')
    await user.click(screen.getByRole('button', { name: 'Agregar evento' }))

    expect(await screen.findByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Título/)).toHaveValue('Reunión')
  })
})
