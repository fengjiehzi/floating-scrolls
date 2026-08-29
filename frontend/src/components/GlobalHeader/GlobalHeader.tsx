import { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings2, Menu, X } from 'lucide-react'
import { gsap } from 'gsap'
import { useGameStore } from '@/store/gameStore'

type CurrentView = ReturnType<typeof useGameStore.getState>['currentView']

interface NavDestination {
  id: CurrentView
  label: string
  path: string
}

const GLOBAL_NAV_DESTINATIONS: NavDestination[] = [
  { id: 'library', label: '书库', path: '/library' },
  { id: 'characters', label: '角色', path: '/characters' },
  { id: 'items', label: '法宝', path: '/items' },
  { id: 'story', label: '浮生录', path: '/story' },
  { id: 'battle', label: '演武场', path: '/battle' },
]

export function GlobalHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const navContainerRef = useRef<HTMLElement>(null)
  const activePillRef = useRef<HTMLSpanElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const { setCurrentView } = useGameStore()

  const currentPath = location.pathname

  const isCurrentActive = useCallback((path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }, [currentPath])

  // Smooth highlight indicator animation
  useLayoutEffect(() => {
    const updatePill = () => {
      const activeItem = GLOBAL_NAV_DESTINATIONS.find((item) => isCurrentActive(item.path))
      const pill = activePillRef.current
      if (!pill) return

      if (!activeItem) {
        gsap.to(pill, { opacity: 0, duration: 0.2, ease: 'power2.out' })
        return
      }

      const targetBtn = btnRefs.current[activeItem.id]
      if (!targetBtn) {
        gsap.to(pill, { opacity: 0, duration: 0.2, ease: 'power2.out' })
        return
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      gsap.killTweensOf(pill)
      gsap.to(pill, {
        x: targetBtn.offsetLeft,
        width: targetBtn.offsetWidth,
        opacity: 1,
        duration: reducedMotion ? 0 : 0.35,
        ease: 'power3.out',
      })
    }

    updatePill()
    window.addEventListener('resize', updatePill)
    return () => window.removeEventListener('resize', updatePill)
  }, [isCurrentActive])

  useEffect(() => {
    if (!isMenuOpen) return

    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsMenuOpen(false)
      menuButtonRef.current?.focus()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isMenuOpen])

  const handleNavigate = (path: string, viewId: CurrentView) => {
    setIsMenuOpen(false)
    setCurrentView(viewId)
    navigate(path)
  }

  const isHome = currentPath === '/'

  return (
    <header className="global-header">
      <div className="global-header-inner">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNavigate('/', 'welcome')}
          className={`global-header-brand ${isHome ? 'is-active-home' : ''}`}
          aria-label="万卷浮生 首页"
        >
          <div className="global-brand-icon">
            <svg viewBox="0 0 28 28" role="img" aria-hidden="true">
              <path d="M3 21.5 9.4 9.8l4.3 6.2L18.8 5 25 21.5H3Z" />
              <path d="M7.2 21.5 14 18l6.8 3.5" />
            </svg>
          </div>
          <span className="global-brand-text">万卷浮生</span>
        </button>

        {/* Center Navigation */}
        <nav className="global-header-nav" ref={navContainerRef} aria-label="核心探索导航">
          <span ref={activePillRef} className="global-nav-pill" aria-hidden="true" />
          {GLOBAL_NAV_DESTINATIONS.map((item) => {
            const active = isCurrentActive(item.path)
            return (
              <button
                key={item.id}
                ref={(node) => { btnRefs.current[item.id] = node }}
                type="button"
                className={`global-nav-item ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => handleNavigate(item.path, item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="global-header-actions">
          <button
            type="button"
            className={`global-settings-btn ${isCurrentActive('/settings') ? 'is-active' : ''}`}
            onClick={() => handleNavigate('/settings', 'settings')}
          >
            <Settings2 aria-hidden="true" />
            <span>AI 设置</span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            className="global-menu-trigger"
            ref={menuButtonRef}
            aria-label={isMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
            aria-expanded={isMenuOpen}
            aria-controls="global-mobile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <>
          <button
            type="button"
            className="global-mobile-scrim"
            aria-label="关闭导航"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav
            className="global-mobile-drawer"
            id="global-mobile-menu"
            ref={menuRef}
            aria-label="移动端核心玩法入口"
          >
            <div className="global-mobile-drawer-header">
              <span className="global-mobile-brand">万卷浮生</span>
              <button
                type="button"
                className="global-mobile-close"
                onClick={() => setIsMenuOpen(false)}
              >
                <X aria-hidden="true" />
                <span>关闭</span>
              </button>
            </div>

            <div className="global-mobile-links">
              <button
                type="button"
                className={`global-mobile-item ${isHome ? 'is-active' : ''}`}
                onClick={() => handleNavigate('/', 'welcome')}
              >
                <span>首页</span>
              </button>
              {GLOBAL_NAV_DESTINATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`global-mobile-item ${isCurrentActive(item.path) ? 'is-active' : ''}`}
                  onClick={() => handleNavigate(item.path, item.id)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                type="button"
                className={`global-mobile-item ${isCurrentActive('/settings') ? 'is-active' : ''}`}
                onClick={() => handleNavigate('/settings', 'settings')}
              >
                <span>AI 设置</span>
                <Settings2 aria-hidden="true" className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
