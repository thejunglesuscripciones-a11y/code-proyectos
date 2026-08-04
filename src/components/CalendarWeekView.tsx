import { useRef, useState } from 'react'
import type { CalendarEvent, Person } from '../types'
import {
  EVENT_TYPE_COLOR_VAR,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_SOFT_VAR,
  GRID_END_HOUR,
  GRID_START_HOUR,
  PX_PER_HOUR,
  buildWeekDays,
  eventHeightPx,
  eventTopPx,
  formatTimeRange,
  toDateKey,
  type WeekDay,
} from '../lib/calendarEvents'
import { personInitials } from '../lib/people'

interface CalendarWeekViewProps {
  weekStart: Date
  events: CalendarEvent[]
  people: Person[]
  conflictEventIds: Set<string>
  onSelectEvent: (event: CalendarEvent) => void
  onCreateAt: (date: Date, hour: number) => void
  onMoveEvent: (event: CalendarEvent, newDay: Date, newHour: number) => void
}

const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i)
const BODY_HEIGHT = HOURS.length * PX_PER_HOUR

export function CalendarWeekView({
  weekStart,
  events,
  people,
  conflictEventIds,
  onSelectEvent,
  onCreateAt,
  onMoveEvent,
}: CalendarWeekViewProps) {
  const days = buildWeekDays(weekStart)
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function eventsForDay(dateKey: string) {
    return events.filter((event) => event.status !== 'cancelado' && toDateKey(new Date(event.startAt)) === dateKey)
  }

  function handleDrop(day: WeekDay, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const event = events.find((ev) => ev.id === draggingId)
    setDraggingId(null)
    if (!event) return
    const rect = columnRefs.current[day.dateKey]?.getBoundingClientRect()
    const offsetY = rect ? e.clientY - rect.top : 0
    const hour = Math.min(GRID_END_HOUR - 1, Math.max(GRID_START_HOUR, GRID_START_HOUR + Math.floor(offsetY / PX_PER_HOUR)))
    onMoveEvent(event, day.date, hour)
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[820px] grid-cols-[44px_repeat(7,1fr)]">
        <div />
        {days.map((day) => (
          <div
            key={day.dateKey}
            className={`rounded-t-xl border-b border-separator px-2 pb-2 pt-1 text-center ${day.isToday ? 'bg-[var(--color-glass-subtle)]' : ''}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">{day.label}</div>
            <div className={`mt-0.5 text-base font-semibold ${day.isToday ? 'text-jungle-light' : 'text-text-primary'}`}>{day.dayNum}</div>
          </div>
        ))}

        <div className="relative" style={{ height: BODY_HEIGHT }}>
          {HOURS.map((hour, i) => (
            <div
              key={hour}
              className="absolute inset-x-0 pr-1.5 text-right text-[10px] font-medium text-text-tertiary"
              style={{ top: i * PX_PER_HOUR - 6 }}
            >
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div
            key={day.dateKey}
            ref={(el) => {
              columnRefs.current[day.dateKey] = el
            }}
            className="relative border-l border-separator"
            style={{ height: BODY_HEIGHT }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(day, e)}
          >
            {HOURS.map((hour, i) => (
              <button
                key={hour}
                type="button"
                aria-label={`Nuevo evento ${day.dateKey} ${hour}:00`}
                onClick={() => onCreateAt(day.date, hour)}
                className="absolute inset-x-0 border-b border-separator transition hover:bg-[var(--color-glass-subtle)]"
                style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}
              />
            ))}

            {eventsForDay(day.dateKey).map((event) => {
              const assigned = event.personIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p))
              const hasConflict = conflictEventIds.has(event.id)
              const isTentative = event.status === 'tentativo'
              return (
                <div
                  key={event.id}
                  draggable
                  onDragStart={() => setDraggingId(event.id)}
                  onClick={() => onSelectEvent(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectEvent(event)
                  }}
                  className={`focus-ring glass-subtle absolute left-1 right-1 cursor-pointer overflow-hidden rounded-2xl border-l-[3px] p-1.5 transition hover:brightness-110 ${isTentative ? 'opacity-75' : ''}`}
                  style={{
                    top: eventTopPx(event.startAt),
                    height: eventHeightPx(event.startAt, event.endAt),
                    borderLeftColor: EVENT_TYPE_COLOR_VAR[event.type],
                    borderLeftStyle: isTentative ? 'dashed' : 'solid',
                    backgroundColor: EVENT_TYPE_SOFT_VAR[event.type],
                  }}
                >
                  {hasConflict && (
                    <span
                      className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: 'var(--color-error)', boxShadow: '0 0 0 3px rgba(211,128,128,0.2)' }}
                      title="Conflicto de horario"
                    />
                  )}
                  <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: EVENT_TYPE_COLOR_VAR[event.type] }}>
                    {EVENT_TYPE_LABELS[event.type]}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-text-primary">{event.title}</p>
                  <p className="mt-0.5 truncate text-[9px] text-text-tertiary">
                    {formatTimeRange(event.startAt, event.endAt)}
                    {event.locationText ? ` · ${event.locationText}` : ''}
                  </p>
                  {assigned.length > 0 && (
                    <div className="mt-1 flex">
                      {assigned.slice(0, 3).map((person, i) => (
                        <span
                          key={person.id}
                          className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--color-glass-strong)] bg-jungle-light text-[6.5px] font-bold text-jungle-deepest"
                          style={{ marginLeft: i === 0 ? 0 : -5 }}
                        >
                          {personInitials(person.name)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
