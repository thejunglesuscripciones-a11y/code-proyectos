import { useState } from 'react'
import { Ban, ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CalendarEvent, CalendarEventContent } from '../types'
import { formatDayLabel } from '../lib/calendar'
import { GlassPanel } from './GlassPanel'

interface CalendarDayEditorProps {
  date: string
  events: CalendarEvent[]
  onSave: (content: CalendarEventContent, eventId?: string) => Promise<void>
  onDelete: (eventId: string) => void
  onClose: () => void
}

export function CalendarDayEditor({ date, events, onSave, onDelete, onClose }: CalendarDayEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setTime('')
    setNote('')
    setBlocked(false)
    setError(null)
  }

  function startEdit(event: CalendarEvent) {
    setEditingId(event.id)
    setTitle(event.title)
    setTime(event.time)
    setNote(event.note)
    setBlocked(event.blocked)
    setError(null)
  }

  async function handleSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Escribe un título para el evento')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ date, time, title: trimmedTitle, note: note.trim(), blocked }, editingId ?? undefined)
      resetForm()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassPanel ariaLabel={`Eventos del ${formatDayLabel(date)}`} widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">{formatDayLabel(date)}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {events.map((event) => (
              <div key={event.id} className="glass-subtle flex items-center gap-2 rounded-xl px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">
                    {event.blocked && <Ban size={12} className="shrink-0 text-[var(--color-error)]" />}
                    <span className="truncate">{event.title}</span>
                  </p>
                  {(event.time || event.note) && (
                    <p className="truncate text-xs text-text-secondary">
                      {[event.time, event.note].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Editar ${event.title}`}
                  onClick={() => startEdit(event)}
                  className="focus-ring tap-target flex items-center justify-center rounded-xl text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${event.title}`}
                  onClick={() => onDelete(event.id)}
                  className="focus-ring tap-target flex items-center justify-center rounded-xl text-[var(--color-error)] transition hover:bg-[var(--color-error)]/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2.5 border-t border-separator pt-3">
          <p className="text-xs font-semibold text-text-tertiary">{editingId ? 'Editar evento' : 'Nuevo evento'}</p>
          <label className="block text-xs text-text-secondary">
            Título
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Grabación con cliente"
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Hora (opcional)
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Nota (opcional)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Traer el equipo de audio"
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={blocked}
              onChange={(e) => setBlocked(e.target.checked)}
              className="h-4 w-4 rounded border-separator"
            />
            Marcar el día como no disponible
          </label>
          {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="focus-ring glass-subtle flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-text-primary transition hover:brightness-110"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="focus-ring flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              <Plus size={16} /> {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar evento'}
            </button>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
