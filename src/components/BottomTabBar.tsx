import { useEffect, useLayoutEffect, useRef } from 'react'
import { Calendar, LayoutGrid, Users } from 'lucide-react'

export type BottomTab = 'calendario' | 'plantillas' | 'equipo'

interface BottomTabBarProps {
  active: BottomTab
  onSelect: (tab: BottomTab) => void
}

const TABS: { key: BottomTab; label: string; Icon: typeof Calendar }[] = [
  { key: 'calendario', label: 'Calendario', Icon: Calendar },
  { key: 'plantillas', label: 'Plantillas', Icon: LayoutGrid },
  { key: 'equipo', label: 'Equipo', Icon: Users },
]

// Inset from each tab's edge so the lens never pokes out past the bar's
// rounded ends on the first/last tab. Checkpoint 4.1 (bumped from 5px).
const LENS_MARGIN = 14
// Web Animations API durations/easings — lifted verbatim from
// tabbar-motion-CHECKPOINT-4-FINAL.html (speed 1.5x -> 300ms base).
const MOVE_DURATION = 300
const BRIDGE_EASING = 'cubic-bezier(0.3, 0, 0.4, 1)'
const ICON_PULSE_EASING = 'cubic-bezier(0.22, 1.15, 0.36, 1)' // --ease-spring, used only here

interface Rect {
  left: number
  width: number
}

/**
 * Persistent bottom navigation. A chromatic-aberration glass "lens" bridges
 * between tabs on tap (stretch to cover both, snap to the destination width,
 * settle with a 3-step decaying wobble), then the destination icon flashes
 * brighter as the lens arrives. Ported from the approved reference in
 * docs/31-tabbar-motion-spec.md (Checkpoint 5).
 */
export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const lensRef = useRef<HTMLDivElement | null>(null)
  const prevActive = useRef<BottomTab>(active)

  function tabRect(index: number): Rect | null {
    const bar = barRef.current
    const tab = tabRefs.current[index]
    if (!bar || !tab) return null
    const barBox = bar.getBoundingClientRect()
    const tabBox = tab.getBoundingClientRect()
    return { left: tabBox.left - barBox.left + LENS_MARGIN, width: tabBox.width - LENS_MARGIN * 2 }
  }

  function placeLensInstantly() {
    const lens = lensRef.current
    const rect = tabRect(TABS.findIndex((t) => t.key === active))
    if (!lens || !rect) return
    lens.style.left = `${rect.left}px`
    lens.style.width = `${rect.width}px`
  }

  useLayoutEffect(() => {
    placeLensInstantly()
    window.addEventListener('resize', placeLensInstantly)
    return () => window.removeEventListener('resize', placeLensInstantly)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fromKey = prevActive.current
    prevActive.current = active
    if (fromKey === active) return

    const from = tabRect(TABS.findIndex((t) => t.key === fromKey))
    const toIndex = TABS.findIndex((t) => t.key === active)
    const to = tabRect(toIndex)
    const lens = lensRef.current
    if (!from || !to || !lens) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // jsdom (our test environment) doesn't implement the Web Animations API —
    // fall back to an instant jump so tests don't crash on lens.animate().
    if (reduced || typeof lens.animate !== 'function') {
      lens.style.left = `${to.left}px`
      lens.style.width = `${to.width}px`
      return
    }

    const bridgeLeft = Math.min(from.left, to.left)
    const bridgeRight = Math.max(from.left + from.width, to.left + to.width)
    const bridgeWidth = bridgeRight - bridgeLeft
    const { left: l, width: w } = to

    lens.animate(
      [
        { left: `${from.left}px`, width: `${from.width}px`, offset: 0 },
        { left: `${bridgeLeft}px`, width: `${bridgeWidth}px`, offset: 0.36, easing: BRIDGE_EASING },
        { left: `${l}px`, width: `${w}px`, offset: 0.6 },
        { left: `${l - 3}px`, width: `${w + 6}px`, offset: 0.72 },
        { left: `${l + 1.5}px`, width: `${w - 3}px`, offset: 0.83 },
        { left: `${l - 0.6}px`, width: `${w + 1.2}px`, offset: 0.92 },
        { left: `${l}px`, width: `${w}px`, offset: 1 },
      ],
      { duration: MOVE_DURATION, easing: 'ease-out', fill: 'forwards' },
    )
    lens.style.left = `${l}px`
    lens.style.width = `${w}px`

    const icon = tabRefs.current[toIndex]?.querySelector<HTMLElement>('svg')
    if (icon && typeof icon.animate === 'function') {
      const timer = setTimeout(() => {
        icon.animate(
          [
            {
              filter: 'drop-shadow(0 0 0px rgba(255,255,255,0)) drop-shadow(0 0 0px rgba(255,255,255,0))',
              transform: 'translateY(-1px) scale(1.08)',
              offset: 0,
            },
            {
              filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.95)) drop-shadow(0 0 14px rgba(218,241,222,0.6))',
              transform: 'translateY(-2px) scale(1.22)',
              offset: 0.3,
            },
            {
              filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.35)) drop-shadow(0 0 5px rgba(218,241,222,0.25))',
              transform: 'translateY(-1px) scale(1.08)',
              offset: 1,
            },
          ],
          { duration: 520, easing: ICON_PULSE_EASING },
        )
      }, MOVE_DURATION * 0.55)
      return () => clearTimeout(timer)
    }
  }, [active])

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      aria-label="Navegación principal"
    >
      <div ref={barRef} className="tabbar relative flex w-full max-w-xs items-center">
        <div ref={lensRef} className="lens" />
        <div className="tabs relative z-[2] flex h-full w-full">
          {TABS.map(({ key, label, Icon }, i) => (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => onSelect(key)}
              className={`tab focus-ring flex h-full flex-1 flex-col items-center justify-center rounded-2xl border-none bg-transparent py-2 text-[10px] font-semibold ${
                active === key ? 'active' : ''
              }`}
            >
              <span className="glow-halo" />
              <Icon size={16} />
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
