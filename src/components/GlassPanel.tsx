import type { ReactNode } from 'react'

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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-md"
    >
      <div
        className={`relative flex max-h-[70vh] ${widthClassName} flex-col overflow-hidden rounded-[28px] border border-white/40 bg-white/20 shadow-2xl shadow-black/20 backdrop-blur-2xl`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[28px] bg-gradient-to-b from-white/60 via-white/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/50" />
        <div className="relative flex flex-1 flex-col overflow-hidden p-4">{children}</div>
      </div>
    </div>
  )
}
