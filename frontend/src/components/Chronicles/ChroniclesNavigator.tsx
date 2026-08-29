import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Compass } from 'lucide-react'
import type { WorldNode } from '@/data/worldsData'

interface ChroniclesNavigatorProps {
  worlds: WorldNode[]
  activeWorldId: string
  scrollProgress: number
  explorationPercent: number
  exploredCount: number
  totalWorldCount: number
  canPrev: boolean
  canNext: boolean
  onSelectNode: (world: WorldNode) => void
  onScrollProgressChange: (progress: number) => void
  onPrev: () => void
  onNext: () => void
  onResetLocation: () => void
}

export function ChroniclesNavigator({
  worlds,
  activeWorldId,
  scrollProgress,
  explorationPercent,
  exploredCount,
  totalWorldCount,
  canPrev,
  canNext,
  onSelectNode,
  onScrollProgressChange,
  onPrev,
  onNext,
  onResetLocation,
}: ChroniclesNavigatorProps) {
  const minimapRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartProgress = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const progressPercent = Math.max(0, Math.min(100, explorationPercent))
  const strokeDashoffset = 100 - progressPercent
  const indicatorWidthPercent = worlds.length >= 4 ? 37.5 : 100
  const indicatorLeftPercent = scrollProgress * (100 - indicatorWidthPercent)

  const updateProgressFromPointer = (clientX: number) => {
    const minimap = minimapRef.current
    if (!minimap) return
    const availableWidth = minimap.clientWidth * (1 - indicatorWidthPercent / 100)
    if (availableWidth <= 0) {
      onScrollProgressChange(0)
      return
    }
    const deltaProgress = (clientX - dragStartX.current) / availableWidth
    onScrollProgressChange(Math.max(0, Math.min(1, dragStartProgress.current + deltaProgress)))
  }

  return (
    <footer className="chronicles-navigator">
      <span className="chronicles-navigator-corner corner-tl" aria-hidden="true" />
      <span className="chronicles-navigator-corner corner-tr" aria-hidden="true" />
      <span className="chronicles-navigator-corner corner-bl" aria-hidden="true" />
      <span className="chronicles-navigator-corner corner-br" aria-hidden="true" />

      <section className="nav-progress-group" aria-label="世界探索进度">
        <div className="nav-progress-texts">
          <span className="nav-progress-title">世界探索进度</span>
          <span className="nav-progress-value">{progressPercent}%</span>
          <span className="nav-progress-subtitle">已探索 {exploredCount} / {totalWorldCount} 世界</span>
        </div>
        <div className="nav-progress-circle-box" aria-hidden="true">
          <svg viewBox="0 0 36 36">
            <path className="nav-ring-track" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="nav-ring-value" strokeDasharray="100, 100" strokeDashoffset={strokeDashoffset} strokeWidth="2.2" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span>卷</span>
        </div>
      </section>

      <div className="nav-minimap-shell">
        <span className="nav-minimap-cap left" aria-hidden="true" />
        <div className="nav-minimap-container" ref={minimapRef}>
          <div className="nav-minimap-map" aria-hidden="true" />
          <div className="nav-minimap-track-line" />
          {worlds.map((world) => (
            <button
              type="button"
              key={world.id}
              onClick={() => onSelectNode(world)}
              className={`nav-minimap-node ${world.id === activeWorldId ? 'is-active' : ''}`}
              title={`${world.title} (${world.subtitle})`}
              aria-label={`定位到${world.title}`}
              aria-current={world.id === activeWorldId ? 'true' : undefined}
            >
              <img src={world.coverImage} alt="" />
            </button>
          ))}

          <div
            className={`nav-minimap-indicator${isDragging ? ' is-dragging' : ''}`}
            role="slider"
            tabIndex={0}
            aria-label="长卷焦点范围"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(scrollProgress * 100)}
            onPointerDown={(event) => {
              setIsDragging(true)
              dragStartX.current = event.clientX
              dragStartProgress.current = scrollProgress
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (isDragging) updateProgressFromPointer(event.clientX)
            }}
            onPointerUp={(event) => {
              setIsDragging(false)
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={() => setIsDragging(false)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                onScrollProgressChange(Math.max(0, scrollProgress - 0.08))
              }
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                onScrollProgressChange(Math.min(1, scrollProgress + 0.08))
              }
              if (event.key === 'Home') {
                event.preventDefault()
                onScrollProgressChange(0)
              }
              if (event.key === 'End') {
                event.preventDefault()
                onScrollProgressChange(1)
              }
            }}
            style={{ left: `${indicatorLeftPercent}%`, width: `${indicatorWidthPercent}%` }}
          >
            <span className="indicator-grip top" aria-hidden="true" />
            <span className="indicator-grip bottom" aria-hidden="true" />
          </div>
        </div>
        <span className="nav-minimap-cap right" aria-hidden="true" />
      </div>

      <nav className="nav-actions-group" aria-label="时空导航">
        <button type="button" onClick={onPrev} className="nav-action-btn" title="回溯往昔 上一卷" disabled={!canPrev}>
          <span className="nav-action-top-label">回溯往昔</span>
          <span className="nav-action-icon-circle"><ArrowLeft /></span>
          <span className="nav-action-bottom-label">上一卷</span>
        </button>

        <button type="button" onClick={onResetLocation} className="nav-action-btn is-locator" title="时空定位">
          <span className="nav-action-icon-circle"><Compass /></span>
          <span className="nav-action-bottom-label">时空定位</span>
        </button>

        <button type="button" onClick={onNext} className="nav-action-btn" title="前往未来 下一卷" disabled={!canNext}>
          <span className="nav-action-top-label">前往未来</span>
          <span className="nav-action-icon-circle"><ArrowRight /></span>
          <span className="nav-action-bottom-label">下一卷</span>
        </button>
      </nav>
    </footer>
  )
}
