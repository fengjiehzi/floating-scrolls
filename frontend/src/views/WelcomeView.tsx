import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, ScanSearch, Settings2, X } from 'lucide-react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'

const BASE_WORLD_IMAGE = '/welcome/welcome-world-base.png'
const REVEAL_WORLD_IMAGE = '/welcome/welcome-world-reveal.png'
const DESKTOP_SPOTLIGHT_RADIUS = 260
const TOUCH_SPOTLIGHT_RADIUS = 190

type WelcomeDestination = 'library' | 'characters' | 'items' | 'story' | 'battle' | 'settings'

const destinations = [
  { label: '书库', view: 'library' as const, path: '/library' },
  { label: '角色', view: 'characters' as const, path: '/characters' },
  { label: '法宝', view: 'items' as const, path: '/items' },
  { label: '浮生录', view: 'story' as const, path: '/story' },
  { label: '演武场', view: 'battle' as const, path: '/battle' },
]

export function WelcomeView() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { characters, charactersStatus, setCurrentView } = useGameStore()

  useLayoutEffect(() => {
    if (!rootRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('[data-welcome-reveal]', {
        opacity: 0,
        y: 20,
        duration: 0.82,
        stagger: 0.08,
        ease: 'power3.out',
      })
      gsap.from('.welcome-world-media', {
        scale: 1.07,
        duration: 2.2,
        ease: 'power3.out',
      })
    }, rootRef)

    return () => context.revert()
  }, [])

  useEffect(() => {
    const stage = rootRef.current
    const reveal = revealRef.current
    if (!stage || !reveal) return

    const target = { x: -999, y: -999 }
    const smooth = { x: -999, y: -999 }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let hasPosition = false
    let isActive = false
    let frameId = 0

    const activate = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect()
      target.x = event.clientX - bounds.left
      target.y = event.clientY - bounds.top

      if (!hasPosition) {
        smooth.x = target.x
        smooth.y = target.y
        hasPosition = true
      }

      const radius = event.pointerType === 'touch'
        ? TOUCH_SPOTLIGHT_RADIUS
        : DESKTOP_SPOTLIGHT_RADIUS

      reveal.style.setProperty('--welcome-spot-radius', `${radius}px`)
      reveal.dataset.active = 'true'
      isActive = true
    }

    const deactivate = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      reveal.dataset.active = 'false'
      isActive = false
    }

    const cancelTouch = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      reveal.dataset.active = 'false'
      isActive = false
    }

    const render = () => {
      if (isActive && hasPosition) {
        const smoothing = reducedMotion ? 1 : 0.1
        smooth.x += (target.x - smooth.x) * smoothing
        smooth.y += (target.y - smooth.y) * smoothing
        reveal.style.setProperty('--welcome-spot-x', `${smooth.x}px`)
        reveal.style.setProperty('--welcome-spot-y', `${smooth.y}px`)
      }
      frameId = window.requestAnimationFrame(render)
    }

    stage.addEventListener('pointerdown', activate)
    stage.addEventListener('pointermove', activate)
    stage.addEventListener('pointerleave', deactivate)
    stage.addEventListener('pointercancel', cancelTouch)
    frameId = window.requestAnimationFrame(render)

    return () => {
      stage.removeEventListener('pointerdown', activate)
      stage.removeEventListener('pointermove', activate)
      stage.removeEventListener('pointerleave', deactivate)
      stage.removeEventListener('pointercancel', cancelTouch)
      window.cancelAnimationFrame(frameId)
    }
  }, [])

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

  const enter = (view: WelcomeDestination, path: string) => {
    setIsMenuOpen(false)
    setCurrentView(view)

    if (!transitionRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(path)
      return
    }

    gsap.fromTo(transitionRef.current, { opacity: 0, scale: 0.72 }, {
      opacity: 1,
      scale: 1.25,
      duration: 0.42,
      ease: 'power2.in',
      onComplete: () => navigate(path),
    })
  }

  const characterStatus = charactersStatus === 'success' && characters.length > 0
    ? `${characters.length} 位角色已入卷`
    : '典籍世界待启'

  return (
    <div className="welcome-shell" ref={rootRef}>
      <div className="ink-transition" ref={transitionRef} aria-hidden="true" />

      <div className="welcome-world-media" aria-hidden="true">
        <div
          className="welcome-world-base"
          style={{ backgroundImage: `url(${BASE_WORLD_IMAGE})` }}
        />
        <div className="welcome-world-shadow" />
        <div
          className="welcome-world-reveal"
          ref={revealRef}
          data-active="false"
          style={{ backgroundImage: `url(${REVEAL_WORLD_IMAGE})` }}
        />
      </div>

      <div className="welcome-world-vignette" aria-hidden="true" />
      <div className="welcome-world-grain" aria-hidden="true" />

      <header className="welcome-cinema-nav" data-welcome-reveal>
        <div className="welcome-cinema-brand" aria-label="万卷浮生">
          <svg viewBox="0 0 28 28" role="img" aria-hidden="true">
            <path d="M3 21.5 9.4 9.8l4.3 6.2L18.8 5 25 21.5H3Z" />
            <path d="M7.2 21.5 14 18l6.8 3.5" />
          </svg>
          <span>万卷浮生</span>
        </div>

        <nav className="welcome-desktop-nav" aria-label="核心玩法入口">
          {destinations.map(({ label, view, path }) => (
            <button key={path} type="button" onClick={() => enter(view, path)}>
              {label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="welcome-settings-action"
          onClick={() => enter('settings', '/settings')}
        >
          <Settings2 aria-hidden="true" />
          <span>AI 设置</span>
        </button>

        <button
          type="button"
          className="welcome-menu-button"
          ref={menuButtonRef}
          aria-label={isMenuOpen ? '关闭导航' : '打开导航'}
          aria-expanded={isMenuOpen}
          aria-controls="welcome-mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <main className="welcome-cinema-content">
        <section className="welcome-cinema-heading" aria-labelledby="welcome-title">
          <p className="welcome-cinema-eyebrow" data-welcome-reveal>
            AI 互动典籍 · 群英跨卷相逢
          </p>
          <h1 id="welcome-title" data-welcome-reveal>万卷浮生</h1>
          <p className="welcome-cinema-subtitle" data-welcome-reveal>一页入世，一念改命</p>
        </section>

        <section className="welcome-cinema-lore" data-welcome-reveal>
          <p>
            读一部书，唤醒其中人物；<br />
            借 AI 改写支线，让跨越千年的群英于一卷相逢。
          </p>
          <div className="welcome-world-status">
            <span aria-hidden="true" />
            {characterStatus}
          </div>
        </section>

        <section className="welcome-cinema-entry" data-welcome-reveal>
          <p>
            从典籍入卷，在剧情中养成角色，<br />
            收集法宝，最终走入演武场。
          </p>
          <button
            type="button"
            className="welcome-primary-action"
            onClick={() => enter('library', '/library')}
          >
            开启书卷
            <ArrowUpRight aria-hidden="true" />
          </button>
        </section>
      </main>

      <div className="welcome-spiritual-hint" data-welcome-reveal aria-hidden="true">
        <ScanSearch />
        <span>移动灵识 · 照见浮生</span>
      </div>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="welcome-mobile-scrim"
            aria-label="关闭导航"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav
            className="welcome-mobile-menu"
            id="welcome-mobile-menu"
            ref={menuRef}
            aria-label="移动端核心玩法入口"
          >
            <button type="button" className="welcome-mobile-menu-close" onClick={() => setIsMenuOpen(false)}>
              <X aria-hidden="true" />
              <span>关闭</span>
            </button>
            {destinations.map(({ label, view, path }) => (
              <button key={path} type="button" onClick={() => enter(view, path)}>
                <span>{label}</span>
                <ArrowUpRight aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={() => enter('settings', '/settings')}>
              <span>AI 设置</span>
              <Settings2 aria-hidden="true" />
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
