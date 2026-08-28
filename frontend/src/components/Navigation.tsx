import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Users, Swords, Sparkles, Settings, Home, ScrollText, PackageOpen } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setCurrentView, characters, books } = useGameStore()

  const navItems = [
    { id: 'welcome', label: '首页', icon: Home, path: '/' },
    { id: 'library', label: '书库', icon: BookOpen, path: '/library', badge: books.length },
    { id: 'characters', label: '角色', icon: Users, path: '/characters', badge: characters.length },
    { id: 'items', label: '法宝', icon: PackageOpen, path: '/items' },
    { id: 'battle', label: '战斗', icon: Swords, path: '/battle' },
    { id: 'story', label: '剧情', icon: Sparkles, path: '/story' },
    { id: 'settings', label: '设置', icon: Settings, path: '/settings' },
  ]

  type ViewType = 'welcome' | 'library' | 'characters' | 'items' | 'battle' | 'story' | 'settings'

  const handleNavClick = (id: string, path: string) => {
    setCurrentView(id as ViewType)
    navigate(path)
  }

  const isActive = (path: string) => path === '/'
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(`${path}/`)

  const renderItem = (item: (typeof navItems)[number], compact = false) => {
    const Icon = item.icon
    const active = isActive(item.path)

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavClick(item.id, item.path)}
        aria-current={active ? 'page' : undefined}
        className={`game-nav-item ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`}
      >
        <Icon aria-hidden="true" className="w-5 h-5" />
        <span>{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="game-nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
        )}
      </button>
    )
  }

  return (
    <>
      <aside className="game-rail hidden md:flex" aria-label="主要导航">
        <button
          type="button"
          onClick={() => handleNavClick('welcome', '/')}
          className="game-wordmark"
          aria-label="返回万卷浮生首页"
        >
          <ScrollText aria-hidden="true" className="w-7 h-7" />
          <span>万卷</span>
        </button>

        <div className="game-rail-links">
          {navItems.filter((item) => item.id !== 'welcome' && item.id !== 'settings').map((item) => renderItem(item, true))}
        </div>

        <div className="game-rail-footer">
          {renderItem(navItems.find((item) => item.id === 'settings')!, true)}
        </div>
      </aside>

      <nav className="game-dock md:hidden" aria-label="主要导航">
        {navItems.map((item) => renderItem(item))}
      </nav>
    </>
  )
}
