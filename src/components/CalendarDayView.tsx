import { Plus } from 'lucide-react'
import type { CalendarEvent, Person } from '../types'
import { EVENT_TYPE_COLOR_VAR, EVENT_TYPE_LABELS, formatDayLabel, formatTimeRange, toDateKey } from '../lib/calendarEvents'
import { personInitials } from '../lib/people'

interface CalendarDayViewProps {
  date: Date
  events: CalendarEvent[]
  people: Person[]
  conflictEventIds: Set<string>
  onSelectEvent: (event: CalendarEvent) => void
  onCreate: () => void
}

export function CalendarDayView({ date, events, people, conflictEventIds, onSelectEvent, onCreate }: CalendarDayViewProps) {
  const dateKey = toDateKey(date)
  const dayEvents = events
    .filter((event) => toDateKey(new Date(event.startAt)) === dateKey)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{formatDayLabel(date)}</h3>
        <button
          type="button"
          onClick={onCreate}
          className="focus-ring flex items-center gap-1 rounded-full bg-jungle-pale px-3 py-1.5 text-xs font-semibold text-jungle-deepest transition hover:brightness-105"
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {dayEvents.length === 0 && <p className="py-6 text-center text-sm text-text-secondary">Sin eventos este día.</p>}

      <div className="space-y-2">
        {dayEvents.map((event) => {
          const assigned = event.personIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p))
          const cancelled = event.status === 'cancelado'
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent(event)}
              className={`focus-ring glass-subtle flex w-full items-start gap-3 rounded-2xl border-l-[3px] p-3 text-left transition hover:brightness-110 ${cancelled ? 'opacity-60' : ''}`}
              style={{ borderLeftColor: cancelled ? 'var(--color-text-tertiary)' : EVENT_TYPE_COLOR_VAR[event.type] }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: cancelled ? 'var(--color-text-tertiary)' : EVENT_TYPE_COLOR_VAR[event.type] }}
                >
                  {EVENT_TYPE_LABELS[event.type]} {cancelled && '· Cancelado'}
                  {conflictEventIds.has(event.id) && !cancelled && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: 'var(--color-error)' }} />
                  )}
                </p>
                <p className={`mt-0.5 text-sm font-bold text-text-primary ${cancelled ? 'line-through' : ''}`}>{event.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {formatTimeRange(event.startAt, event.endAt)}
                  {event.locationText ? ` · ${event.locationText}` : ''}
                </p>
                {assigned.length > 0 && (
                  <div className="mt-1.5 flex">
                    {assigned.map((person, i) => (
                      <span
                        key={person.id}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-glass-strong)] bg-jungle-light text-[8.5px] font-bold text-jungle-deepest"
                        style={{ marginLeft: i === 0 ? 0 : -6 }}
                        title={person.name}
                      >
                        {personInitials(person.name)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
