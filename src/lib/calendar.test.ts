import { describe, expect, it } from 'vitest'
import { buildMonthGrid, createCalendarEventDraft, eventsByDate, formatDayLabel, monthLabel, toDateKey } from './calendar'
import type { CalendarEvent } from '../types'

function weekdayOf(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

describe('createCalendarEventDraft', () => {
  it('generates a unique id and keeps the given content', () => {
    const content = { date: '2026-08-10', time: '', title: 'Reunión', note: '', blocked: false }
    const draft = createCalendarEventDraft(content)
    expect(draft.id).toMatch(/^event-/)
    expect(draft).toMatchObject(content)
  })

  it('generates different ids on each call', () => {
    const content = { date: '2026-08-10', time: '', title: 'X', note: '', blocked: false }
    const a = createCalendarEventDraft(content)
    const b = createCalendarEventDraft(content)
    expect(a.id).not.toBe(b.id)
  })
})

const events: CalendarEvent[] = [
  { id: '1', date: '2026-08-10', time: '15:00', title: 'B', note: '', blocked: false },
  { id: '2', date: '2026-08-10', time: '09:00', title: 'A', note: '', blocked: false },
  { id: '3', date: '2026-08-11', time: '', title: 'C', note: '', blocked: true },
]

describe('eventsByDate', () => {
  it('groups events by date and sorts each day by time', () => {
    const grouped = eventsByDate(events)
    expect(grouped['2026-08-10'].map((e) => e.id)).toEqual(['2', '1'])
    expect(grouped['2026-08-11']).toHaveLength(1)
  })

  it('returns an empty object for no events', () => {
    expect(eventsByDate([])).toEqual({})
  })
})

describe('monthLabel', () => {
  it('returns the Spanish month name and year', () => {
    expect(monthLabel(2026, 7)).toBe('Agosto 2026')
  })
})

describe('toDateKey', () => {
  it('pads month and day to two digits', () => {
    expect(toDateKey(2026, 0, 5)).toBe('2026-01-05')
  })
})

describe('formatDayLabel', () => {
  it('formats and capitalizes the weekday, day and month in Spanish', () => {
    const label = formatDayLabel('2026-08-10')
    expect(label[0]).toBe(label[0].toUpperCase())
    expect(label).toContain('10')
    expect(label.toLowerCase()).toContain('agosto')
  })
})

describe('buildMonthGrid', () => {
  it('returns 42 cells starting on a Sunday', () => {
    const grid = buildMonthGrid(2026, 7)
    expect(grid).toHaveLength(42)
    expect(weekdayOf(grid[0].date)).toBe(0)
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
})
