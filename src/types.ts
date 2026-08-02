export interface CompanyData {
  ruc: string
  email: string
  phone: string
  instagram: string
  website: string
  banco: string
  contactos: string
}

export interface Position {
  x: number
  y: number
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
