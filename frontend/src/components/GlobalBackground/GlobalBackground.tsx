import { useEffect, useRef } from 'react'
import { FloatingDust } from '@/components/Chronicles/FloatingDust'

const BASE_WORLD_IMAGE = '/welcome/welcome-world-base.png'
const REVEAL_WORLD_IMAGE = '/welcome/welcome-world-reveal.png'
const DESKTOP_SPOTLIGHT_RADIUS = 280
const TOUCH_SPOTLIGHT_RADIUS = 190

export function GlobalBackground() {
  const revealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reveal = revealRef.current
    if (!reveal) return

    const initialX = window.innerWidth / 2
    const initialY = window.innerHeight / 2
    const target = { x: initialX, y: initialY }
    const smooth = { x: initialX, y: initialY }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let isActive = true
    let frameId = 0

    reveal.style.setProperty('--welcome-spot-x', `${initialX}px`)
    reveal.style.setProperty('--welcome-spot-y', `${initialY}px`)
    reveal.style.setProperty('--welcome-spot-radius', `${DESKTOP_SPOTLIGHT_RADIUS}px`)
    reveal.dataset.active = 'true'

    const activate = (event: PointerEvent) => {
      target.x = event.clientX
      target.y = event.clientY

      const radius = event.pointerType === 'touch'
        ? TOUCH_SPOTLIGHT_RADIUS
        : DESKTOP_SPOTLIGHT_RADIUS

      reveal.style.setProperty('--welcome-spot-radius', `${radius}px`)
      reveal.dataset.active = 'true'
      isActive = true
    }

    const render = () => {
      if (isActive) {
        const smoothing = reducedMotion ? 1 : 0.12
        smooth.x += (target.x - smooth.x) * smoothing
        smooth.y += (target.y - smooth.y) * smoothing
        reveal.style.setProperty('--welcome-spot-x', `${smooth.x}px`)
        reveal.style.setProperty('--welcome-spot-y', `${smooth.y}px`)
      }
      frameId = window.requestAnimationFrame(render)
    }

    window.addEventListener('pointerdown', activate)
    window.addEventListener('pointermove', activate)
    frameId = window.requestAnimationFrame(render)

    return () => {
      window.removeEventListener('pointerdown', activate)
      window.removeEventListener('pointermove', activate)
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <div className="global-background" aria-hidden="true">
      <div className="welcome-world-media">
        <div
          className="welcome-world-base"
          style={{ backgroundImage: `url(${BASE_WORLD_IMAGE})` }}
        />
        <div className="welcome-world-shadow" />
        <div
          className="welcome-world-reveal"
          ref={revealRef}
          data-active="true"
          style={{ backgroundImage: `url(${REVEAL_WORLD_IMAGE})` }}
        />
      </div>
      <div className="welcome-world-vignette" />
      <div className="welcome-world-grain" />
      <FloatingDust />
    </div>
  )
}
