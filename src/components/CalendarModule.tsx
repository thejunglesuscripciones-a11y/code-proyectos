import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react'
import type {
  Attribution,
  CalendarEvent,
  CalendarEventContent,
  Client,
  ClientContent,
  EventComment,
  Person,
  PersonContent,
  Project,
  ProjectContent,
} from '../types'
import {
  findAllConflicts,
  formatWeekRangeLabel,
  monthLabel,
  startOfWeek,
  toLocalDateTimeValue,
} from '../lib/calendarEvents'
import { createCommentDraft } from '../lib/comments'
import { personInitials } from '../lib/people'
import { subscribeEventComments, saveCommentRemote } from '../lib/sync'
import { BorderBeam } from './BorderBeam'
import { CalendarWeekView } from './CalendarWeekView'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarDayView } from './CalendarDayView'
import { CalendarEventEditor } from './CalendarEventEditor'
import { CalendarManagePanel } from './CalendarManagePanel'
import { ClientsPanel } from './ClientsPanel'
import { ClientEditor } from './ClientEditor'
import { ProjectsPanel } from './ProjectsPanel'
import { ProjectEditor } from './ProjectEditor'
import { TeamPanel } from './TeamPanel'
import { TeamEditor } from './TeamEditor'

type CalView = 'dia' | 'semana' | 'mes'
type Overlay =
  | { kind: 'none' }
  | { kind: 'event'; event: CalendarEvent | null; defaultStartAt: string; defaultEndAt: string }
  | { kind: 'manage' }
  | { kind: 'clients' }
  | { kind: 'client-editor'; client: Client | null }
  | { kind: 'projects' }
  | { kind: 'project-editor'; project: Project | null }
  | { kind: 'team' }
  | { kind: 'team-editor'; person: Person | null }

interface CalendarModuleProps {
  events: CalendarEvent[]
  clients: Client[]
  projects: Project[]
  people: Person[]
  currentAuthor: () => Attribution
  onSaveEvent: (content: CalendarEventContent, eventId?: string) => Promise<void>
  onSaveClient: (content: ClientContent, clientId?: string) => Promise<void>
  onDeleteClient: (clientId: string) => void
  onSaveProject: (content: ProjectContent, projectId?: string) => Promise<void>
  onDeleteProject: (projectId: string) => void
  onSavePerson: (content: PersonContent, personId?: string) => Promise<void>
  onDeletePerson: (personId: string) => void
  onClose: () => void
}

