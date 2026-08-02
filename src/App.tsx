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
    <div className="min-h-screen bg-gray-50">
      <button
        type="button"
        aria-label="Configuración"
        onClick={() => setView('settings')}
        className="fixed right-4 top-4 z-50 rounded-full bg-white p-2 shadow"
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
