import { describe, expect, it } from 'vitest'
import { defaultCompanyData } from './storage'
import { getTemplateById, templates } from './templates'
import type { CompanyData } from '../types'

const company: CompanyData = {
  ...defaultCompanyData,
  rut: '7.600.000-K',
  email: 'contacto@thejunglefilms.com',
  phone: '+56 9 1234 5678',
  instagram: '@thejunglefilms',
  website: 'www.thejunglefilms.com',
  banco: 'Banco Santander, Cuenta 12345678',
  contactos: 'Antonio, Sasha',
}

describe('templates catalog', () => {
  it('has exactly 8 templates', () => {
    expect(templates).toHaveLength(8)
  })

  it('has unique ids', () => {
    const ids = templates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('getTemplateById finds an existing template', () => {
    expect(getTemplateById('cotizacion')?.name).toBe('Solicitar Cotización')
  })

  it('getTemplateById returns undefined for unknown id', () => {
    expect(getTemplateById('no-existe')).toBeUndefined()
  })
})

describe('info-empresa template', () => {
  it('renders all company fields', () => {
    const template = getTemplateById('info-empresa')!
    const text = template.render({}, company)
    expect(text).toContain(company.rut)
    expect(text).toContain(company.email)
    expect(text).toContain(company.phone)
    expect(text).toContain(company.instagram)
    expect(text).toContain(company.website)
  })
})

describe('brief-proyecto template', () => {
  it('fills all provided variables', () => {
    const template = getTemplateById('brief-proyecto')!
    const text = template.render(
      {
        cliente: 'Café Andino',
        tipo: 'Comercial',
        fecha_entrega: '15/08',
        presupuesto: '$500.000',
        descripcion: 'Video promocional de 30s',
      },
      company,
    )
    expect(text).toContain('Café Andino')
    expect(text).toContain('$500.000')
    expect(text).toContain('Video promocional de 30s')
  })

  it('marks as URGENTE when flagged', () => {
    const template = getTemplateById('brief-proyecto')!
    const text = template.render({ prioridad: 'URGENTE' }, company)
    expect(text).toContain('URGENTE')
  })

  it('does not render the literal token for a missing variable', () => {
    const template = getTemplateById('brief-proyecto')!
    const text = template.render({ cliente: 'Café Andino' }, company)
    expect(text).not.toContain('{tipo}')
    expect(text).not.toContain('{presupuesto}')
  })

  it('renders variable values containing special characters unescaped', () => {
    const template = getTemplateById('brief-proyecto')!
    const text = template.render(
      { descripcion: 'Con acentos: ñandú, 100% satisfacción, $ y emoji 🎬' },
      company,
    )
    expect(text).toContain('Con acentos: ñandú, 100% satisfacción, $ y emoji 🎬')
  })
})

describe('cotizacion template', () => {
  it('omits the referencias line when not provided', () => {
    const template = getTemplateById('cotizacion')!
    const text = template.render({ tipo_trabajo: 'Spot' }, company)
    expect(text).not.toContain('Referencias previas')
  })

  it('includes referencias line when provided', () => {
    const template = getTemplateById('cotizacion')!
    const text = template.render({ referencias: 'Cliente X, Cliente Y' }, company)
    expect(text).toContain('Referencias previas: Cliente X, Cliente Y')
  })
})

describe('recordatorio-pago template', () => {
  it('uses the company bank data, not a variable', () => {
    const template = getTemplateById('recordatorio-pago')!
    const text = template.render({ monto: '$50.000' }, company)
    expect(text).toContain(company.banco)
  })

  it('renders friendly tone by default', () => {
    const template = getTemplateById('recordatorio-pago')!
    const text = template.render({}, company)
    expect(text).toContain('recordatorio amistoso')
  })

  it('renders formal tone when selected', () => {
    const template = getTemplateById('recordatorio-pago')!
    const text = template.render({ tono: 'formal' }, company)
    expect(text).toContain('Le escribimos')
  })

  it('renders urgent tone when selected', () => {
    const template = getTemplateById('recordatorio-pago')!
    const text = template.render({ tono: 'urgente' }, company)
    expect(text).toContain('urgente')
    expect(text).toContain('vencido')
  })
})

describe('confirmacion-entrega template', () => {
  it('fills the download link, password and days available', () => {
    const template = getTemplateById('confirmacion-entrega')!
    const text = template.render(
      { link_descarga: 'https://drive.example/xyz', password: 'jf2026', dias_disponible: '7' },
      company,
    )
    expect(text).toContain('https://drive.example/xyz')
    expect(text).toContain('jf2026')
    expect(text).toContain('7 días')
  })
})

describe('solicitar-revisiones template', () => {
  it.each([
    ['menor', '24 horas'],
    ['mayor', '48 horas'],
    ['restructuracion', '3-5 días'],
  ])('maps tipo_revision=%s to %s', (tipo, expected) => {
    const template = getTemplateById('solicitar-revisiones')!
    const text = template.render({ tipo_revision: tipo }, company)
    expect(text).toContain(expected)
  })
})

describe('estado-proyecto template', () => {
  it('renders a progress bar for each stage', () => {
    const template = getTemplateById('estado-proyecto')!
    const text = template.render(
      { etapa1_pct: '100', etapa2_pct: '50', etapa3_pct: '0', etapa4_pct: '25' },
      company,
    )
    expect(text).toContain('100%')
    expect(text).toContain('▓▓▓▓▓░░░░░ 50%')
    expect(text).toContain('░░░░░░░░░░ 0%')
  })

  it('defaults missing stage percentages to 0', () => {
    const template = getTemplateById('estado-proyecto')!
    const text = template.render({}, company)
    expect(text).toContain('Conceptualización: ░░░░░░░░░░ 0%')
  })
})

describe('agendar-reunion template', () => {
  it('renders all three date/time options', () => {
    const template = getTemplateById('agendar-reunion')!
    const text = template.render(
      {
        fecha1: '10/08',
        hora1: '10:00',
        fecha2: '11/08',
        hora2: '15:00',
        fecha3: '12/08',
        hora3: '09:00',
      },
      company,
    )
    expect(text).toContain('10/08 10:00')
    expect(text).toContain('11/08 15:00')
    expect(text).toContain('12/08 09:00')
  })
})

describe('template immutability across renders', () => {
  it('does not leak values from one render() call into the next', () => {
    const template = getTemplateById('brief-proyecto')!
    const first = template.render({ cliente: 'Cliente A' }, company)
    const second = template.render({ cliente: 'Cliente B' }, company)
    expect(first).toContain('Cliente A')
    expect(second).toContain('Cliente B')
    expect(second).not.toContain('Cliente A')
  })
})
