export type SectionTab = 'templates' | 'collabs'

interface TabBarProps {
  active: SectionTab
  onChange: (tab: SectionTab) => void
}

const TABS: { key: SectionTab; label: string }[] = [
  { key: 'templates', label: 'Templates' },
  { key: 'collabs', label: 'Colaboradores' },
]

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="glass-subtle mb-3 flex gap-1 rounded-2xl p-1">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={active === key}
          onClick={() => onChange(key)}
          className={`focus-ring flex-1 rounded-xl py-2 text-sm font-semibold transition ${
            active === key
              ? 'bg-gradient-to-br from-jungle to-jungle-dark text-white shadow-md shadow-jungle/30'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
