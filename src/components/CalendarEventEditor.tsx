import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react'
import type { CalendarEvent, CalendarEventContent, Client, EventComment, EventStatus, EventType, Person, Project } from '../types'
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_COLOR_VAR,
  EVENT_TYPE_LABELS,
  findConflicts,
} from '../lib/calendarEvents'
import { formatAttributionDate } from '../lib/format'
import { personInitials } from '../lib/people'
import { GlassPanel } from './GlassPanel'

interface CalendarEventEditorProps {
  event: CalendarEvent | null
  defaultStartAt: string
  defaultEndAt: string
  clients: Client[]
  projects: Project[]
  people: Person[]
  allEvents: CalendarEvent[]
  comments: EventComment[]
  onSave: (content: CalendarEventContent, eventId?: string) => Promise<void>
  onAddComment: (text: string) => Promise<void>
  onClose: () => void
}

export function CalendarEventEditor({
  event,
  defaultStartAt,
  defaultEndAt,
  clients,
  projects,
  people,
  allEvents,
  comments,
  onSave,
  onAddComment,
  onClose,
}: CalendarEventEditorProps) {
  const [type, setType] = useState<EventType>(event?.type ?? 'grabacion')
  const [title, setTitle] = useState(event?.title ?? '')
  const [clientId, setClientId] = useState<string>(event?.clientId ?? '')
  const [projectId, setProjectId] = useState<string>(event?.projectId ?? '')
  const [startAt, setStartAt] = useState(event?.startAt ?? defaultStartAt)
  const [endAt, setEndAt] = useState(event?.endAt ?? defaultEndAt)
  const [locationText, setLocationText] = useState(event?.locationText ?? '')
  const [personIds, setPersonIds] = useState<string[]>(event?.personIds ?? [])
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [status, setStatus] = useState<EventStatus>(event?.status ?? 'confirmado')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  const availableProjects = useMemo(
    () => (clientId ? projects.filter((p) => p.clientId === clientId) : projects),
    [projects, clientId],
  )

  const conflicts = useMemo(
    () => findConflicts(allEvents, { personIds, startAt, endAt, status }, event?.id),
    [allEvents, personIds, startAt, endAt, status, event?.id],
  )

  function togglePerson(id: string) {
    setPersonIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  async function handleSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Escribe un título para el evento')
      return
    }
    if (!startAt || !endAt) {
      setError('Completa la fecha y hora de inicio y fin')
      return
    }
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      setError('La hora de fin debe ser después de la hora de inicio')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(
        {
          type,
          title: trimmedTitle,
          clientId: clientId || null,
          projectId: projectId || null,
          startAt,
          endAt,
          locationText: locationText.trim(),
          personIds,
          notes: notes.trim(),
          status,
        },
        event?.id,
      )
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePostComment() {
    const trimmed = commentText.trim()
    if (!trimmed) return
    setPostingComment(true)
    try {
      await onAddComment(trimmed)
      setCommentText('')
    } finally {
      setPostingComment(false)
    }
  }

  return (
    <GlassPanel ariaLabel={event ? `Editar ${event.title}` : 'Nuevo evento'} widthClassName="w-[92%] max-w-lg">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">{event ? 'Editar evento' : 'Nuevo evento'}</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              style={
                type === t
                  ? { backgroundColor: EVENT_TYPE_COLOR_VAR[t], borderColor: EVENT_TYPE_COLOR_VAR[t], color: '#051F20' }
                  : { borderColor: EVENT_TYPE_COLOR_VAR[t], color: EVENT_TYPE_COLOR_VAR[t] }
              }
            >
              {EVENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="block text-xs text-text-secondary">
          Título
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Adidas — Campaña Running"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-text-secondary">
            Cliente
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                setProjectId('')
              }}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-text-secondary">
            Proyecto
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            >
              <option value="">Sin proyecto</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-text-secondary">
            Inicio
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Fin
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
        </div>

        <label className="block text-xs text-text-secondary">
          Ubicación
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Ej: Barranco / Estudio / Link de Meet"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>

        <div>
          <p className="mb-1.5 text-xs text-text-secondary">Equipo asignado</p>
          <div className="flex flex-wrap gap-1.5">
            {people.length === 0 && <p className="text-xs text-text-tertiary">Todavía no agregas a nadie en Equipo.</p>}
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => togglePerson(person.id)}
                aria-pressed={personIds.includes(person.id)}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                  personIds.includes(person.id)
                    ? 'border-jungle bg-jungle text-white'
                    : 'border-separator text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-jungle-light text-[8px] font-bold text-jungle-deepest">
                  {personInitials(person.name)}
                </span>
                {person.name}
              </button>
            ))}
          </div>
        </div>

        {conflicts.length > 0 && (
          <div
            className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs"
            style={{ backgroundColor: 'rgba(211,128,128,0.10)', borderColor: 'rgba(211,128,128,0.35)' }}
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--color-error)' }} />
            <p className="text-text-secondary">
              <strong className="text-text-primary">Conflicto de horario:</strong> {conflicts.map((c) => c.title).join(', ')} ya tiene
              asignada a la misma persona en un horario que se cruza.
            </p>
          </div>
        )}

        <label className="block text-xs text-text-secondary">
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Detalles adicionales"
            className="mt-1 w-full resize-none rounded-xl border border-separator bg-surface-secondary px-2.5 py-2 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>

        <div>
          <p className="mb-1.5 text-xs text-text-secondary">Estado</p>
          <div className="flex gap-1.5">
            {EVENT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`focus-ring flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                  status === s ? 'bg-gradient-to-br from-jungle to-jungle-dark text-white shadow-md shadow-jungle/30' : 'glass-subtle text-text-secondary'
                }`}
              >
                {EVENT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="focus-ring h-11 w-full rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>

        {event && (
          <div className="border-t border-separator pt-3">
            <p className="mb-2 text-xs font-semibold text-text-tertiary">Comentarios</p>
            <div className="mb-2 space-y-1.5">
              {comments.length === 0 && <p className="text-xs text-text-tertiary">Sin comentarios todavía.</p>}
              {comments.map((c) => (
                <div key={c.id} className="glass-subtle rounded-xl px-3 py-2">
                  <p className="text-xs text-text-primary">{c.text}</p>
                  <p className="mt-1 text-[10px] text-text-tertiary">
                    {c.authorName || c.authorEmail} · {formatAttributionDate(c.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1.5">
              <label className="block flex-1 text-xs text-text-secondary">
                Agregar comentario
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handlePostComment()
                    }
                  }}
                  className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
                />
              </label>
              <button
                type="button"
                aria-label="Comentar"
                disabled={postingComment}
                onClick={handlePostComment}
                className="focus-ring tap-target flex items-center justify-center rounded-xl bg-jungle/15 text-jungle-dark transition hover:bg-jungle/25 disabled:opacity-60"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  )
}
