import type { CSSProperties, ReactNode } from 'react'

interface GlassPanelProps {
  ariaLabel: string
  widthClassName?: string
  children: ReactNode
}

/**
 * The moving glow is a conic-gradient ring, masked down to just the border
 * (content-box vs border-box XOR trick) so only a thin traveling highlight shows,
 * not a filled disc. --border-angle is animated once around by the border-beam
 * keyframes in tailwind.config.js, then stops back where it started.
 */
const beamStyle: CSSProperties & Record<string, string> = {
  padding: '1.5px',
  background:
    'conic-gradient(from var(--border-angle), transparent 0%, transparent 55%, rgba(255,255,255,0.95) 66%, rgba(142,182,155,0.85) 74%, transparent 85%)',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
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
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-panel animate-border-beam" style={beamStyle} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-panel bg-gradient-to-b from-white/40 via-white/5 to-transparent dark:from-white/10" />
        <div className="relative flex flex-1 flex-col overflow-hidden p-4">{children}</div>
      </div>
    </div>
  )
}
