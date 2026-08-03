import { BorderBeam } from './BorderBeam'

interface UnauthorizedScreenProps {
  email: string
  onSignOut: () => void
}

export function UnauthorizedScreen({ email, onSignOut }: UnauthorizedScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-background)] px-6 transition-colors">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-jungle/30 blur-3xl dark:bg-jungle-light/10" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-jungle-light/30 blur-3xl dark:bg-jungle/15" />

      <div className="glass-strong relative flex w-full max-w-xs flex-col items-center gap-3 overflow-hidden rounded-panel p-6 text-center shadow-[var(--shadow-4)]">
        <BorderBeam radiusClassName="rounded-panel" />
        <p className="relative text-3xl">🔒</p>
        <p className="relative text-sm font-bold text-text-primary">Sin acceso</p>
        <p className="relative text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">{email}</span> no está autorizado para entrar. Pide a
          alguien del equipo que te agregue desde el panel de Personas.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="focus-ring glass-subtle relative h-11 w-full rounded-xl text-sm font-semibold text-text-primary transition hover:brightness-110"
        >
          Cerrar sesión / probar con otra cuenta
        </button>
      </div>
    </div>
  )
}
