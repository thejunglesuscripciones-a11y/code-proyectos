import { useState } from 'react'
import { Settings } from 'lucide-react'
import { FloatingButton } from './components/FloatingButton'
import { TemplateListModal } from './components/TemplateListModal'
import { TemplateDetailView } from './components/TemplateDetailView'
import { SettingsPanel } from './components/SettingsPanel'
import { templates } from './lib/templates'
import { loadCompanyData, loadFavorites, pushHistory, saveCompanyData, toggleFavorite } from './lib/storage'
import type { CompanyData, TemplateDefinition } from './types'

type View = 'closed' | 'list' | 'detail' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('closed')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null)
  const [company, setCompany] = useState<CompanyData>(() => loadCompanyData())
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-emerald-50 to-gray-100">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-jungle/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-jungle-dark/10 blur-3xl" />

      <div className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/50 bg-white/60 py-1.5 pl-1.5 pr-3 shadow-lg shadow-black/5 backdrop-blur-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-jungle to-jungle-dark text-xs font-bold tracking-wide text-white">
          TJF
        </span>
        <span className="text-xs font-semibold text-gray-700">Jungle Films</span>
      </div>

      <button
        type="button"
        aria-label="Configuración"
        onClick={() => setView('settings')}
        className="fixed right-4 top-4 z-50 rounded-full border border-white/50 bg-white/60 p-2.5 shadow-lg shadow-black/5 backdrop-blur-xl transition hover:bg-white/80"
      >
        <Settings size={20} className="text-gray-700" />
      </button>

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
    </div>
  )
}
