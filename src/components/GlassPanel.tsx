import type { ReactNode } from 'react'
import { BorderBeam } from './BorderBeam'

interface GlassPanelProps {
  ariaLabel: string
  widthClassName?: string
  children: ReactNode
}

/** Frosted-glass dialog shell shared by the modals: translucent card, blur, and a glossy top highlight. */
export function GlassPanel({ ariaLabel, widthClassName = 'w-[90%]', children }: GlassPanelProps) {
  return (
    <div
      role="dialog"
      aria-label={ariaLabel}
      className="animate-backdrop-in fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-md"
    >
      <div
        className={`glass-strong animate-panel-in relative flex max-h-[70vh] ${widthClassName} flex-col overflow-hidden rounded-panel shadow-[var(--shadow-4)]`}
      >
        <BorderBeam radiusClassName="rounded-panel" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-panel bg-gradient-to-b from-white/40 via-white/5 to-transparent dark:from-white/10" />
        <div className="relative flex flex-1 flex-col overflow-hidden p-4">{children}</div>
      </div>
    </div>
  )
}
