import { useEffect, useRef } from 'react'
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

/**
 * Persistent bottom navigation. The active tab's bubble rises out of the bar
 * as a liquid glass blob (goo filter merging a flat pad with a circle) with a
 * shine flash and a slight lean toward whichever tab it came from, matching
 * the reference the user provided — not a plain slide, a sink-and-rise.
 */
export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  const unitRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActive = useRef<BottomTab | null>(null)

  useEffect(() => {
    const prevIndex = TABS.findIndex((t) => t.key === prevActive.current)
    const nextIndex = TABS.findIndex((t) => t.key === active)
    const unit = unitRefs.current[nextIndex]
    const bubble = unit?.querySelector<HTMLElement>('.bubble')
    if (bubble && prevIndex >= 0 && prevIndex !== nextIndex) {
      bubble.style.setProperty('--drift', `${prevIndex < nextIndex ? -16 : 16}px`)
    }
    if (unit) {
      unit.classList.add('flash')
      const timer = setTimeout(() => unit.classList.remove('flash'), 600)
      prevActive.current = active
      return () => clearTimeout(timer)
    }
    prevActive.current = active
  }, [active])

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      aria-label="Navegación principal"
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="tabbar-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7.5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="bottom-tabbar glass-strong relative flex h-[58px] w-full max-w-xs items-center rounded-[26px] shadow-[var(--shadow-4)]">
        <div className="bubble-goo">
          {TABS.map((tab, i) => (
            <div
              key={tab.key}
              ref={(el) => {
                unitRefs.current[i] = el
              }}
              className={`bubble-unit ${active === tab.key ? 'active' : ''}`}
            >
              <div className="pad" />
              <div className="bubble" />
              <div className="shine" />
            </div>
          ))}
        </div>

        <div className="relative z-[3] flex flex-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => onSelect(key)}
              className={`tab-btn focus-ring flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border-none bg-transparent py-2 text-[10px] font-semibold ${
                active === key ? 'active text-jungle-pale' : 'text-text-tertiary'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
