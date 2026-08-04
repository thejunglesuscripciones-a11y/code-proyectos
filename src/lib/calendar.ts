import type { CalendarEvent, CalendarEventContent } from '../types'

function generateCalendarEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `event-${crypto.randomUUID()}`
  }
  return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createCalendarEventDraft(content: CalendarEventContent): CalendarEvent {
  return { id: generateCalendarEventId(), ...content }
}

/** Groups events by their `date` key, each day's list sorted by time (all-day/blocked entries first). */
export function eventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {}
  for (const event of events) {
    ;(map[event.date] ??= []).push(event)
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => a.time.localeCompare(b.time))
  }
  return map
}

export const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function monthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** "lunes, 10 de agosto", capitalized — for the day-editor header. */
export function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const formatted = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export interface MonthDay {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
}

/** Builds a 42-cell (6-week) grid for the given month, starting on Sunday, including the leading/trailing days from neighboring months. */
export function buildMonthGrid(year: number, month: number, today: Date = new Date()): MonthDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startOffset)
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const key = toDateKey(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
    return {
      date: key,
      day: cellDate.getDate(),
      inMonth: cellDate.getMonth() === month,
      isToday: key === todayKey,
    }
  })
}
