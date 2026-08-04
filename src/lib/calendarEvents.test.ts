import { describe, expect, it } from 'vitest'
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_COLOR_VAR,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_SOFT_VAR,
  GRID_START_HOUR,
  buildMonthGrid,
  buildWeekDays,
  createCalendarEventDraft,
  eventHeightPx,
  eventTopPx,
  findAllConflicts,
  findConflicts,
  formatDayLabel,
  formatTime,
  formatTimeRange,
  formatWeekRangeLabel,
  monthLabel,
  startOfWeek,
  toDateKey,
  toLocalDateTimeValue,
} from './calendarEvents'
import type { CalendarEvent } from '../types'

describe('createCalendarEventDraft', () => {
  it('generates a unique id and keeps the given content', () => {
    const content = {
      type: 'grabacion' as const,
      title: 'Adidas',
      clientId: null,
      projectId: null,
      startAt: '2026-08-04T09:00',
      endAt: '2026-08-04T10:00',
      locationText: '',
      personIds: [],
      notes: '',
      status: 'confirmado' as const,
    }
    const draft = createCalendarEventDraft(content)
    expect(draft.id).toMatch(/^event-/)
    expect(draft).toMatchObject(content)
  })

  it('generates different ids on each call', () => {
    const content = {
      type: 'reunion' as const,
      title: 'X',
      clientId: null,
      projectId: null,
      startAt: '2026-08-04T09:00',
      endAt: '2026-08-04T10:00',
      locationText: '',
      personIds: [],
      notes: '',
      status: 'confirmado' as const,
    }
    const a = createCalendarEventDraft(content)
    const b = createCalendarEventDraft(content)
    expect(a.id).not.toBe(b.id)
  })
})

describe('event type/status constants', () => {
  it('has a label and color for every event type', () => {
    for (const type of EVENT_TYPES) {
      expect(EVENT_TYPE_LABELS[type]).toBeTruthy()
      expect(EVENT_TYPE_COLOR_VAR[type]).toMatch(/^var\(--event-/)
      expect(EVENT_TYPE_SOFT_VAR[type]).toMatch(/^var\(--event-.*-soft\)$/)
    }
  })

  it('has a label for every status', () => {
    for (const status of EVENT_STATUSES) {
      expect(EVENT_STATUS_LABELS[status]).toBeTruthy()
    }
  })
})

describe('toDateKey', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('startOfWeek', () => {
  it('returns the Monday of the week for a mid-week date', () => {
    // Tuesday Aug 4 2026 -> Monday Aug 3 2026
    expect(toDateKey(startOfWeek(new Date(2026, 7, 4)))).toBe('2026-08-03')
  })

  it('returns the previous Monday for a Sunday', () => {
    // Sunday Aug 9 2026 -> Monday Aug 3 2026
    expect(toDateKey(startOfWeek(new Date(2026, 7, 9)))).toBe('2026-08-03')
  })

  it('returns the same date when already a Monday', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 7, 3)))).toBe('2026-08-03')
  })

  it('zeroes out the time of day', () => {
    const start = startOfWeek(new Date(2026, 7, 4, 15, 30))
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
  })
})

describe('buildWeekDays', () => {
  it('builds 7 consecutive days labeled Lun..Dom starting from weekStart', () => {
    const days = buildWeekDays(new Date(2026, 7, 3))
    expect(days).toHaveLength(7)
    expect(days.map((d) => d.dateKey)).toEqual([
      '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09',
    ])
    expect(days[0].label).toBe('Lun')
    expect(days[6].label).toBe('Dom')
    expect(days[0].dayNum).toBe('03')
  })

  it('flags isToday only for the matching day', () => {
    const days = buildWeekDays(new Date(2026, 7, 3), new Date(2026, 7, 5))
    expect(days.filter((d) => d.isToday)).toHaveLength(1)
    expect(days.find((d) => d.isToday)?.dateKey).toBe('2026-08-05')
  })
})

describe('formatWeekRangeLabel', () => {
  it('formats "DD — DD mon YYYY"', () => {
    expect(formatWeekRangeLabel(new Date(2026, 7, 3))).toBe('03 — 09 ago 2026')
  })
})

describe('monthLabel', () => {
  it('returns the Spanish month name and year', () => {
    expect(monthLabel(2026, 7)).toBe('Agosto 2026')
  })
})

describe('buildMonthGrid', () => {
  function weekdayOf(dateKey: string): number {
    const [y, m, d] = dateKey.split('-').map(Number)
    return new Date(y, m - 1, d).getDay()
  }

  it('returns 42 cells starting on a Monday', () => {
    const grid = buildMonthGrid(2026, 7)
    expect(grid).toHaveLength(42)
    expect(weekdayOf(grid[0].date)).toBe(1)
  })

  it('marks every day of the target month as inMonth, padded by neighboring months', () => {
    const grid = buildMonthGrid(2026, 7)
    const inMonthCells = grid.filter((cell) => cell.inMonth)
    expect(inMonthCells).toHaveLength(31)
    expect(inMonthCells[0].day).toBe(1)
    expect(inMonthCells[inMonthCells.length - 1].day).toBe(31)
  })

  it('flags isToday only for the given reference date', () => {
    const grid = buildMonthGrid(2026, 7, new Date(2026, 7, 15))
    const todayCells = grid.filter((cell) => cell.isToday)
    expect(todayCells).toHaveLength(1)
    expect(todayCells[0].date).toBe('2026-08-15')
  })

  it('starts the grid on Monday even when the month starts on a Sunday', () => {
    // November 2026 starts on a Sunday
    const grid = buildMonthGrid(2026, 10)
    expect(weekdayOf(grid[0].date)).toBe(1)
  })
})

