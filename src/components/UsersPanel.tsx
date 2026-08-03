import { useState } from 'react'
import { LogOut, Trash2, UserPlus, X } from 'lucide-react'
import type { AuthorizedUser } from '../types'
import { GlassPanel } from './GlassPanel'

interface UsersPanelProps {
  users: AuthorizedUser[]
  currentEmail: string
  onAdd: (email: string) => void
  onRemove: (email: string) => void
  onSignOut: () => void
  onClose: () => void
}

function initials(name: string, email: string): string {
  const source = name.trim() || email
  return source.slice(0, 2).toUpperCase()
}

export function UsersPanel({ users, currentEmail, onAdd, onRemove, onSignOut, onClose }: UsersPanelProps) {
  const [newEmail, setNewEmail] = useState('')

  function handleAdd() {
    const trimmed = newEmail.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewEmail('')
  }

  return (
    <GlassPanel ariaLabel="Personas" widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Personas</h2>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {users.map((user) => (
          <div key={user.email} className="glass-subtle flex items-center gap-2.5 rounded-xl px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle-light to-jungle text-xs font-bold text-white">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name || user.email} className="h-full w-full object-cover" />
              ) : (
                initials(user.name, user.email)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{user.name || user.email}</p>
              {user.name && <p className="truncate text-[11px] text-text-secondary">{user.email}</p>}
            </div>
            <button
              type="button"
              aria-label={`Quitar acceso a ${user.email}`}
              onClick={() => onRemove(user.email)}
              className="focus-ring tap-target flex items-center justify-center rounded-xl text-[var(--color-error)] transition hover:bg-[var(--color-error)]/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-end gap-1.5 border-t border-separator pt-3">
        <label className="block flex-1 text-xs text-text-secondary">
          Autorizar un correo nuevo
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="correo@gmail.com"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>
        <button
          type="button"
          aria-label="Autorizar correo"
          onClick={handleAdd}
          className="focus-ring tap-target flex items-center justify-center rounded-xl bg-jungle/15 text-jungle-dark transition hover:bg-jungle/25"
        >
          <UserPlus size={18} />
        </button>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="focus-ring mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-error)]/10 text-sm font-semibold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20"
      >
        <LogOut size={16} />
        Cerrar sesión ({currentEmail})
      </button>
    </GlassPanel>
  )
}
