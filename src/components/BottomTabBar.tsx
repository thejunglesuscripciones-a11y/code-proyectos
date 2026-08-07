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

  // The lens's CSS box is a fixed left:0/width:100% of the bar (see
  // tabbar.css) — position/size come entirely from the `translate`/`scale`
  // properties set below, never from left/width. That keeps the whole
  // animation on the GPU compositor (skips layout+paint per frame), which
  // is what was dropping frames on mid-range phones before. Using the
  // individual `translate`/`scale` CSS properties instead of a combined
  // `transform: translateX() scaleX()` string matters here: WAAPI
  // interpolates a combined `transform` by decomposing it into a matrix
  // first, which doesn't keep translation and scale independent across
  // keyframes and made the lens jump to its final X position early while
  // still mid-stretch. `translate`/`scale` interpolate independently.
  function setLensBox(el: HTMLElement, rect: Rect, barWidth: number) {
    el.style.translate = `${rect.left}px 0`
    el.style.scale = `${barWidth > 0 ? rect.width / barWidth : 1} 1`
  }

  function placeLensInstantly() {
    const lens = lensRef.current
    const bar = barRef.current
    const rect = tabRect(TABS.findIndex((t) => t.key === active))
    if (!lens || !bar || !rect) return
    setLensBox(lens, rect, bar.getBoundingClientRect().width)
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
    const bar = barRef.current
    if (!from || !to || !lens || !bar) return
    const barWidth = bar.getBoundingClientRect().width

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // jsdom (our test environment) doesn't implement the Web Animations API —
    // fall back to an instant jump so tests don't crash on lens.animate().
    if (reduced || typeof lens.animate !== 'function') {
      setLensBox(lens, to, barWidth)
      return
    }

    const bridgeLeft = Math.min(from.left, to.left)
    const bridgeRight = Math.max(from.left + from.width, to.left + to.width)
    const bridgeWidth = bridgeRight - bridgeLeft
    const { left: l, width: w } = to
    const kf = (rect: Rect) => ({ translate: `${rect.left}px 0`, scale: `${rect.width / barWidth} 1` })

    lens.animate(
      [
        { ...kf(from), offset: 0 },
        { ...kf({ left: bridgeLeft, width: bridgeWidth }), offset: 0.36, easing: BRIDGE_EASING },
        { ...kf({ left: l, width: w }), offset: 0.6 },
        { ...kf({ left: l - 3, width: w + 6 }), offset: 0.72 },
        { ...kf({ left: l + 1.5, width: w - 3 }), offset: 0.83 },
        { ...kf({ left: l - 0.6, width: w + 1.2 }), offset: 0.92 },
        { ...kf({ left: l, width: w }), offset: 1 },
      ],
      { duration: MOVE_DURATION, easing: 'ease-out', fill: 'forwards' },
    )
    setLensBox(lens, to, barWidth)

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
