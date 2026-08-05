import logoTjf from '../assets/logo-tjf.png'
import { GoogleIcon } from './GoogleIcon'
import { BorderBeam } from './BorderBeam'

interface LoginScreenProps {
  onSignIn: () => void
  loading: boolean
  error: string | null
}

export function LoginScreen({ onSignIn, loading, error }: LoginScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-background)] px-6 transition-colors">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-jungle/30 blur-3xl dark:bg-jungle-light/10" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-jungle-light/30 blur-3xl dark:bg-jungle/15" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-jungle-pale/40 blur-3xl dark:bg-jungle-deep/40" />

      <div className="glass-strong relative flex w-full max-w-xs flex-col items-center gap-4 overflow-hidden rounded-panel p-6 text-center shadow-[var(--shadow-4)]">
        <BorderBeam radiusClassName="rounded-panel" />
        <img src={logoTjf} alt="The Jungle Films" className="relative h-14 w-auto rounded-xl object-contain" />

        <div className="relative">
          <p className="text-[11px] font-bold tracking-[0.16em] text-text-secondary">TEMPLATES</p>
        </div>

        <p className="relative text-xs text-text-secondary">
          Inicia sesión con tu correo de Google para ver los templates y colaboradores del equipo.
        </p>

        <button
          type="button"
          onClick={onSignIn}
          disabled={loading}
          className="focus-ring relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#1f1f1f] shadow-md transition hover:brightness-95 disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? 'Conectando…' : 'Iniciar sesión con Google'}
        </button>

        {error && <p className="relative text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    </div>
  )
}
