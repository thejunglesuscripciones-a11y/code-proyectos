/**
 * Validates a Chilean RUT including its check digit (módulo 11).
 * Accepts formats like "76.234.567-K", "76234567-k", "7623456-2".
 */
export function isValidRut(rut: string): boolean {
  const cleaned = rut.trim().replace(/\./g, '').replace(/-/g, '')
  if (cleaned.length < 2) return false

  const body = cleaned.slice(0, -1)
  const providedDv = cleaned.slice(-1).toUpperCase()
  if (!/^\d+$/.test(body)) return false

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = 11 - (sum % 11)
  const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)

  return expectedDv === providedDv
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Accepts Chilean mobile numbers with or without country code/spacing,
 * e.g. "+56 9 1234 5678", "56912345678", "912345678".
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s()+-]/g, '')
  return /^(56)?9\d{8}$/.test(digits)
}

/** Validates DD/MM date format (day 01-31, month 01-12). */
export function isValidDayMonth(date: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(date.trim())
  if (!match) return false
  const day = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return false
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day >= 1 && day <= daysInMonth[month - 1]
}

/** Validates a currency string with a leading "$", e.g. "$5.000" or "$120". */
export function isValidCurrency(value: string): boolean {
  return /^\$\s?\d{1,3}(\.\d{3})*(,\d+)?$/.test(value.trim())
}

/**
 * Renders a visual progress bar like "▓▓▓░░░░░" for a percentage.
 * Clamps input to [0, 100] and rounds to the nearest 10% for 10 segments.
 */
export function renderProgressBar(percent: number, segments = 10): string {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const filled = Math.round((clamped / 100) * segments)
  return '▓'.repeat(filled) + '░'.repeat(segments - filled)
}
