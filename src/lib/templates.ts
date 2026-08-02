import type { TemplateDefinition } from '../types'
import { renderProgressBar } from './validators'

/** Replaces {var} placeholders; missing variables render as an empty string, never leaking the raw token. */
function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? '')
}

export const templates: TemplateDefinition[] = [
  {
    id: 'info-empresa',
    name: 'Información de Empresa',
    emoji: '📋',
    category: 'Comercial',
    preview: 'Datos de contacto y redes de The Jungle Films.',
    variables: [],
    render: (_values, company) =>
      [
        '*The Jungle Films* 🎬',
        '━━━━━━━━━━━━━━',
        `RUT: ${company.rut}`,
        `Email: ${company.email}`,
        `Teléfono: ${company.phone}`,
        `Instagram: ${company.instagram}`,
        `Web: ${company.website}`,
      ].join('\n'),
  },
  {
    id: 'brief-proyecto',
    name: 'Crear Brief de Proyecto',
    emoji: '🎬',
    category: 'Comercial',
    preview: 'Confirma cliente, tipo, fecha de entrega y presupuesto.',
    variables: ['cliente', 'tipo', 'fecha_entrega', 'presupuesto', 'descripcion', 'prioridad'],
    render: (values) =>
      [
        `*Brief de Proyecto* ${values.prioridad === 'URGENTE' ? '🔴 URGENTE' : ''}`.trim(),
        `Cliente: ${fill('{cliente}', values)}`,
        `Tipo: ${fill('{tipo}', values)}`,
        `Fecha de entrega: ${fill('{fecha_entrega}', values)}`,
        `Presupuesto: ${fill('{presupuesto}', values)}`,
        `Descripción: ${fill('{descripcion}', values)}`,
      ].join('\n'),
  },
  {
    id: 'cotizacion',
    name: 'Solicitar Cotización',
    emoji: '💰',
    category: 'Comercial',
    preview: 'Tipo de trabajo, fecha necesaria y contacto.',
    variables: ['tipo_trabajo', 'fecha_necesaria', 'descripcion', 'contacto', 'referencias'],
    render: (values) =>
      [
        '*Solicitud de Cotización*',
        `Tipo de trabajo: ${fill('{tipo_trabajo}', values)}`,
        `Fecha necesaria: ${fill('{fecha_necesaria}', values)}`,
        `Descripción: ${fill('{descripcion}', values)}`,
        `Contacto: ${fill('{contacto}', values)}`,
        values.referencias ? `Referencias previas: ${values.referencias}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
  },
  {
    id: 'recordatorio-pago',
    name: 'Recordatorio de Pago Pendiente',
    emoji: '💳',
    category: 'Administrativo',
    preview: 'Recuerda un pago pendiente con datos de transferencia.',
    variables: ['monto', 'vencimiento', 'tono'],
    render: (values, company) => {
      const intros: Record<string, string> = {
        friendly: 'Hola, este es un recordatorio amistoso sobre tu pago pendiente 😊',
        formal: 'Le escribimos para recordarle que tiene un pago pendiente.',
        urgente: '⚠️ Este es un recordatorio urgente: su pago se encuentra vencido.',
      }
      const intro = intros[values.tono] ?? intros.friendly
      return [
        intro,
        `Monto: ${fill('{monto}', values)}`,
        `Cuenta: ${company.banco}`,
        `Vencimiento: ${fill('{vencimiento}', values)}`,
      ].join('\n')
    },
  },
  {
    id: 'confirmacion-entrega',
    name: 'Proyecto Completado - Entrega',
    emoji: '✅',
    category: 'Comercial',
    preview: 'Notifica que el proyecto está listo con link de descarga.',
    variables: ['link_descarga', 'password', 'dias_disponible'],
    render: (values) =>
      [
        '¡Tu proyecto está listo! 🎉',
        `Link de descarga: ${fill('{link_descarga}', values)}`,
        `Contraseña: ${fill('{password}', values)}`,
        `Disponible por: ${fill('{dias_disponible}', values)} días`,
        'Gracias por confiar en The Jungle Films 🎬',
      ].join('\n'),
  },
  {
    id: 'solicitar-revisiones',
    name: 'Solicitud de Revisiones Recibida',
    emoji: '📝',
    category: 'Comercial',
    preview: 'Confirma que se recibieron los cambios solicitados.',
    variables: ['tipo_revision'],
    render: (values) => {
      const tiempos: Record<string, string> = {
        menor: '24 horas',
        mayor: '48 horas',
        restructuracion: '3-5 días',
      }
      const tiempo = tiempos[values.tipo_revision] ?? tiempos.menor
      return [
        'Hemos recibido tu solicitud de revisiones ✏️',
        `Tiempo estimado: ${tiempo}`,
        'Te avisaremos apenas esté listo.',
      ].join('\n')
    },
  },
  {
    id: 'agendar-reunion',
    name: 'Agendar Reunión/Videollamada',
    emoji: '📅',
    category: 'Reportes',
    preview: 'Propone 3 opciones de fecha y hora para reunirse.',
    variables: ['fecha1', 'hora1', 'fecha2', 'hora2', 'fecha3', 'hora3', 'link_reunion'],
    render: (values) =>
      [
        '¿Agendamos una reunión? 📅',
        `Opción 1: ${fill('{fecha1}', values)} ${fill('{hora1}', values)}`,
        `Opción 2: ${fill('{fecha2}', values)} ${fill('{hora2}', values)}`,
        `Opción 3: ${fill('{fecha3}', values)} ${fill('{hora3}', values)}`,
        `Link: ${fill('{link_reunion}', values)}`,
      ].join('\n'),
  },
  {
    id: 'estado-proyecto',
    name: 'Actualización de Estado del Proyecto',
    emoji: '📊',
    category: 'Reportes',
    preview: 'Avance por etapa con barra visual de progreso.',
    variables: ['etapa1_pct', 'etapa2_pct', 'etapa3_pct', 'etapa4_pct'],
    render: (values) => {
      const etapa = (label: string, key: string) => {
        const pct = Number(values[key] ?? 0)
        return `${label}: ${renderProgressBar(pct)} ${pct}%`
      }
      return [
        '*Estado del Proyecto* 📊',
        etapa('Conceptualización', 'etapa1_pct'),
        etapa('Pre-producción', 'etapa2_pct'),
        etapa('Producción', 'etapa3_pct'),
        etapa('Post-producción', 'etapa4_pct'),
      ].join('\n')
    },
  },
]

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id)
}
