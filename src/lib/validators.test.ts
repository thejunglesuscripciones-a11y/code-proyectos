import { describe, expect, it } from 'vitest'
import {
  isValidCurrency,
  isValidDayMonth,
  isValidEmail,
  isValidPhone,
  isValidRut,
  renderProgressBar,
} from './validators'

describe('isValidRut', () => {
  it('accepts a valid formatted RUT', () => {
    expect(isValidRut('7.600.000-K')).toBe(true)
  })

  it('accepts lowercase k check digit', () => {
    expect(isValidRut('7.600.000-k')).toBe(true)
  })

  it('accepts RUT without dots/dashes formatting quirks', () => {
    expect(isValidRut('7623456-6')).toBe(true)
  })

  it('accepts a RUT whose check digit is 0', () => {
    expect(isValidRut('1.000.013-0')).toBe(true)
  })

  it('rejects an invalid check digit', () => {
    expect(isValidRut('76.234.567-9')).toBe(false)
  })

  it('rejects non-numeric body', () => {
    expect(isValidRut('abc-K')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidRut('')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('contacto@thejunglefilms.com')).toBe(true)
  })

  it('accepts email with subdomain', () => {
    expect(isValidEmail('a@mail.thejunglefilms.co.uk')).toBe(true)
  })

  it('rejects missing @', () => {
    expect(isValidEmail('contactothejunglefilms.com')).toBe(false)
  })

  it('rejects missing domain dot', () => {
    expect(isValidEmail('contacto@thejunglefilms')).toBe(false)
  })

  it('rejects string with spaces', () => {
    expect(isValidEmail('contacto @thejunglefilms.com')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('accepts phone with country code and spacing', () => {
    expect(isValidPhone('+56 9 1234 5678')).toBe(true)
  })

  it('accepts phone without spacing or country code', () => {
    expect(isValidPhone('912345678')).toBe(true)
  })

  it('accepts phone with country code, no spacing', () => {
    expect(isValidPhone('56912345678')).toBe(true)
  })

  it('rejects phone with wrong number of digits', () => {
    expect(isValidPhone('91234')).toBe(false)
  })

  it('rejects landline-style (non-9-prefixed) numbers', () => {
    expect(isValidPhone('212345678')).toBe(false)
  })
})

describe('isValidDayMonth', () => {
  it('accepts a normal date', () => {
    expect(isValidDayMonth('15/08')).toBe(true)
  })

  it('accepts Feb 29 (leap-day boundary allowance)', () => {
    expect(isValidDayMonth('29/02')).toBe(true)
  })

  it('rejects month 13', () => {
    expect(isValidDayMonth('15/13')).toBe(false)
  })

  it('rejects day 32', () => {
    expect(isValidDayMonth('32/01')).toBe(false)
  })

  it('rejects wrong format', () => {
    expect(isValidDayMonth('2026-08-15')).toBe(false)
  })
})

describe('isValidCurrency', () => {
  it('accepts a thousands-separated amount', () => {
    expect(isValidCurrency('$5.000')).toBe(true)
  })

  it('accepts a small amount without separators', () => {
    expect(isValidCurrency('$120')).toBe(true)
  })

  it('rejects amount missing the $ prefix', () => {
    expect(isValidCurrency('5.000')).toBe(false)
  })

  it('rejects non-numeric value', () => {
    expect(isValidCurrency('$cinco mil')).toBe(false)
  })
})

describe('renderProgressBar', () => {
  it('renders all empty at 0%', () => {
    expect(renderProgressBar(0)).toBe('░░░░░░░░░░')
  })

  it('renders all filled at 100%', () => {
    expect(renderProgressBar(100)).toBe('▓▓▓▓▓▓▓▓▓▓')
  })

  it('renders a partial bar for a non-multiple-of-10 percentage', () => {
    expect(renderProgressBar(45)).toBe('▓▓▓▓▓░░░░░')
  })

  it('clamps values above 100', () => {
    expect(renderProgressBar(150)).toBe('▓▓▓▓▓▓▓▓▓▓')
  })

  it('clamps negative values', () => {
    expect(renderProgressBar(-20)).toBe('░░░░░░░░░░')
  })

  it('treats NaN as 0', () => {
    expect(renderProgressBar(Number.NaN)).toBe('░░░░░░░░░░')
  })
})
