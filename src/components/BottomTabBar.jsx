const TABS = [
  { key: 'tracking', label: '記帳', icon: '🏠' },
  { key: 'cashback', label: '回饋', icon: '💳' },
]

export default function BottomTabBar({ activeTab, onChange }) {
  return (
    <nav className="absolute bottom-0 inset-x-0 border-t border-gray-200 bg-white flex">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
            activeTab === tab.key ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
