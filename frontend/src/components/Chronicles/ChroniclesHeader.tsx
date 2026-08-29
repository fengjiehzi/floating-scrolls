import { useLayoutEffect, useRef } from 'react'
import { BookOpen, Trophy, Bookmark, ChevronDown, Map, Compass } from 'lucide-react'
import { gsap } from 'gsap'
import type { WorldNode } from '@/data/worldsData'

export type LibraryViewMode = 'chronicles' | 'catalog'

interface ChroniclesHeaderProps {
  activeTab: WorldNode['chapterCategory']
  viewMode: LibraryViewMode
  onTabChange: (tab: WorldNode['chapterCategory']) => void
  onViewModeChange: (mode: LibraryViewMode) => void
  onOpenFavorites: () => void
  onOpenRanking: () => void
}

const TABS: { key: WorldNode['chapterCategory']; label: string }[] = [
  { key: 'all', label: '天下八荒' },
  { key: 'mortal', label: '人间篇' },
  { key: 'gods', label: '神魔篇' },
  { key: 'dynasty', label: '王朝篇' },
  { key: 'underworld', label: '幽冥篇' },
]

export function ChroniclesHeader({
  activeTab,
  viewMode,
  onTabChange,
  onViewModeChange,
  onOpenFavorites,
  onOpenRanking,
}: ChroniclesHeaderProps) {
  const highlightRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<Partial<Record<WorldNode['chapterCategory'], HTMLButtonElement | null>>>({})

  useLayoutEffect(() => {
    if (viewMode !== 'chronicles') return
    const target = tabRefs.current[activeTab]
    const highlight = highlightRef.current
    if (!target || !highlight) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gsap.killTweensOf(highlight)
    gsap.to(highlight, {
      x: target.offsetLeft,
      width: target.offsetWidth,
      duration: reducedMotion ? 0 : 0.45,
      ease: 'power3.out',
      opacity: 1,
    })
  }, [activeTab, viewMode])

  return (
    <header className="chronicles-header">
      <div className="chronicles-sub-brand">
        <Compass className="w-4 h-4 text-amber-400/80" />
        <span className="chronicles-sub-title">世界经纬 · 篇章长卷</span>
      </div>

      {viewMode === 'chronicles' ? (
        <nav className="chronicles-tabs-nav" role="tablist" aria-label="篇章分类">
          <span ref={highlightRef} className="chronicles-tabs-highlight" aria-hidden="true">
            <i className="ornament-left" />
            <i className="ornament-right" />
          </span>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              ref={(node) => { tabRefs.current[tab.key] = node }}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`chronicles-tab-btn ${activeTab === tab.key ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : (
        <div className="chronicles-catalog-heading" aria-live="polite">
          <strong>藏书总目</strong>
          <span>检索、珍藏与本地入卷</span>
        </div>
      )}

      <div className="chronicles-header-tools">
        <div className="chronicles-tool-list">
          <button
            type="button"
            onClick={() => onViewModeChange(viewMode === 'chronicles' ? 'catalog' : 'chronicles')}
            title={viewMode === 'chronicles' ? '打开藏书总目' : '返回世界长卷'}
          >
            <span className="chronicles-tool-icon">
              {viewMode === 'chronicles' ? <BookOpen /> : <Map />}
            </span>
            <span>{viewMode === 'chronicles' ? '藏书阁' : '长卷'}</span>
          </button>

          <button type="button" onClick={onOpenRanking} title="界域排行榜">
            <span className="chronicles-tool-icon"><Trophy /></span>
            <span>排行榜</span>
          </button>

          <button type="button" onClick={onOpenFavorites} title="我的书卷收藏">
            <span className="chronicles-tool-icon"><Bookmark /></span>
            <span>珍藏</span>
          </button>
        </div>

        <button type="button" className="chronicles-avatar-button" title="执笔者资料">
          <span className="chronicles-avatar-ring">
            <img src="/library/hongloumeng-lindaiyu.png" alt="执笔者" />
          </span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
