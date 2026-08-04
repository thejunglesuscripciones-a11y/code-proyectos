import type { CalendarEvent } from '../types'
import { EVENT_TYPE_COLOR_VAR, buildMonthGrid, toDateKey } from '../lib/calendarEvents'

interface CalendarMonthViewProps {
  year: number
  month: number
  events: CalendarEvent[]
  conflictEventIds: Set<string>
  onSelectDay: (date: Date) => void
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function CalendarMonthView({ year, month, events, conflictEventIds, onSelectDay }: CalendarMonthViewProps) {
  const grid = buildMonthGrid(year, month)
  const byDate = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    if (event.status === 'cancelado') continue
    const key = toDateKey(new Date(event.startAt))
    const list = byDate.get(key)
    if (list) list.push(event)
    else byDate.set(key, [event])
  }

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-text-tertiary">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell) => {
          const dayEvents = byDate.get(cell.date) ?? []
          const hasConflict = dayEvents.some((event) => conflictEventIds.has(event.id))
          const [year, month, day] = cell.date.split('-').map(Number)
          return (
            <button
              key={cell.date}
              type="button"
              aria-label={cell.date}
              onClick={() => onSelectDay(new Date(year, month - 1, day))}
              className={`focus-ring glass-subtle flex min-h-[64px] flex-col items-start gap-1.5 rounded-xl p-1.5 text-left transition hover:brightness-110 ${
                cell.inMonth ? 'text-text-primary' : 'text-text-tertiary/50'
              } ${cell.isToday ? 'ring-2 ring-jungle' : ''}`}
            >
              <span className="text-xs font-semibold">{cell.day}</span>
              <div className="flex flex-wrap gap-0.5">
                {dayEvents.slice(0, 4).map((event) => (
                  <span key={event.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLOR_VAR[event.type] }} />
                ))}
                {hasConflict && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-error)' }} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
