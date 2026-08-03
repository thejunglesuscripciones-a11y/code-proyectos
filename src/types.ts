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

/**
 * A template is plain data (name/emoji/category + a text body with {variable}
 * placeholders) so it can be created, edited, duplicated, and stored in
 * localStorage — no per-template code required. `isCustom` distinguishes
 * user-created templates (deletable) from the original 8 (only editable/
 * resettable, never deletable).
 */
export interface TemplateDefinition {
  id: string
  name: string
  emoji: string
  category: string
  body: string
  isCustom: boolean
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
}

/** The editable fields of a Collaborator, used for the create/edit form. */
export type CollaboratorContent = Omit<Collaborator, 'id'>
