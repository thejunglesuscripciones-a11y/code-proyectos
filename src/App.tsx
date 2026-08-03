import { useEffect, useState } from 'react'
import { Monitor, Moon, Settings, Sun, Users } from 'lucide-react'
import { BorderBeam } from './components/BorderBeam'
import { TemplateListModal } from './components/TemplateListModal'
import { TemplateDetailView } from './components/TemplateDetailView'
import { TemplateEditor } from './components/TemplateEditor'
import { CollaboratorsPanel } from './components/CollaboratorsPanel'
import { CollaboratorDetail } from './components/CollaboratorDetail'
import { CollaboratorEditor } from './components/CollaboratorEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { LoginScreen } from './components/LoginScreen'
import { UnauthorizedScreen } from './components/UnauthorizedScreen'
import { UsersPanel } from './components/UsersPanel'
import type { SectionTab } from './components/TabBar'
import { createTemplateDraft, duplicateTemplate, getAllTemplates } from './lib/templates'
import { createCollaboratorDraft } from './lib/collaborators'
import { type User, signInWithGoogle, signOutUser, subscribeToAuthUser } from './lib/auth'
import {
  addAuthorizedUser,
  isAuthorizedEmail,
  recordLogin,
  removeAuthorizedUser,
  subscribeAuthorizedUsers,
} from './lib/authorizedUsers'
import {
  clearTemplateOverride,
  deleteCollaborator,
  deleteCustomTemplate,
  loadCollaborators,
  loadCompanyData,
  loadFavorites,
  loadTemplateOverrides,
  pushHistory,
  saveCompanyData,
  saveFavorites,
  setTemplateOverride,
  toggleFavorite,
  upsertCollaborator,
  upsertCustomTemplate,
} from './lib/storage'
import { nextThemePreference, useTheme } from './lib/theme'
import type {
  AuthorizedUser,
  Collaborator,
  CollaboratorContent,
  CompanyData,
  TemplateContent,
  TemplateDefinition,
} from './types'

type View = 'list' | 'detail' | 'settings' | 'editor' | 'collab-detail' | 'collab-editor' | 'users'

const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const
const THEME_LABEL = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' } as const

