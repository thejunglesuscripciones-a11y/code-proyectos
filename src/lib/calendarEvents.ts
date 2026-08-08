import type { CalendarEvent, CalendarEventContent, EventStatus, EventType } from '../types'

function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `event-${crypto.randomUUID()}`
  }
  return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createCalendarEventDraft(content: CalendarEventContent): CalendarEvent {
  return { id: generateEventId(), ...content }
}

export const EVENT_TYPES: EventType[] = ['grabacion', 'reunion', 'entrega', 'bloqueo']

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  grabacion: 'Grabación',
  reunion: 'Reunión',
  entrega: 'Entrega',
  bloqueo: 'Bloqueo',
}

/** ADR-008 colors — read from the CSS custom properties in tokens.css, never hardcoded twice. */
export const EVENT_TYPE_COLOR_VAR: Record<EventType, string> = {
  grabacion: 'var(--event-grabacion)',
  reunion: 'var(--event-reunion)',
  entrega: 'var(--event-entrega)',
  bloqueo: 'var(--event-bloqueo)',
}

export const EVENT_TYPE_SOFT_VAR: Record<EventType, string> = {
  grabacion: 'var(--event-grabacion-soft)',
  reunion: 'var(--event-reunion-soft)',
  entrega: 'var(--event-entrega-soft)',
  bloqueo: 'var(--event-bloqueo-soft)',
}

export const EVENT_STATUSES: EventStatus[] = ['confirmado', 'tentativo', 'cancelado']

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  confirmado: 'Confirmado',
  tentativo: 'Tentativo',
  cancelado: 'Cancelado',
}

// ---- Dates ----

const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTH_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Monday-start week, matching how the studio actually schedules production days. */
export function startOfWeek(date: Date): Date {
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

export interface WeekDay {
  date: Date
  dateKey: string
  label: string
  dayNum: string
  isToday: boolean
}

export function buildWeekDays(weekStart: Date, today: Date = new Date()): WeekDay[] {
  const todayKey = toDateKey(today)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    const dateKey = toDateKey(date)
    return { date, dateKey, label: WEEKDAY_SHORT[i], dayNum: String(date.getDate()).padStart(2, '0'), isToday: dateKey === todayKey }
  })
}

/** "03 — 09 ago 2026" — the week-range caption in the calendar header. */
export function formatWeekRangeLabel(weekStart: Date): string {
  const end = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  const startDay = String(weekStart.getDate()).padStart(2, '0')
  const endDay = String(end.getDate()).padStart(2, '0')
  return `${startDay} — ${endDay} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_FULL[month]} ${year}`
}

export interface MonthDay {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
}

/** Builds a 42-cell (6-week) grid for the given month, starting on Monday, including leading/trailing days from neighboring months. */
export function buildMonthGrid(year: number, month: number, today: Date = new Date()): MonthDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const mondayOffset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1
  const gridStart = new Date(year, month, 1 - mondayOffset)
  const todayKey = dateKeyFromParts(today.getFullYear(), today.getMonth(), today.getDate())

  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const key = dateKeyFromParts(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
    return {
      date: key,
      day: cellDate.getDate(),
      inMonth: cellDate.getMonth() === month,
      isToday: key === todayKey,
    }
  })
}

/** "lunes, 10 de agosto", capitalized — the day-view header. */
export function formatDayLabel(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatTimeRange(startAt: string, endAt: string): string {
  return `${formatTime(startAt)}–${formatTime(endAt)}`
}

/** 'YYYY-MM-DDTHH:mm' — matches the value/onChange shape of <input type="datetime-local"> exactly, so it can be stored as-is. */
export function toLocalDateTimeValue(date: Date, hour: number, minute = 0): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ---- Week-grid positioning ----

export const GRID_START_HOUR = 0
export const GRID_END_HOUR = 24
export const PX_PER_HOUR = 56

export function eventTopPx(startAt: string): number {
  const d = new Date(startAt)
  const hours = d.getHours() + d.getMinutes() / 60
  return Math.max(0, (hours - GRID_START_HOUR) * PX_PER_HOUR)
}

export function eventHeightPx(startAt: string, endAt: string): number {
  const hours = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 3_600_000
  return Math.max(30, hours * PX_PER_HOUR)
}

// ---- Conflict detection (criterio de aceptación #2 de 05-calendar-system.md) ----

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() && new Date(aEnd).getTime() > new Date(bStart).getTime()
}

/** Confirmed/tentative events that share an assigned person and overlap the candidate's time range. */
export function findConflicts(
  events: CalendarEvent[],
  candidate: { personIds: string[]; startAt: string; endAt: string; status: EventStatus },
  excludeId?: string,
): CalendarEvent[] {
  if (candidate.status === 'cancelado' || candidate.personIds.length === 0) return []
  return events.filter((event) => {
    if (event.id === excludeId || event.status === 'cancelado') return false
    if (!event.personIds.some((id) => candidate.personIds.includes(id))) return false
    return timesOverlap(candidate.startAt, candidate.endAt, event.startAt, event.endAt)
  })
}

export interface ConflictPair {
  a: CalendarEvent
  b: CalendarEvent
  personIds: string[]
}

/** Every conflicting pair across the given events, each reported once — feeds the calendar-wide warning banner. */
export function findAllConflicts(events: CalendarEvent[]): ConflictPair[] {
  const active = events.filter((event) => event.status !== 'cancelado' && event.personIds.length > 0)
  const pairs: ConflictPair[] = []
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]
      const b = active[j]
      const personIds = a.personIds.filter((id) => b.personIds.includes(id))
      if (personIds.length > 0 && timesOverlap(a.startAt, a.endAt, b.startAt, b.endAt)) {
        pairs.push({ a, b, personIds })
      }
    }
  }
  return pairs
}
