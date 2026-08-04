import { Briefcase, Building2, ChevronRight, UsersRound, X } from 'lucide-react'
import { GlassPanel } from './GlassPanel'

interface CalendarManagePanelProps {
  onOpenClients: () => void
  onOpenProjects: () => void
  onOpenTeam: () => void
  onClose: () => void
}

export function CalendarManagePanel({ onOpenClients, onOpenProjects, onOpenTeam, onClose }: CalendarManagePanelProps) {
  const rows = [
    { label: 'Clientes', icon: Building2, onClick: onOpenClients },
    { label: 'Proyectos', icon: Briefcase, onClick: onOpenProjects },
    { label: 'Equipo', icon: UsersRound, onClick: onOpenTeam },
  ]

  return (
    <GlassPanel ariaLabel="Gestionar" widthClassName="w-[85%] max-w-xs">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Gestionar</h2>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-1.5">
        {rows.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="focus-ring glass-subtle flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:brightness-110"
          >
            <Icon size={18} className="text-text-secondary" />
            <span className="flex-1 text-sm font-semibold text-text-primary">{label}</span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        ))}
      </div>
    </GlassPanel>
  )
}
