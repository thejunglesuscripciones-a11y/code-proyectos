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

export interface TemplateDefinition {
  id: string
  name: string
  emoji: string
  category: string
  preview: string
  variables: string[]
  render: (values: Record<string, string>, company: CompanyData) => string
}

export interface HistoryEntry {
  templateId: string
  copiedAt: string
  renderedText: string
}
