import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Users, Swords, Sparkles, Settings, Home } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setCurrentView, characters, books } = useGameStore()

  const navItems = [
    { id: 'welcome', label: '首页', icon: Home, path: '/' },
    { id: 'library', label: '书库', icon: BookOpen, path: '/library', badge: books.length },
    { id: 'characters', label: '角色', icon: Users, path: '/characters', badge: characters.length },
    { id: 'battle', label: '战斗', icon: Swords, path: '/battle' },
    { id: 'story', label: '剧情', icon: Sparkles, path: '/story' },
    { id: 'settings', label: '设置', icon: Settings, path: '/settings' },
  ]

  type ViewType = 'welcome' | 'library' | 'characters' | 'battle' | 'story' | 'settings'

  const handleNavClick = (id: string, path: string) => {
    setCurrentView(id as ViewType)
    navigate(path)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b border-text-muted/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => handleNavClick('welcome', '/')}
            className="flex items-center gap-2 group"
          >
            <BookOpen className="w-8 h-8 text-gradient-gold group-hover:animate-float" />
            <span className="text-xl font-bold text-gradient-gold font-display">万卷浮生</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.path)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-accent-gold/20 text-accent-gold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-accent-red text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => handleNavClick('settings', '/settings')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-around py-2 border-t border-text-muted/20">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  active
                    ? 'text-accent-gold'
                    : 'text-text-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs font-bold bg-accent-red text-white rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}