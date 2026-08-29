import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react'
import { ScrollBackground } from './ScrollBackground'
import { WorldCard } from './WorldCard'
import type { WorldNode } from '@/data/worldsData'

export interface ChronicleMetrics {
  viewportWidth: number
  contentWidth: number
  maxScroll: number
  cardCenters: number[]
}

interface ChroniclesStageProps {
  worlds: WorldNode[]
  activeWorldId: string
  scrollX: number
  onScrollChange: (newX: number) => void
  onMetricsChange: (metrics: ChronicleMetrics) => void
  onWorldSelect: (world: WorldNode) => void
  onWorldAction: (world: WorldNode) => void
  onStepScroll: (direction: 'left' | 'right') => void
}

interface ScrollPillarProps {
  side: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}

function ScrollPillar({ side, disabled, onClick }: ScrollPillarProps) {
  const isLeft = side === 'left'
  return (
    <aside className={`chronicles-pillar chronicles-pillar-${side}`} aria-label={isLeft ? '往昔卷轴柱' : '未来卷轴柱'}>
      <span className="chronicles-pillar-cap top" aria-hidden="true" />
      <span className="chronicles-pillar-collar top" aria-hidden="true" />
      <svg className="chronicles-pillar-engraving" viewBox="0 0 64 520" aria-hidden="true">
        <path d="M33 24 C8 62 51 88 25 124 C3 156 48 185 30 218 C10 252 53 278 28 316 C8 346 48 380 25 414 C12 434 19 466 34 494" />
        <path d="M26 82 C46 70 54 91 42 102 C25 116 14 101 20 91 M25 198 C49 184 55 212 38 224 C18 238 11 214 20 204 M27 350 C49 336 55 360 40 374 C20 390 11 364 20 354" />
        <circle cx="32" cy="148" r="7" />
        <circle cx="32" cy="286" r="7" />
        <circle cx="32" cy="438" r="7" />
      </svg>
      <button type="button" onClick={onClick} className="chronicles-pillar-btn" aria-label={isLeft ? '向左探索' : '向右探索'} disabled={disabled}>
        {isLeft ? <ChevronLeft /> : <ChevronRight />}
      </button>
      <span className="chronicles-pillar-text">
        {isLeft ? '向左拖动探索往昔' : '向右拖动探索未来'}
      </span>
      <span className="chronicles-pillar-collar bottom" aria-hidden="true" />
      <span className="chronicles-pillar-cap bottom" aria-hidden="true" />
    </aside>
  )
}

