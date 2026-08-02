import type { CSSProperties } from 'react'

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

interface BorderBeamProps {
  /** Must match the rounding of the element this is layered over (e.g. "rounded-full", "rounded-panel"). */
  radiusClassName?: string
}

/** An animated glass-glow ring; place inside a `relative` container that matches its rounding. */
export function BorderBeam({ radiusClassName = 'rounded-full' }: BorderBeamProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${radiusClassName} animate-border-beam`}
      style={beamStyle}
    />
  )
}
