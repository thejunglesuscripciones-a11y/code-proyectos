import type { CompanyData, TemplateContent, TemplateDefinition } from '../types'
import { loadCustomTemplates, loadTemplateOverrides } from './storage'

/**
 * The 3 company fields with format-specific validation are fixed {empresa_*}
 * tokens. Everything else (Instagram, Banco, or any field the user adds in
 * Settings) is a CompanyField and becomes {empresa_<field.id>} automatically —
 * every template, built-in or custom, can reference them the same way.
 */
const FIXED_COMPANY_TOKENS: Record<string, keyof Pick<CompanyData, 'ruc' | 'email' | 'phone'>> = {
  empresa_ruc: 'ruc',
  empresa_email: 'email',
  empresa_telefono: 'phone',
}

const FIXED_COMPANY_LABELS: Record<string, string> = {
  empresa_ruc: 'RUC',
  empresa_email: 'Email',
  empresa_telefono: 'Teléfono',
}

/** Every {empresa_*} token currently available to insert into a template, with a friendly label for the UI. */
export function companyTokenList(company: CompanyData): { token: string; label: string }[] {
  return [
    ...Object.keys(FIXED_COMPANY_TOKENS).map((token) => ({ token, label: FIXED_COMPANY_LABELS[token] })),
    ...company.customFields.map((field) => ({ token: `empresa_${field.id}`, label: field.label })),
  ]
}

function isCompanyToken(name: string, company: CompanyData): boolean {
  if (name in FIXED_COMPANY_TOKENS) return true
  return company.customFields.some((field) => `empresa_${field.id}` === name)
}

/** The 8 starting templates. Users can edit or reset these; overrides are stored separately. */
export const builtInTemplates: TemplateDefinition[] = [
  {
    id: 'info-empresa',
    name: 'Información de Empresa',
    emoji: '📋',
    category: 'Comercial',
    isCustom: false,
    body: [
      '*The Jungle Films* 🎬',
      '━━━━━━━━━━━━━━',
      'RUC: {empresa_ruc}',
      'Email: {empresa_email}',
      'Teléfono: {empresa_telefono}',
      'Instagram: {empresa_instagram}',
      'Web: {empresa_web}',
    ].join('\n'),
  },
  {
    id: 'brief-proyecto',
    name: 'Crear Brief de Proyecto',
    emoji: '🎬',
    category: 'Comercial',
    isCustom: false,
    body: [
      '*Brief de Proyecto*',
      'Cliente: {cliente}',
      'Tipo: {tipo}',
      'Fecha de entrega: {fecha_entrega}',
      'Presupuesto: {presupuesto}',
      'Descripción: {descripcion}',
      'Prioridad: {prioridad}',
    ].join('\n'),
  },
  {
    id: 'cotizacion',
    name: 'Solicitar Cotización',
    emoji: '💰',
    category: 'Comercial',
    isCustom: false,
    body: [
      '*Solicitud de Cotización*',
      'Tipo de trabajo: {tipo_trabajo}',
      'Fecha necesaria: {fecha_necesaria}',
      'Descripción: {descripcion}',
      'Contacto: {contacto}',
      'Referencias previas: {referencias}',
    ].join('\n'),
  },
  {
    id: 'recordatorio-pago',
    name: 'Recordatorio de Pago Pendiente',
    emoji: '💳',
    category: 'Administrativo',
    isCustom: false,
    body: [
      'Este es un recordatorio sobre tu pago pendiente 😊',
      'Monto: {monto}',
      'Cuenta: {empresa_banco}',
      'Vencimiento: {vencimiento}',
    ].join('\n'),
  },
  {
    id: 'confirmacion-entrega',
    name: 'Proyecto Completado - Entrega',
    emoji: '✅',
    category: 'Comercial',
    isCustom: false,
    body: [
      '¡Tu proyecto está listo! 🎉',
      'Link de descarga: {link_descarga}',
      'Contraseña: {password}',
      'Disponible por: {dias_disponible} días',
      'Gracias por confiar en The Jungle Films 🎬',
    ].join('\n'),
  },
  {
    id: 'solicitar-revisiones',
    name: 'Solicitud de Revisiones Recibida',
    emoji: '📝',
    category: 'Comercial',
    isCustom: false,
    body: [
      'Hemos recibido tu solicitud de revisiones ✏️',
      'Tiempo estimado: {tiempo_estimado}',
      'Te avisaremos apenas esté listo.',
    ].join('\n'),
  },
  {
    id: 'agendar-reunion',
    name: 'Agendar Reunión/Videollamada',
    emoji: '📅',
    category: 'Reportes',
    isCustom: false,
    body: [
      '¿Agendamos una reunión? 📅',
      'Opción 1: {fecha1} {hora1}',
      'Opción 2: {fecha2} {hora2}',
      'Opción 3: {fecha3} {hora3}',
      'Link: {link_reunion}',
    ].join('\n'),
  },
  {
    id: 'estado-proyecto',
    name: 'Actualización de Estado del Proyecto',
    emoji: '📊',
    category: 'Reportes',
    isCustom: false,
    body: [
      '*Estado del Proyecto* 📊',
      'Conceptualización: {etapa1_pct}%',
      'Pre-producción: {etapa2_pct}%',
      'Producción: {etapa3_pct}%',
      'Post-producción: {etapa4_pct}%',
    ].join('\n'),
  },
]

/** Extracts the user-fillable {variable} names from a body, in first-seen order, excluding the {empresa_*} tokens. */
export function extractVariables(body: string, company: CompanyData): string[] {
  const seen = new Set<string>()
  for (const match of body.matchAll(/\{(\w+)\}/g)) {
    const name = match[1]
    if (!isCompanyToken(name, company)) seen.add(name)
  }
  return [...seen]
}

/** A short single-line teaser for the template list, derived from the body instead of stored separately. */
export function previewOf(body: string, maxLength = 70): string {
  const flattened = body.replace(/\*/g, '').replace(/\s*\n\s*/g, ' · ').trim()
  return flattened.length > maxLength ? `${flattened.slice(0, maxLength - 1)}…` : flattened
}

/** Fills {empresa_*} tokens from company settings and the rest from user-provided values; missing values render as empty, never leaking the raw {token}. */
export function renderTemplateBody(
  body: string,
  values: Record<string, string>,
  company: CompanyData,
): string {
  return body.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const fixedField = FIXED_COMPANY_TOKENS[name]
    if (fixedField) return company[fixedField] ?? ''
    const customField = company.customFields.find((field) => `empresa_${field.id}` === name)
    if (customField) return customField.value ?? ''
    return values[name] ?? ''
  })
}

/** Merges the built-in templates (with any saved overrides applied) with the user's custom templates. */
export function getAllTemplates(): TemplateDefinition[] {
  const overrides = loadTemplateOverrides()
  const customs = loadCustomTemplates()
  const builtins = builtInTemplates.map((template) => {
    const override = overrides[template.id]
    return override ? { ...template, ...override } : template
  })
  return [...builtins, ...customs]
}

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return getAllTemplates().find((t) => t.id === id)
}

function generateTemplateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `custom-${crypto.randomUUID()}`
  }
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createTemplateDraft(content: TemplateContent): TemplateDefinition {
  return { id: generateTemplateId(), isCustom: true, ...content }
}

export function duplicateTemplate(template: TemplateDefinition): TemplateDefinition {
  return {
    ...template,
    id: generateTemplateId(),
    name: `${template.name} (copia)`,
    isCustom: true,
  }
}