export function CalendarModule({
  events,
  clients,
  projects,
  people,
  currentAuthor,
  onSaveEvent,
  onSaveClient,
  onDeleteClient,
  onSaveProject,
  onDeleteProject,
  onSavePerson,
  onDeletePerson,
  onClose,
}: CalendarModuleProps) {
  const today = useMemo(() => new Date(), [])
  const [calView, setCalView] = useState<CalView>('semana')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [selectedDate, setSelectedDate] = useState(today)
  const [monthCursor, setMonthCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' })
  const [eventComments, setEventComments] = useState<EventComment[]>([])

  const conflictPairs = useMemo(() => findAllConflicts(events), [events])
  const conflictEventIds = useMemo(() => {
    const ids = new Set<string>()
    conflictPairs.forEach((pair) => {
      ids.add(pair.a.id)
      ids.add(pair.b.id)
    })
    return ids
  }, [conflictPairs])

  const openEventId = overlay.kind === 'event' ? overlay.event?.id : undefined
  useEffect(() => {
    if (!openEventId) {
      setEventComments([])
      return
    }
    return subscribeEventComments(openEventId, setEventComments)
  }, [openEventId])

  function shiftWeek(delta: number) {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + delta * 7)
      return next
    })
  }

  function shiftMonth(delta: number) {
    setMonthCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  function shiftDay(delta: number) {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta))
  }

  function openNewEvent(date: Date, hour: number) {
    setOverlay({
      kind: 'event',
      event: null,
      defaultStartAt: toLocalDateTimeValue(date, hour),
      defaultEndAt: toLocalDateTimeValue(date, hour + 1),
    })
  }

  function openExistingEvent(event: CalendarEvent) {
    setOverlay({ kind: 'event', event, defaultStartAt: event.startAt, defaultEndAt: event.endAt })
  }

  async function handleMoveEvent(event: CalendarEvent, newDay: Date, newHour: number) {
    const durationMs = new Date(event.endAt).getTime() - new Date(event.startAt).getTime()
    const newStartAt = toLocalDateTimeValue(newDay, newHour)
    const newEnd = new Date(new Date(newStartAt).getTime() + durationMs)
    const newEndAt = toLocalDateTimeValue(newEnd, newEnd.getHours(), newEnd.getMinutes())
    await onSaveEvent({ ...event, startAt: newStartAt, endAt: newEndAt }, event.id)
  }

  async function handleAddComment(text: string) {
    if (overlay.kind !== 'event' || !overlay.event) return
    const author = currentAuthor()
    await saveCommentRemote(createCommentDraft(overlay.event.id, text, author))
  }

  const avatarPeople = people.slice(0, 3)

  return (
    <div
      role="dialog"
      aria-label="Calendario"
      className="animate-backdrop-in fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-md"
    >
      <div className="glass-strong animate-panel-in relative flex max-h-[85vh] w-[94%] max-w-3xl flex-col overflow-hidden rounded-panel shadow-[var(--shadow-4)]">
        <div className="relative overflow-hidden border-b border-separator px-4 py-3">
          <BorderBeam radiusClassName="rounded-t-panel" />
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-jungle-dark to-jungle-deepest text-[11px] font-bold text-jungle-pale shadow-inner">
                TJF
              </span>
              <span>
                <span className="block text-sm font-bold text-text-primary">Calendario</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-jungle-light">The Jungle Films</span>
              </span>
            </div>

            <button
              type="button"
              aria-label="Cerrar calendario"
              onClick={onClose}
              className="focus-ring tap-target flex shrink-0 items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="glass-subtle flex gap-0.5 rounded-full p-1">
              {(['dia', 'semana', 'mes'] as CalView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={calView === v}
                  onClick={() => setCalView(v)}
                  className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    calView === v ? 'bg-gradient-to-br from-jungle to-jungle-dark text-white shadow-md shadow-jungle/30' : 'text-text-secondary'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex" aria-label="Equipo">
                {avatarPeople.map((person, i) => (
                  <span
                    key={person.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--color-glass-strong)] bg-jungle-light text-[9px] font-bold text-jungle-deepest"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                    title={person.name}
                  >
                    {personInitials(person.name)}
                  </span>
                ))}
              </div>
              <button
                type="button"
                aria-label="Gestionar"
                onClick={() => setOverlay({ kind: 'manage' })}
                className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
              >
                <SlidersHorizontal size={18} />
              </button>
              <button
                type="button"
                onClick={() => openNewEvent(calView === 'mes' ? selectedDate : calView === 'dia' ? selectedDate : today, 9)}
                className="focus-ring flex h-9 items-center gap-1 rounded-full bg-jungle-pale px-3 text-xs font-semibold text-jungle-deepest transition hover:brightness-105"
              >
                <Plus size={14} /> Nuevo evento
              </button>
            </div>
          </div>
        </div>

        <div
          className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-separator px-4 py-2 text-[11px] font-medium text-text-tertiary"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 28px), transparent)',
            maskImage: 'linear-gradient(to right, black calc(100% - 28px), transparent)',
          }}
        >
          <span className="glass-subtle flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--event-grabacion)' }} /> Grabación
          </span>
          <span className="glass-subtle flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--event-reunion)' }} /> Reunión
          </span>
          <span className="glass-subtle flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--event-entrega)' }} /> Entrega
          </span>
          <span className="glass-subtle flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--event-bloqueo)' }} /> Bloqueo
          </span>
          <span className="glass-subtle flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-error)' }} /> Conflicto
          </span>
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          {calView === 'semana' && (
            <>
              <button type="button" aria-label="Semana anterior" onClick={() => shiftWeek(-1)} className="focus-ring tap-target rounded-full text-text-secondary hover:text-text-primary">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-medium text-text-secondary">{formatWeekRangeLabel(weekStart)}</span>
              <button type="button" aria-label="Semana siguiente" onClick={() => shiftWeek(1)} className="focus-ring tap-target rounded-full text-text-secondary hover:text-text-primary">
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {calView === 'mes' && (
            <>
              <button type="button" aria-label="Mes anterior" onClick={() => shiftMonth(-1)} className="focus-ring tap-target rounded-full text-text-secondary hover:text-text-primary">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-medium text-text-secondary">{monthLabel(monthCursor.year, monthCursor.month)}</span>
              <button type="button" aria-label="Mes siguiente" onClick={() => shiftMonth(1)} className="focus-ring tap-target rounded-full text-text-secondary hover:text-text-primary">
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {calView === 'dia' && (
            <>
              <button type="button" aria-label="Día anterior" onClick={() => shiftDay(-1)} className="focus-ring tap-target rounded-full text-text-secondary hover:text-text-primary">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-medium text-text-secondary">{formatWeekRangeLabel(startOfWeek(selectedDate))}</span>
              <button type="button" aria-label="Día siguiente" onClick={() => shiftDay(1)} className="focus-ring tap-target rounded-full text-text-secondary hover:text-text-primary">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {calView === 'semana' && (
            <CalendarWeekView
              weekStart={weekStart}
              events={events}
              people={people}
              conflictEventIds={conflictEventIds}
              onSelectEvent={openExistingEvent}
              onCreateAt={openNewEvent}
              onMoveEvent={handleMoveEvent}
            />
          )}
          {calView === 'mes' && (
            <CalendarMonthView
              year={monthCursor.year}
              month={monthCursor.month}
              events={events}
              conflictEventIds={conflictEventIds}
              onSelectDay={(date) => {
                setSelectedDate(date)
                setCalView('dia')
              }}
            />
          )}
          {calView === 'dia' && (
            <CalendarDayView
              date={selectedDate}
              events={events}
              people={people}
              conflictEventIds={conflictEventIds}
              onSelectEvent={openExistingEvent}
              onCreate={() => openNewEvent(selectedDate, 9)}
            />
          )}
        </div>

        {conflictPairs.length > 0 && (
          <div
            className="mx-4 mb-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs"
            style={{ backgroundColor: 'rgba(211,128,128,0.10)', borderColor: 'rgba(211,128,128,0.35)' }}
          >
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-error)' }} />
            <p className="text-text-secondary">
              {conflictPairs.slice(0, 2).map((pair, i) => {
                const names = pair.personIds.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean).join(', ')
                return (
                  <span key={i} className="mb-0.5 block">
                    <strong className="text-text-primary">{names}</strong> está asignado a dos eventos que se cruzan:{' '}
                    <strong className="text-text-primary">{pair.a.title}</strong> y <strong className="text-text-primary">{pair.b.title}</strong>.
                  </span>
                )
              })}
            </p>
          </div>
        )}
      </div>

      {overlay.kind === 'event' && (
        <CalendarEventEditor
          event={overlay.event}
          defaultStartAt={overlay.defaultStartAt}
          defaultEndAt={overlay.defaultEndAt}
          clients={clients}
          projects={projects}
          people={people}
          allEvents={events}
          comments={eventComments}
          onSave={async (content, eventId) => {
            await onSaveEvent(content, eventId)
            setOverlay({ kind: 'none' })
          }}
          onAddComment={handleAddComment}
          onClose={() => setOverlay({ kind: 'none' })}
        />
      )}

      {overlay.kind === 'manage' && (
        <CalendarManagePanel
          onOpenClients={() => setOverlay({ kind: 'clients' })}
          onOpenProjects={() => setOverlay({ kind: 'projects' })}
          onOpenTeam={() => setOverlay({ kind: 'team' })}
          onClose={() => setOverlay({ kind: 'none' })}
        />
      )}

      {overlay.kind === 'clients' && (
        <ClientsPanel
          clients={clients}
          onSelect={(client) => setOverlay({ kind: 'client-editor', client })}
          onCreate={() => setOverlay({ kind: 'client-editor', client: null })}
          onBack={() => setOverlay({ kind: 'manage' })}
        />
      )}
      {overlay.kind === 'client-editor' && (
        <ClientEditor
          client={overlay.client}
          onSave={async (content) => {
            await onSaveClient(content, overlay.client?.id)
            setOverlay({ kind: 'clients' })
          }}
          onDelete={() => {
            if (overlay.client) onDeleteClient(overlay.client.id)
            setOverlay({ kind: 'clients' })
          }}
          onClose={() => setOverlay({ kind: 'clients' })}
        />
      )}

      {overlay.kind === 'projects' && (
        <ProjectsPanel
          projects={projects}
          clients={clients}
          onSelect={(project) => setOverlay({ kind: 'project-editor', project })}
          onCreate={() => setOverlay({ kind: 'project-editor', project: null })}
          onBack={() => setOverlay({ kind: 'manage' })}
        />
      )}
      {overlay.kind === 'project-editor' && (
        <ProjectEditor
          project={overlay.project}
          clients={clients}
          onSave={async (content) => {
            await onSaveProject(content, overlay.project?.id)
            setOverlay({ kind: 'projects' })
          }}
          onDelete={() => {
            if (overlay.project) onDeleteProject(overlay.project.id)
            setOverlay({ kind: 'projects' })
          }}
          onClose={() => setOverlay({ kind: 'projects' })}
        />
      )}

      {overlay.kind === 'team' && (
        <TeamPanel
          people={people}
          onSelect={(person) => setOverlay({ kind: 'team-editor', person })}
          onCreate={() => setOverlay({ kind: 'team-editor', person: null })}
          onBack={() => setOverlay({ kind: 'manage' })}
        />
      )}
      {overlay.kind === 'team-editor' && (
        <TeamEditor
          person={overlay.person}
          onSave={async (content) => {
            await onSavePerson(content, overlay.person?.id)
            setOverlay({ kind: 'team' })
          }}
          onDelete={() => {
            if (overlay.person) onDeletePerson(overlay.person.id)
            setOverlay({ kind: 'team' })
          }}
          onClose={() => setOverlay({ kind: 'team' })}
        />
      )}
    </div>
  )
}
