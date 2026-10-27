import { ALL_CATEGORIES } from '../lib/categories'

const ALL = { key: 'All', label: '全部', icon: null }

export default function CategoryFilterPills({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3">
      {[ALL, ...ALL_CATEGORIES].map((c) => {
        const active = selected === c.key
        const accent = c.accent ?? '#639922'
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect(c.key)}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active ? 'text-white' : 'bg-white border-gray-200 text-gray-600'
            }`}
            style={active ? { background: accent, borderColor: accent } : undefined}
          >
            {c.icon && <span>{c.icon}</span>}
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
