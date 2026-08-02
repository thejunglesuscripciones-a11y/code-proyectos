const VALID_RUC_PREFIXES = ['10', '15', '17', '20', '25']

/**
 * Validates a Peruvian RUC (Registro Único de Contribuyentes / SUNAT):
 * 11 digits, a valid taxpayer-type prefix, and a check digit computed via
 * the standard módulo 11 algorithm.
 */
export function isValidRuc(ruc: string): boolean {
  const cleaned = ruc.trim().replace(/[\s-]/g, '')
  if (!/^\d{11}$/.test(cleaned)) return false
  if (!VALID_RUC_PREFIXES.includes(cleaned.slice(0, 2))) return false

  const digits = cleaned.slice(0, 10).split('').map(Number)
  const providedCheckDigit = Number(cleaned[10])
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0)

  let expectedCheckDigit = 11 - (sum % 11)
  if (expectedCheckDigit === 10) expectedCheckDigit = 0
  if (expectedCheckDigit === 11) expectedCheckDigit = 1

  return expectedCheckDigit === providedCheckDigit
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Accepts Peruvian mobile numbers with or without country code/spacing,
 * e.g. "+51 987 654 321", "51987654321", "987654321".
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s()+-]/g, '')
  return /^(51)?9\d{8}$/.test(digits)
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
