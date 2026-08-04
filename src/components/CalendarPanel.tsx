import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarEvent } from '../types'
import { buildMonthGrid, eventsByDate, monthLabel, WEEKDAY_LABELS } from '../lib/calendar'
import { GlassPanel } from './GlassPanel'
import { TabBar, type SectionTab } from './TabBar'

interface CalendarPanelProps {
  events: CalendarEvent[]
  onSelectDay: (date: string) => void
  onTabChange: (tab: SectionTab) => void
}

export function CalendarPanel({ events, onSelectDay, onTabChange }: CalendarPanelProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const grid = buildMonthGrid(year, month)
  const byDate = eventsByDate(events)

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <GlassPanel ariaLabel="Calendario">
      <TabBar active="calendar" onChange={onTabChange} />

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => changeMonth(-1)}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm font-semibold text-text-primary">{monthLabel(year, month)}</h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => changeMonth(1)}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-text-tertiary">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            const dayEvents = byDate[cell.date] ?? []
            const hasBlocked = dayEvents.some((event) => event.blocked)
            const hasEvents = dayEvents.some((event) => !event.blocked)
            return (
              <button
                key={cell.date}
                type="button"
                aria-label={cell.date}
                onClick={() => onSelectDay(cell.date)}
                style={hasBlocked ? { backgroundColor: 'color-mix(in srgb, var(--color-error) 14%, transparent)' } : undefined}
                className={`focus-ring glass-subtle flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition hover:brightness-110 ${
                  cell.inMonth ? 'text-text-primary' : 'text-text-tertiary/50'
                } ${cell.isToday ? 'ring-2 ring-jungle' : ''}`}
              >
                <span className="font-semibold">{cell.day}</span>
                {hasEvents && <span className="h-1 w-1 rounded-full bg-jungle" />}
              </button>
            )
          })}
        </div>
      </div>
    </GlassPanel>
  )
}
