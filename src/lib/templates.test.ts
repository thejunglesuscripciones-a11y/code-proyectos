import { beforeEach, describe, expect, it } from 'vitest'
import { defaultCompanyData } from './storage'
import {
  builtInTemplates,
  createTemplateDraft,
  duplicateTemplate,
  extractVariables,
  getAllTemplates,
  getTemplateById,
  previewOf,
  renderTemplateBody,
} from './templates'
import type { CompanyData } from '../types'

const company: CompanyData = {
  ...defaultCompanyData,
  ruc: '20123456786',
  email: 'contacto@thejunglefilms.com',
  phone: '+51 987 654 321',
  instagram: '@thejunglefilms',
  website: 'www.thejunglefilms.com',
  banco: 'Banco Santander, Cuenta 12345678',
  contactos: 'Antonio, Sasha',
}

beforeEach(() => {
  localStorage.clear()
})

describe('builtInTemplates', () => {
  it('has exactly 8 templates', () => {
    expect(builtInTemplates).toHaveLength(8)
  })

  it('has unique ids', () => {
    const ids = builtInTemplates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('none are marked custom', () => {
    expect(builtInTemplates.every((t) => t.isCustom === false)).toBe(true)
  })
})

describe('extractVariables', () => {
  it('extracts variables in first-seen order, deduplicated', () => {
    expect(extractVariables('Hola {cliente}, tu pedido {pedido} para {cliente} está listo')).toEqual([
      'cliente',
      'pedido',
    ])
  })

  it('excludes reserved {empresa_*} tokens', () => {
    expect(extractVariables('RUC: {empresa_ruc}, Cliente: {cliente}')).toEqual(['cliente'])
  })

  it('returns an empty array when there are no variables', () => {
    expect(extractVariables('Texto fijo sin variables')).toEqual([])
  })
})

describe('renderTemplateBody', () => {
  it('fills {empresa_*} tokens from company data', () => {
    const text = renderTemplateBody('RUC: {empresa_ruc}, Tel: {empresa_telefono}', {}, company)
    expect(text).toBe(`RUC: ${company.ruc}, Tel: ${company.phone}`)
  })

  it('fills user variables from the values map', () => {
    const text = renderTemplateBody('Hola {cliente}', { cliente: 'Café Andino' }, company)
    expect(text).toBe('Hola Café Andino')
  })

  it('renders a missing variable as empty, never leaking the literal token', () => {
    const text = renderTemplateBody('Cliente: {cliente}', {}, company)
    expect(text).toBe('Cliente: ')
    expect(text).not.toContain('{cliente}')
  })

  it('renders values with special characters unescaped', () => {
    const text = renderTemplateBody('{mensaje}', { mensaje: 'ñandú, 100% listo, $ y 🎬' }, company)
    expect(text).toBe('ñandú, 100% listo, $ y 🎬')
  })

  it('does not leak values from one render into the next', () => {
    const body = 'Cliente: {cliente}'
    const first = renderTemplateBody(body, { cliente: 'Cliente A' }, company)
    const second = renderTemplateBody(body, { cliente: 'Cliente B' }, company)
    expect(first).toBe('Cliente: Cliente A')
    expect(second).toBe('Cliente: Cliente B')
  })
})

describe('previewOf', () => {
  it('flattens newlines and strips markdown asterisks', () => {
    expect(previewOf('*Título*\nSegunda línea')).toBe('Título · Segunda línea')
  })

  it('truncates long bodies with an ellipsis', () => {
    const long = 'a'.repeat(100)
    const preview = previewOf(long, 20)
    expect(preview).toHaveLength(20)
    expect(preview.endsWith('…')).toBe(true)
  })
})

describe('createTemplateDraft', () => {
  it('creates a custom template with a fresh id', () => {
    const draft = createTemplateDraft({ name: 'Aviso', emoji: '📢', category: 'General', body: 'Hola {x}' })
    expect(draft.isCustom).toBe(true)
    expect(draft.id).toBeTruthy()
    expect(draft.name).toBe('Aviso')
  })

  it('generates unique ids across calls', () => {
    const a = createTemplateDraft({ name: 'A', emoji: '📢', category: 'General', body: 'x' })
    const b = createTemplateDraft({ name: 'B', emoji: '📢', category: 'General', body: 'x' })
    expect(a.id).not.toBe(b.id)
  })
})

describe('duplicateTemplate', () => {
  it('copies a built-in template as a new, deletable custom template', () => {
    const original = builtInTemplates[0]
    const copy = duplicateTemplate(original)
    expect(copy.isCustom).toBe(true)
    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe(`${original.name} (copia)`)
    expect(copy.body).toBe(original.body)
  })
})

describe('getAllTemplates / getTemplateById', () => {
  it('returns the 8 built-ins when nothing is customized', () => {
    expect(getAllTemplates()).toHaveLength(8)
  })

  it('finds a built-in template by id', () => {
    expect(getTemplateById('cotizacion')?.name).toBe('Solicitar Cotización')
  })

  it('returns undefined for an unknown id', () => {
    expect(getTemplateById('no-existe')).toBeUndefined()
  })

  it('applies a stored override on top of a built-in template', () => {
    localStorage.setItem(
      'jungleFilms_templateOverrides',
      JSON.stringify({ 'info-empresa': { name: 'Datos de la Empresa', emoji: '🏢', category: 'Comercial', body: 'Custom' } }),
    )
    const template = getTemplateById('info-empresa')
    expect(template?.name).toBe('Datos de la Empresa')
    expect(template?.body).toBe('Custom')
    expect(template?.isCustom).toBe(false)
  })

  it('includes custom templates alongside the built-ins', () => {
    localStorage.setItem(
      'jungleFilms_customTemplates',
      JSON.stringify([{ id: 'custom-1', name: 'Mío', emoji: '📌', category: 'General', body: 'Hola', isCustom: true }]),
    )
    const all = getAllTemplates()
    expect(all).toHaveLength(9)
    expect(all.some((t) => t.id === 'custom-1')).toBe(true)
  })
})
