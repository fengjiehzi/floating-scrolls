interface TabNavProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="tab-nav" role="tablist" aria-label="设置分类">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-nav-button${activeTab === tab.id ? ' is-active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