describe('formatDayLabel', () => {
  it('formats and capitalizes the weekday, day and month in Spanish', () => {
    const label = formatDayLabel(new Date(2026, 7, 10))
    expect(label[0]).toBe(label[0].toUpperCase())
    expect(label).toContain('10')
    expect(label.toLowerCase()).toContain('agosto')
  })
})

describe('formatTime / formatTimeRange', () => {
  it('formats a local datetime string as HH:mm', () => {
    expect(formatTime('2026-08-04T09:05')).toBe('09:05')
  })

  it('formats a start/end pair as a dash-separated range', () => {
    expect(formatTimeRange('2026-08-04T09:00', '2026-08-04T13:00')).toBe('09:00–13:00')
  })
})

describe('toLocalDateTimeValue', () => {
  it('formats a date/hour/minute as datetime-local input value', () => {
    expect(toLocalDateTimeValue(new Date(2026, 7, 4), 9)).toBe('2026-08-04T09:00')
    expect(toLocalDateTimeValue(new Date(2026, 7, 4), 9, 30)).toBe('2026-08-04T09:30')
  })
})

describe('eventTopPx / eventHeightPx', () => {
  it('computes the top offset from the grid start hour', () => {
    expect(eventTopPx(`2026-08-04T${String(GRID_START_HOUR).padStart(2, '0')}:00`)).toBe(0)
    expect(eventTopPx('2026-08-04T09:00')).toBe(56)
    expect(eventTopPx('2026-08-04T09:30')).toBe(84)
  })

  it('never returns a negative top offset', () => {
    expect(eventTopPx('2026-08-04T00:00')).toBe(0)
  })

  it('computes height from the duration, with a minimum', () => {
    expect(eventHeightPx('2026-08-04T09:00', '2026-08-04T10:00')).toBe(56)
    expect(eventHeightPx('2026-08-04T09:00', '2026-08-04T09:10')).toBe(30)
  })
})

const baseEvent: CalendarEvent = {
  id: 'event-1',
  type: 'grabacion',
  title: 'Adidas',
  clientId: null,
  projectId: null,
  startAt: '2026-08-04T09:00',
  endAt: '2026-08-04T13:00',
  locationText: '',
  personIds: ['person-1'],
  notes: '',
  status: 'confirmado',
}

describe('findConflicts', () => {
  it('finds a confirmed event sharing a person with an overlapping time range', () => {
    const conflicts = findConflicts([baseEvent], { personIds: ['person-1'], startAt: '2026-08-04T11:00', endAt: '2026-08-04T15:00', status: 'confirmado' })
    expect(conflicts).toEqual([baseEvent])
  })

  it('ignores events that do not share a person', () => {
    const conflicts = findConflicts([baseEvent], { personIds: ['person-2'], startAt: '2026-08-04T11:00', endAt: '2026-08-04T15:00', status: 'confirmado' })
    expect(conflicts).toEqual([])
  })

  it('ignores events that do not overlap in time', () => {
    const conflicts = findConflicts([baseEvent], { personIds: ['person-1'], startAt: '2026-08-04T14:00', endAt: '2026-08-04T15:00', status: 'confirmado' })
    expect(conflicts).toEqual([])
  })

  it('ignores cancelled events', () => {
    const cancelled = { ...baseEvent, status: 'cancelado' as const }
    const conflicts = findConflicts([cancelled], { personIds: ['person-1'], startAt: '2026-08-04T11:00', endAt: '2026-08-04T15:00', status: 'confirmado' })
    expect(conflicts).toEqual([])
  })

  it('returns nothing when the candidate itself is cancelled', () => {
    const conflicts = findConflicts([baseEvent], { personIds: ['person-1'], startAt: '2026-08-04T11:00', endAt: '2026-08-04T15:00', status: 'cancelado' })
    expect(conflicts).toEqual([])
  })

  it('returns nothing when the candidate has no assigned people', () => {
    const conflicts = findConflicts([baseEvent], { personIds: [], startAt: '2026-08-04T11:00', endAt: '2026-08-04T15:00', status: 'confirmado' })
    expect(conflicts).toEqual([])
  })

  it('excludes the event being edited via excludeId', () => {
    const conflicts = findConflicts(
      [baseEvent],
      { personIds: ['person-1'], startAt: '2026-08-04T09:00', endAt: '2026-08-04T13:00', status: 'confirmado' },
      'event-1',
    )
    expect(conflicts).toEqual([])
  })
})

describe('findAllConflicts', () => {
  it('reports a conflicting pair once', () => {
    const other: CalendarEvent = { ...baseEvent, id: 'event-2', title: 'Skechers', startAt: '2026-08-04T11:00', endAt: '2026-08-04T15:00' }
    const pairs = findAllConflicts([baseEvent, other])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].personIds).toEqual(['person-1'])
  })

  it('returns an empty array when nothing overlaps', () => {
    const other: CalendarEvent = { ...baseEvent, id: 'event-2', startAt: '2026-08-04T14:00', endAt: '2026-08-04T15:00' }
    expect(findAllConflicts([baseEvent, other])).toEqual([])
  })

  it('ignores cancelled events and events with no assigned people', () => {
    const cancelled: CalendarEvent = { ...baseEvent, id: 'event-2', status: 'cancelado' }
    const noPeople: CalendarEvent = { ...baseEvent, id: 'event-3', personIds: [] }
    expect(findAllConflicts([baseEvent, cancelled, noPeople])).toEqual([])
  })
})
