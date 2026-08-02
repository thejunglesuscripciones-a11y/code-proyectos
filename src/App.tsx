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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-100 to-teal-200">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-jungle/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-1/4 h-72 w-72 rounded-full bg-jungle-dark/30 blur-3xl" />

      <div className="fixed left-4 top-4 z-50 flex items-center gap-2 overflow-hidden rounded-full border border-white/50 bg-white/25 py-1.5 pl-1.5 pr-3 shadow-lg shadow-black/10 backdrop-blur-xl">
        <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle to-jungle-dark text-[10px] font-bold tracking-wide text-white">
          <span className="pointer-events-none absolute inset-x-0.5 top-0.5 h-3 rounded-full bg-white/50 blur-[1px]" />
          <span className="relative">TJF</span>
        </span>
        <span className="text-xs font-semibold tracking-wide text-gray-800">THE JUNGLE FILMS</span>
      </div>

      <button
        type="button"
        aria-label="Configuración"
        onClick={() => setView('settings')}
        className="fixed right-4 top-4 z-50 rounded-full border border-white/50 bg-white/25 p-2.5 shadow-lg shadow-black/10 backdrop-blur-xl transition hover:bg-white/40"
      >
        <Settings size={20} className="text-gray-800" />
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
