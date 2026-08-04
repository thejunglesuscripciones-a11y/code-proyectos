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

/** A shared calendar entry — either a normal event or a day marked unavailable ("no disponible"). */
export interface CalendarEvent {
  id: string
  /** 'YYYY-MM-DD', local date — the day this event belongs to. */
  date: string
  /** 'HH:MM' from a <input type="time">, or '' for an all-day / unspecified-time entry. */
  time: string
  title: string
  note: string
  /** True marks the whole day as unavailable instead of a normal timed event. */
  blocked: boolean
  updatedBy?: Attribution
}

/** The editable fields of a CalendarEvent, used for the create/edit form. */
export type CalendarEventContent = Omit<CalendarEvent, 'id' | 'updatedBy'>

/** A person allowed to sign in, stored in Firestore keyed by lowercased email. */
export interface AuthorizedUser {
  email: string
  /** Filled in from their Google profile the first time they actually sign in; blank if only pre-authorized. */
  name: string
  photoURL: string | null
  addedAt: string
  lastLoginAt: string | null
}
