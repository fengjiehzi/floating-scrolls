interface TabNavProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-gradient-card text-gradient-gold border border-border-gold/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
