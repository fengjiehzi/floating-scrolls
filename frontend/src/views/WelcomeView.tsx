import { useLayoutEffect, useRef } from 'react'
import { ArrowUpRight, ScanSearch } from 'lucide-react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'

export function WelcomeView() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const { characters, charactersStatus, setCurrentView } = useGameStore()

  useLayoutEffect(() => {
    if (!rootRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('[data-welcome-reveal]', {
        opacity: 0,
        y: 24,
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
      })
    }, rootRef)

    return () => context.revert()
  }, [])

  const enterLibrary = () => {
    setCurrentView('library')
    navigate('/library')
  }

  const characterStatus = charactersStatus === 'success' && characters.length > 0
    ? `${characters.length} 位角色已入卷`
    : '典籍世界待启'

  return (
    <div className="welcome-shell" ref={rootRef}>
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
            onClick={enterLibrary}
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
    </div>
  )
}

export default WelcomeView
