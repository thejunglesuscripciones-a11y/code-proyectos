import { describe, expect, it } from 'vitest'
import {
  isValidCurrency,
  isValidDayMonth,
  isValidDni,
  isValidEmail,
  isValidPhone,
  isValidRuc,
  renderProgressBar,
} from './validators'

describe('isValidRuc', () => {
  it('accepts a valid RUC for a legal entity (prefix 20)', () => {
    expect(isValidRuc('20123456786')).toBe(true)
  })

  it('accepts a valid RUC for a natural person (prefix 10)', () => {
    expect(isValidRuc('10123456781')).toBe(true)
  })

  it('accepts a RUC whose check digit is 0', () => {
    expect(isValidRuc('20000000010')).toBe(true)
  })

  it('accepts spacing/dashes as formatting noise', () => {
    expect(isValidRuc('20 123 456 786')).toBe(true)
  })

  it('rejects an invalid check digit', () => {
    expect(isValidRuc('20123456789')).toBe(false)
  })

  it('rejects an invalid taxpayer-type prefix', () => {
    expect(isValidRuc('99123456786')).toBe(false)
  })

  it('rejects the wrong number of digits', () => {
    expect(isValidRuc('2012345678')).toBe(false)
  })

  it('rejects non-numeric input', () => {
    expect(isValidRuc('abcdefghijk')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidRuc('')).toBe(false)
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
    expect(isValidPhone('+51 987 654 321')).toBe(true)
  })

  it('accepts phone without spacing or country code', () => {
    expect(isValidPhone('987654321')).toBe(true)
  })

  it('accepts phone with country code, no spacing', () => {
    expect(isValidPhone('51987654321')).toBe(true)
  })

  it('rejects phone with wrong number of digits', () => {
    expect(isValidPhone('98765')).toBe(false)
  })

  it('rejects landline-style (non-9-prefixed) numbers', () => {
    expect(isValidPhone('212345678')).toBe(false)
  })
})

describe('isValidDni', () => {
  it('accepts an 8-digit DNI', () => {
    expect(isValidDni('12345678')).toBe(true)
  })

  it('rejects fewer than 8 digits', () => {
    expect(isValidDni('1234567')).toBe(false)
  })

  it('rejects more than 8 digits', () => {
    expect(isValidDni('123456789')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(isValidDni('1234567a')).toBe(false)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidDni('  12345678  ')).toBe(true)
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