export default function App() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [authorizedUsersList, setAuthorizedUsersList] = useState<AuthorizedUser[]>([])

  const [view, setView] = useState<View>('list')
  const [tab, setTab] = useState<SectionTab>('templates')
  const [templates, setTemplates] = useState<TemplateDefinition[]>(() => getAllTemplates())
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDefinition | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => loadCollaborators())
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  const [company, setCompany] = useState<CompanyData>(() => loadCompanyData())
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const [themePreference, setThemePreference] = useTheme()
  const ThemeIcon = THEME_ICON[themePreference]

  useEffect(() => subscribeToAuthUser(setAuthUser), [])

  useEffect(() => {
    if (!authUser?.email) {
      setAuthorized(null)
      return
    }
    const email = authUser.email
    let cancelled = false
    isAuthorizedEmail(email).then((ok) => {
      if (cancelled) return
      setAuthorized(ok)
      if (ok) {
        recordLogin({ email, name: authUser.displayName ?? '', photoURL: authUser.photoURL })
      }
    })
    return () => {
      cancelled = true
    }
  }, [authUser])

  useEffect(() => {
    if (!authUser) return
    return subscribeAuthorizedUsers(setAuthorizedUsersList)
  }, [authUser])

  async function handleSignIn() {
    setSignInLoading(true)
    setSignInError(null)
    try {
      await signInWithGoogle()
    } catch {
      setSignInError('No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setSignInLoading(false)
    }
  }

  async function handleSignOut() {
    await signOutUser()
    setView('list')
  }

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

  function handleBackupImported() {
    setCompany(loadCompanyData())
    setFavorites(loadFavorites())
    refreshTemplates()
    setCollaborators(loadCollaborators())
  }

  function refreshCollaborators() {
    setCollaborators(loadCollaborators())
  }

  function handleSelectCollaborator(collaborator: Collaborator) {
    setSelectedCollaborator(collaborator)
    setView('collab-detail')
  }

  function handleCreateCollaborator() {
    setEditingCollaborator(null)
    setView('collab-editor')
  }

  function handleEditCollaborator() {
    if (!selectedCollaborator) return
    setEditingCollaborator(selectedCollaborator)
    setView('collab-editor')
  }

  function handleSaveCollaborator(content: CollaboratorContent) {
    const saved = editingCollaborator ? { ...editingCollaborator, ...content } : createCollaboratorDraft(content)
    upsertCollaborator(saved)
    refreshCollaborators()
    setView('list')
  }

  function handleDeleteCollaborator() {
    if (!selectedCollaborator) return
    deleteCollaborator(selectedCollaborator.id)
    refreshCollaborators()
    setSelectedCollaborator(null)
    setView('list')
  }

  if (authUser === undefined || (authUser && authorized === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] text-sm text-text-secondary">
        Cargando…
      </div>
    )
  }

  if (!authUser) {
    return <LoginScreen onSignIn={handleSignIn} loading={signInLoading} error={signInError} />
  }

  if (!authorized) {
    return <UnauthorizedScreen email={authUser.email ?? ''} onSignOut={handleSignOut} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background)] transition-colors">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-jungle/30 blur-3xl dark:bg-jungle-light/10" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-jungle-light/30 blur-3xl dark:bg-jungle/15" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-jungle-pale/40 blur-3xl dark:bg-jungle-deep/40" />
      <div className="pointer-events-none absolute -bottom-16 right-1/4 h-72 w-72 rounded-full bg-jungle-dark/20 blur-3xl dark:bg-jungle-dark/25" />

      <div className="glass-strong fixed left-4 top-4 z-50 flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl px-3 py-2 shadow-[var(--shadow-2)]">
        <BorderBeam radiusClassName="rounded-2xl" />
        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle to-jungle-dark text-[10px] font-bold tracking-wide text-white">
          <span className="pointer-events-none absolute inset-x-0.5 top-0.5 h-3 rounded-full bg-white/50 blur-[1px]" />
          <span className="relative">TJF</span>
        </span>
        <span className="relative text-center leading-tight">
          <span className="block text-[11px] font-semibold text-text-primary">The jungle films</span>
          <span className="block text-[9px] font-bold tracking-[0.16em] text-text-secondary">TEMPLATES</span>
        </span>
      </div>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Tema: ${THEME_LABEL[themePreference]}. Tocar para cambiar.`}
          onClick={() => setThemePreference(nextThemePreference(themePreference))}
          className="glass-strong focus-ring tap-target relative flex items-center justify-center overflow-hidden rounded-full text-text-primary shadow-[var(--shadow-2)] transition hover:brightness-110"
        >
          <BorderBeam radiusClassName="rounded-full" />
          <ThemeIcon size={20} className="relative" />
        </button>
        <button
          type="button"
          aria-label="Personas"
          onClick={() => setView('users')}
          className="glass-strong focus-ring tap-target relative flex items-center justify-center overflow-hidden rounded-full text-text-primary shadow-[var(--shadow-2)] transition hover:brightness-110"
        >
          <BorderBeam radiusClassName="rounded-full" />
          <Users size={20} className="relative" />
        </button>
        <button
          type="button"
          aria-label="Configuración"
          onClick={() => setView('settings')}
          className="glass-strong focus-ring tap-target relative flex items-center justify-center overflow-hidden rounded-full text-text-primary shadow-[var(--shadow-2)] transition hover:brightness-110"
        >
          <BorderBeam radiusClassName="rounded-full" />
          <Settings size={20} className="relative" />
        </button>
      </div>

      {view === 'list' && tab === 'templates' && (
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
          onTabChange={setTab}
        />
      )}

      {view === 'list' && tab === 'collabs' && (
        <CollaboratorsPanel
          collaborators={collaborators}
          onSelect={handleSelectCollaborator}
          onCreate={handleCreateCollaborator}
          onTabChange={setTab}
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

      {view === 'collab-detail' && selectedCollaborator && (
        <CollaboratorDetail
          collaborator={selectedCollaborator}
          onBack={() => setView('list')}
          onEdit={handleEditCollaborator}
          onDelete={handleDeleteCollaborator}
        />
      )}

      {view === 'collab-editor' && (
        <CollaboratorEditor collaborator={editingCollaborator} onSave={handleSaveCollaborator} onClose={() => setView('list')} />
      )}

      {view === 'users' && authUser.email && (
        <UsersPanel
          users={authorizedUsersList}
          currentEmail={authUser.email}
          onAdd={addAuthorizedUser}
          onRemove={removeAuthorizedUser}
          onSignOut={handleSignOut}
          onClose={() => setView('list')}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel
          company={company}
          onSave={handleSaveCompany}
          onClose={() => setView('list')}
          onImported={handleBackupImported}
        />
      )}

      {view === 'editor' && (
        <TemplateEditor
          template={editingTemplate}
          company={company}
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
