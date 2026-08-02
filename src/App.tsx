import { useState } from 'react'
import { Monitor, Moon, Settings, Sun } from 'lucide-react'
import { FloatingButton } from './components/FloatingButton'
import { TemplateListModal } from './components/TemplateListModal'
import { TemplateDetailView } from './components/TemplateDetailView'
import { TemplateEditor } from './components/TemplateEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { createTemplateDraft, duplicateTemplate, getAllTemplates } from './lib/templates'
import {
  clearTemplateOverride,
  deleteCustomTemplate,
  loadCompanyData,
  loadFavorites,
  loadTemplateOverrides,
  pushHistory,
  saveCompanyData,
  saveFavorites,
  setTemplateOverride,
  toggleFavorite,
  upsertCustomTemplate,
} from './lib/storage'
import { nextThemePreference, useTheme } from './lib/theme'
import type { CompanyData, TemplateContent, TemplateDefinition } from './types'

type View = 'closed' | 'list' | 'detail' | 'settings' | 'editor'

const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const
const THEME_LABEL = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' } as const

export default function App() {
  const [view, setView] = useState<View>('closed')
  const [templates, setTemplates] = useState<TemplateDefinition[]>(() => getAllTemplates())
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDefinition | null>(null)
  const [company, setCompany] = useState<CompanyData>(() => loadCompanyData())
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const [themePreference, setThemePreference] = useTheme()
  const ThemeIcon = THEME_ICON[themePreference]

  const canResetEditingTemplate =
    editingTemplate !== null && !editingTemplate.isCustom && editingTemplate.id in loadTemplateOverrides()

  function refreshTemplates() {
    setTemplates(getAllTemplates())
  }

  function handleToggleFavorite(templateId: string) {
    setFavorites(toggleFavorite(templateId))
  }

  function handleSaveCompany(data: CompanyData) {
    setCompany(data)
    saveCompanyData(data)
  }

  function handleCopied(renderedText: string) {
    if (selectedTemplate) {
      pushHistory({ templateId: selectedTemplate.id, copiedAt: new Date().toISOString(), renderedText })
    }
  }

  function handleCreateTemplate() {
    setEditingTemplate(null)
    setView('editor')
  }

  function handleEditTemplate(template: TemplateDefinition) {
    setEditingTemplate(template)
    setView('editor')
  }

  function handleSaveTemplate(content: TemplateContent) {
    if (!editingTemplate) {
      upsertCustomTemplate(createTemplateDraft(content))
    } else if (editingTemplate.isCustom) {
      upsertCustomTemplate({ ...editingTemplate, ...content })
    } else {
      setTemplateOverride(editingTemplate.id, content)
    }
    refreshTemplates()
    setView('list')
  }

  function handleDuplicateTemplate() {
    if (!editingTemplate) return
    upsertCustomTemplate(duplicateTemplate(editingTemplate))
    refreshTemplates()
    setView('list')
  }

  function handleDeleteTemplate() {
    if (!editingTemplate) return
    deleteCustomTemplate(editingTemplate.id)
    setFavorites(saveFavoritesWithout(editingTemplate.id))
    refreshTemplates()
    setView('list')
  }

  function saveFavoritesWithout(templateId: string): string[] {
    const next = favorites.filter((id) => id !== templateId)
    saveFavorites(next)
    return next
  }

  function handleResetTemplate() {
    if (!editingTemplate) return
    clearTemplateOverride(editingTemplate.id)
    refreshTemplates()
    setView('list')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background)] transition-colors">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-jungle/30 blur-3xl dark:bg-jungle/20" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/10" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -bottom-16 right-1/4 h-72 w-72 rounded-full bg-jungle-dark/20 blur-3xl dark:bg-jungle-dark/20" />

      <div className="glass-strong fixed left-4 top-4 z-50 flex items-center gap-2 overflow-hidden rounded-full py-1.5 pl-1.5 pr-3 shadow-[var(--shadow-2)]">
        <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle to-jungle-dark text-[10px] font-bold tracking-wide text-white">
          <span className="pointer-events-none absolute inset-x-0.5 top-0.5 h-3 rounded-full bg-white/50 blur-[1px]" />
          <span className="relative">TJF</span>
        </span>
        <span className="text-xs font-semibold tracking-wide text-text-primary">THE JUNGLE FILMS</span>
      </div>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Tema: ${THEME_LABEL[themePreference]}. Tocar para cambiar.`}
          onClick={() => setThemePreference(nextThemePreference(themePreference))}
          className="glass-strong focus-ring tap-target flex items-center justify-center rounded-full text-text-primary shadow-[var(--shadow-2)] transition hover:brightness-110"
        >
          <ThemeIcon size={20} />
        </button>
        <button
          type="button"
          aria-label="Configuración"
          onClick={() => setView('settings')}
          className="glass-strong focus-ring tap-target flex items-center justify-center rounded-full text-text-primary shadow-[var(--shadow-2)] transition hover:brightness-110"
        >
          <Settings size={20} />
        </button>
      </div>

      <FloatingButton onOpen={() => setView('list')} />

      {view === 'list' && (
        <TemplateListModal
          templates={templates}
          favorites={favorites}
          onSelect={(template) => {
            setSelectedTemplate(template)
            setView('detail')
          }}
          onToggleFavorite={handleToggleFavorite}
          onCreate={handleCreateTemplate}
          onEdit={handleEditTemplate}
          onClose={() => setView('closed')}
        />
      )}

      {view === 'detail' && selectedTemplate && (
        <TemplateDetailView
          template={selectedTemplate}
          company={company}
          onBack={() => setView('list')}
          onCopied={handleCopied}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel company={company} onSave={handleSaveCompany} onClose={() => setView('closed')} />
      )}

      {view === 'editor' && (
        <TemplateEditor
          template={editingTemplate}
          canReset={canResetEditingTemplate}
          onSave={handleSaveTemplate}
          onDuplicate={handleDuplicateTemplate}
          onDelete={handleDeleteTemplate}
          onReset={handleResetTemplate}
          onClose={() => setView('list')}
        />
      )}
    </div>
  )
}
