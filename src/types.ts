/**
 * A user-defined company field (e.g. Instagram, Banco, Horario de Atención).
 * `id` is generated once from the label when the field is created and never
 * changes afterward — it's what templates reference as {empresa_<id>}, so a
 * later rename of `label` doesn't break templates that already use it.
 */
export interface CompanyField {
  id: string
  label: string
  value: string
}

export interface CompanyData {
  /** RUC, email and phone stay fixed fields (not custom) because they have format-specific validation. */
  ruc: string
  email: string
  phone: string
  customFields: CompanyField[]
}

/** Who last saved a shared (cloud-synced) piece of data, and when — shown as a small caption in the UI. */
export interface Attribution {
  name: string
  email: string
  updatedAt: string
}

/**
 * A template is plain data (name/emoji/category + a text body with {variable}
 * placeholders) so it can be created, edited, duplicated, and stored — no
 * per-template code required. `isCustom` distinguishes user-created templates
 * (deletable) from the original 8 (only editable/resettable, never deletable).
 * `updatedBy` is only present for custom templates and built-in overrides —
 * both live in Firestore; the unmodified built-ins never have one.
 */
export interface TemplateDefinition {
  id: string
  name: string
  emoji: string
  category: string
  body: string
  isCustom: boolean
  updatedBy?: Attribution
}

/** The editable fields of a TemplateDefinition, used for create/edit forms and stored overrides. */
export type TemplateContent = Pick<TemplateDefinition, 'name' | 'emoji' | 'category' | 'body'>

export interface HistoryEntry {
  templateId: string
  copiedAt: string
  renderedText: string
}

/** A user-defined field on a Collaborator (e.g. Instagram, Banco) — same shape/purpose as CompanyField. */
export interface CollaboratorField {
  id: string
  label: string
  value: string
}

/** A contact card for someone the studio works with, kept for quick lookup and copy-paste (not a template token source). */
export interface Collaborator {
  id: string
  name: string
  role: string
  phone: string
  dni: string
  /** Data URL from the photo picker, or null if none was set. */
  photo: string | null
  customFields: CollaboratorField[]
  updatedBy?: Attribution
}

/** The editable fields of a Collaborator, used for the create/edit form. */
export type CollaboratorContent = Omit<Collaborator, 'id' | 'updatedBy'>

/** A customer of the studio. Simple list per docs/25-mvp.md — no billing/invoicing fields yet. */
export interface Client {
  id: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
  updatedBy?: Attribution
}

export type ClientContent = Omit<Client, 'id' | 'updatedBy'>

export type ProjectStatus = 'prospecto' | 'en_curso' | 'entregado' | 'cerrado'

/** Minimal context container for events — full project management is Fase 2 (see docs/20-data-model.md). */
export interface Project {
  id: string
  clientId: string | null
  name: string
  status: ProjectStatus
  updatedBy?: Attribution
}

export type ProjectContent = Omit<Project, 'id' | 'updatedBy'>

/**
 * The team roster assignable to calendar events. Named `Person`/`people` at the data
 * level (matches docs/20-data-model.md), shown as "Equipo" in the UI per ADR-006 —
 * kept distinct from the "Personas" screen, which manages who can sign in.
 */
export interface Person {
  id: string
  name: string
  roleLabel: string
  isExternal: boolean
  contactInfo: string
  updatedBy?: Attribution
}

export type PersonContent = Omit<Person, 'id' | 'updatedBy'>

export type EventType = 'grabacion' | 'reunion' | 'entrega' | 'bloqueo'
export type EventStatus = 'confirmado' | 'tentativo' | 'cancelado'

/** A production calendar event — the core of docs/05-calendar-system.md. */
export interface CalendarEvent {
  id: string
  type: EventType
  title: string
  clientId: string | null
  projectId: string | null
  /** ISO datetime strings (local wall-clock time serialized via toISOString-shaped input, not UTC-shifted). */
  startAt: string
  endAt: string
  locationText: string
  personIds: string[]
  notes: string
  /** Cancelling never deletes the event — it flips to 'cancelado' and stays visible, styled differently (undoable). */
  status: EventStatus
  updatedBy?: Attribution
}

export type CalendarEventContent = Omit<CalendarEvent, 'id' | 'updatedBy'>

/** A comment on an event — replaces ad-hoc WhatsApp messages about a specific booking. */
export interface EventComment {
  id: string
  eventId: string
  authorName: string
  authorEmail: string
  text: string
  createdAt: string
}

/** A person allowed to sign in, stored in Firestore keyed by lowercased email. */
export interface AuthorizedUser {
  email: string
  /** Filled in from their Google profile the first time they actually sign in; blank if only pre-authorized. */
  name: string
  photoURL: string | null
  addedAt: string
  lastLoginAt: string | null
}

/** Which section of the 'list' view is showing — navigated from the bottom tab bar. */
export type SectionTab = 'templates' | 'collabs'
