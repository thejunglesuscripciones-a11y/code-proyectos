import { describe, expect, it } from 'vitest'
import { generateFieldId, slugify } from './companyFields'

describe('slugify', () => {
  it('lowercases and replaces spaces with underscores', () => {
    expect(slugify('Horario de Atención')).toBe('horario_de_atencion')
  })

  it('strips accents', () => {
    expect(slugify('Dirección')).toBe('direccion')
  })

  it('collapses repeated separators and trims leading/trailing underscores', () => {
    expect(slugify('  Tarifas -- Base!!  ')).toBe('tarifas_base')
  })

  it('falls back to "campo" when nothing alphanumeric remains', () => {
    expect(slugify('   ')).toBe('campo')
    expect(slugify('!!!')).toBe('campo')
  })
})

describe('generateFieldId', () => {
  it('uses the plain slug when there is no collision', () => {
    expect(generateFieldId('Instagram', [])).toBe('instagram')
  })

  it('appends _2 on a first collision', () => {
    expect(generateFieldId('Instagram', ['instagram'])).toBe('instagram_2')
  })

  it('keeps incrementing past multiple collisions', () => {
    expect(generateFieldId('Instagram', ['instagram', 'instagram_2', 'instagram_3'])).toBe('instagram_4')
  })
})
