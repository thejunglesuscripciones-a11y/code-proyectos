import { describe, expect, it } from 'vitest'
import { defaultCompanyData } from './storage'
import {
  builtInTemplates,
  companyTokenList,
  createTemplateDraft,
  duplicateTemplate,
  extractVariables,
  mergeTemplates,
  previewOf,
  renderTemplateBody,
} from './templates'
import type { CompanyData } from '../types'

const company: CompanyData = {
  ...defaultCompanyData,
  ruc: '20123456786',
  email: 'contacto@thejunglefilms.com',
  phone: '+51 987 654 321',
  customFields: [
    { id: 'instagram', label: 'Instagram', value: '@thejunglefilms' },
    { id: 'web', label: 'Website', value: 'www.thejunglefilms.com' },
    { id: 'banco', label: 'Banco / Cuenta', value: 'Banco Santander, Cuenta 12345678' },
    { id: 'contactos', label: 'Contactos', value: 'Antonio, Sasha' },
  ],
}

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
    expect(
      extractVariables('Hola {cliente}, tu pedido {pedido} para {cliente} está listo', company),
    ).toEqual(['cliente', 'pedido'])
  })

  it('excludes fixed {empresa_*} tokens', () => {
    expect(extractVariables('RUC: {empresa_ruc}, Cliente: {cliente}', company)).toEqual(['cliente'])
  })

  it('excludes custom company field tokens', () => {
    expect(extractVariables('Instagram: {empresa_instagram}, Cliente: {cliente}', company)).toEqual(['cliente'])
  })

  it('treats a token as a normal variable once its company field no longer exists', () => {
    const companyWithoutInstagram = { ...company, customFields: company.customFields.filter((f) => f.id !== 'instagram') }
    expect(extractVariables('{empresa_instagram}', companyWithoutInstagram)).toEqual(['empresa_instagram'])
  })

  it('returns an empty array when there are no variables', () => {
    expect(extractVariables('Texto fijo sin variables', company)).toEqual([])
  })
})

describe('renderTemplateBody', () => {
  it('fills fixed {empresa_*} tokens from company data', () => {
    const text = renderTemplateBody('RUC: {empresa_ruc}, Tel: {empresa_telefono}', {}, company)
    expect(text).toBe(`RUC: ${company.ruc}, Tel: ${company.phone}`)
  })

  it('fills custom company field tokens by id', () => {
    const text = renderTemplateBody('Banco: {empresa_banco}', {}, company)
    expect(text).toBe('Banco: Banco Santander, Cuenta 12345678')
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

describe('companyTokenList', () => {
  it('lists the 3 fixed tokens plus one per custom field, with friendly labels', () => {
    const list = companyTokenList(company)
    expect(list).toEqual([
      { token: 'empresa_ruc', label: 'RUC' },
      { token: 'empresa_email', label: 'Email' },
      { token: 'empresa_telefono', label: 'Teléfono' },
      { token: 'empresa_instagram', label: 'Instagram' },
      { token: 'empresa_web', label: 'Website' },
      { token: 'empresa_banco', label: 'Banco / Cuenta' },
      { token: 'empresa_contactos', label: 'Contactos' },
    ])
  })

  it('reflects an empty custom field list', () => {
    const list = companyTokenList({ ...company, customFields: [] })
    expect(list).toHaveLength(3)
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

describe('mergeTemplates', () => {
  it('returns the 8 built-ins when there are no customs or overrides', () => {
    expect(mergeTemplates([], {})).toHaveLength(8)
  })

  it('applies an override on top of the matching built-in template, keeping isCustom false', () => {
    const overrides = { 'info-empresa': { name: 'Datos de la Empresa', emoji: '🏢', category: 'Comercial', body: 'Custom' } }
    const all = mergeTemplates([], overrides)
    const template = all.find((t) => t.id === 'info-empresa')
    expect(template?.name).toBe('Datos de la Empresa')
    expect(template?.body).toBe('Custom')
    expect(template?.isCustom).toBe(false)
  })

  it('carries the override attribution onto the merged built-in template', () => {
    const updatedBy = { name: 'Antonio', email: 'antonio@gorilia.com', updatedAt: '2026-01-01T00:00:00.000Z' }
    const overrides = {
      'info-empresa': { name: 'Datos de la Empresa', emoji: '🏢', category: 'Comercial', body: 'Custom', updatedBy },
    }
    const all = mergeTemplates([], overrides)
    expect(all.find((t) => t.id === 'info-empresa')?.updatedBy).toEqual(updatedBy)
  })

  it('includes custom templates alongside the built-ins', () => {
    const customs = [{ id: 'custom-1', name: 'Mío', emoji: '📌', category: 'General', body: 'Hola', isCustom: true }]
    const all = mergeTemplates(customs, {})
    expect(all).toHaveLength(9)
    expect(all.some((t) => t.id === 'custom-1')).toBe(true)
  })

  it('leaves unmodified built-ins without an override untouched', () => {
    const all = mergeTemplates([], { 'info-empresa': { name: 'x', emoji: 'x', category: 'x', body: 'x' } })
    const untouched = all.find((t) => t.id === 'cotizacion')
    expect(untouched).toEqual(builtInTemplates.find((t) => t.id === 'cotizacion'))
  })
})