export function ChroniclesStage({
  worlds,
  activeWorldId,
  scrollX,
  onScrollChange,
  onMetricsChange,
  onWorldSelect,
  onWorldAction,
  onStepScroll,
}: ChroniclesStageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isPointerDown = useRef(false)
  const startX = useRef(0)
  const lastX = useRef(0)
  const velocity = useRef(0)
  const position = useRef(scrollX)
  const maxScrollRef = useRef(0)
  const dragDistance = useRef(0)
  const suppressClickUntil = useRef(0)
  const rafId = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isInertiaActive, setIsInertiaActive] = useState(false)
  const [metrics, setMetrics] = useState<ChronicleMetrics>({
    viewportWidth: 0,
    contentWidth: 1,
    maxScroll: 0,
    cardCenters: [],
  })

  const clampScroll = (value: number, maximum = maxScrollRef.current) => (
    Math.max(-maximum, Math.min(0, value))
  )

  const updatePosition = (value: number) => {
    const next = clampScroll(value)
    position.current = next
    onScrollChange(next)
    return next
  }

  const applyInertia = () => {
    const nextX = updatePosition(position.current + velocity.current)
    const hitBoundary = (nextX === 0 && velocity.current > 0)
      || (nextX === -maxScrollRef.current && velocity.current < 0)

    velocity.current *= 0.92
    if (Math.abs(velocity.current) <= 0.3 || hitBoundary) {
      setIsInertiaActive(false)
      rafId.current = null
      return
    }

    rafId.current = requestAnimationFrame(applyInertia)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const interactiveTarget = (event.target as HTMLElement).closest('button, a, input, textarea, select')
    if (interactiveTarget && !interactiveTarget.classList.contains('world-card-open-target')) return
    isPointerDown.current = true
    startX.current = event.clientX - position.current
    lastX.current = event.clientX
    velocity.current = 0
    dragDistance.current = 0
    if (rafId.current) cancelAnimationFrame(rafId.current)
    setIsDragging(true)
    setIsInertiaActive(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return
    const currentX = event.clientX
    velocity.current = currentX - lastX.current
    dragDistance.current += Math.abs(velocity.current)
    lastX.current = currentX
    updatePosition(currentX - startX.current)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (dragDistance.current >= 4) suppressClickUntil.current = performance.now() + 180

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reducedMotion && dragDistance.current >= 4 && Math.abs(velocity.current) > 0.3) {
      setIsInertiaActive(true)
      applyInertia()
    }
  }

  useEffect(() => {
    position.current = clampScroll(scrollX)
  }, [scrollX])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (rafId.current) cancelAnimationFrame(rafId.current)
      setIsInertiaActive(false)
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const next = Math.max(-maxScrollRef.current, Math.min(0, position.current - delta * 0.9))
      position.current = next
      onScrollChange(next)
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [onScrollChange])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    const updateMetrics = () => {
      const viewportWidth = viewport.clientWidth
      const contentWidth = Math.max(track.scrollWidth, track.offsetWidth)
      const nextMaxScroll = Math.max(0, contentWidth - viewportWidth)
      const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-world-id]'))
      const cardCenters = cards.map((card) => card.offsetLeft + card.offsetWidth / 2)
      const nextMetrics = { viewportWidth, contentWidth, maxScroll: nextMaxScroll, cardCenters }

      maxScrollRef.current = nextMaxScroll
      setMetrics(nextMetrics)
      onMetricsChange(nextMetrics)

      const clamped = clampScroll(position.current, nextMaxScroll)
      if (clamped !== position.current) {
        position.current = clamped
        onScrollChange(clamped)
      }
    }

    updateMetrics()
    const observer = new ResizeObserver(updateMetrics)
    observer.observe(viewport)
    observer.observe(track)
    return () => observer.disconnect()
  }, [onMetricsChange, onScrollChange, worlds])

  useEffect(() => () => {
    if (rafId.current) cancelAnimationFrame(rafId.current)
  }, [])

  const destinyPoints = worlds.map((_, index) => {
    const denominator = Math.max(1, worlds.length - 1)
    return {
      x: 72 + (856 * index) / denominator,
      y: 286 + Math.sin(index * 1.28) * 15,
    }
  })

  const destinyPath = destinyPoints.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = destinyPoints[index - 1]
    const middle = (previous.x + point.x) / 2
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`
  }, '')

  const isStaticTrack = worlds.length <= 3

  return (
    <section className={`chronicles-stage${isDragging ? ' is-dragging' : ''}`} aria-labelledby="chronicles-world-map-title">
      <div className="chronicles-stage-heading">
        <div className="chronicles-stage-title">
          <span className="chronicles-heading-line" aria-hidden="true" />
          <span id="chronicles-world-map-title">世界经纬图</span>
          <span className="chronicles-heading-line" aria-hidden="true" />
        </div>
        <p className="chronicles-stage-subtitle">八大世界 · 势力经纬 · 因果纷争</p>
      </div>

      <div className="chronicles-stage-wrapper">
        <ScrollPillar side="left" disabled={scrollX >= -1} onClick={() => onStepScroll('left')} />

        <div
          className="chronicles-viewport-box"
          ref={viewportRef}
          tabIndex={0}
          aria-label="世界长卷，可拖拽或使用左右方向键探索"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              onStepScroll('left')
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              onStepScroll('right')
            }
          }}
        >
          <span className="chronicles-paper-edge top" aria-hidden="true" />
          <span className="chronicles-paper-edge bottom" aria-hidden="true" />
          <ScrollBackground scrollX={scrollX} />

          <svg
            className="chronicles-destiny-map"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            style={{
              width: `${Math.max(metrics.contentWidth, metrics.viewportWidth)}px`,
              transform: `translate3d(${scrollX * 0.6}px, 0, 0)`,
            }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="destinyGoldGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b9822d" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#ffe39b" stopOpacity="1" />
                <stop offset="100%" stopColor="#b9822d" stopOpacity="0.55" />
              </linearGradient>
              <filter id="goldDropShadow" x="-20%" y="-30%" width="140%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path d={destinyPath} fill="none" stroke="url(#destinyGoldGlow)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" filter="url(#goldDropShadow)" />
            {destinyPoints.map((point, index) => (
              <g key={worlds[index]?.id || index} className="destiny-pulse-node">
                <circle cx={point.x} cy={point.y} r="3.5" fill="#ffe9a9" />
                <circle className="destiny-pulse-ring" cx={point.x} cy={point.y} r="7" fill="none" stroke="#e6b955" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </svg>

          <div
            ref={trackRef}
            className={`chronicles-track-container${isStaticTrack ? ' is-static' : ''}`}
            style={{
              transform: `translate3d(${scrollX}px, 0, 0)`,
              transition: isDragging || isInertiaActive ? 'none' : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <span className="chronicles-faction-line" aria-hidden="true" />
            {worlds.map((world) => (
              <WorldCard
                key={world.id}
                world={world}
                isActive={world.id === activeWorldId}
                onClick={() => {
                  if (performance.now() >= suppressClickUntil.current) onWorldSelect(world)
                }}
                onActionClick={(event) => {
                  event.stopPropagation()
                  onWorldAction(world)
                }}
              />
            ))}
          </div>
        </div>

        <ScrollPillar side="right" disabled={scrollX <= -metrics.maxScroll + 1} onClick={() => onStepScroll('right')} />
      </div>

      <div className={`chronicles-drag-hint${scrollX !== 0 ? ' is-used' : ''}`}>
        <span className="chronicles-hint-line" />
        <span><Hand aria-hidden="true" />拖拽长卷探索世界 · 惯性滑动体验更佳</span>
        <span className="chronicles-hint-line" />
      </div>
    </section>
  )
}
