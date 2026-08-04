import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatAttributionDate } from './format'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-15T18:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('formatAttributionDate', () => {
  it('formats a timestamp from earlier today as "hoy, HH:MM"', () => {
    expect(formatAttributionDate('2026-01-15T14:32:00.000Z')).toMatch(/^hoy, \d{2}:\d{2}$/)
  })

  it('formats a timestamp from yesterday as "ayer, HH:MM"', () => {
    expect(formatAttributionDate('2026-01-14T09:10:00.000Z')).toMatch(/^ayer, \d{2}:\d{2}$/)
  })

  it('formats an older timestamp as a short date', () => {
    const result = formatAttributionDate('2026-01-03T09:10:00.000Z')
    expect(result).not.toMatch(/^hoy|^ayer/)
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatAttributionDate('not-a-date')).toBe('')
  })
})
