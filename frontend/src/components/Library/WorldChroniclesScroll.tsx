import { useRef, useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Heart,
  Compass,
  Users,
} from 'lucide-react'
import type { Book } from '@/types'

interface WorldChroniclesScrollProps {
  books: Book[]
  favoriteOverrides: Record<string, boolean>
  onSelectBook: (book: Book) => void
  onToggleFavorite: (book: Book) => void
  onOpenStory: (book: Book) => void
}

export function WorldChroniclesScroll({
  books,
  favoriteOverrides,
  onSelectBook,
  onToggleFavorite,
  onOpenStory,
}: WorldChroniclesScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const isFavorite = (book: Book) => favoriteOverrides[book.id] ?? book.isFavorite

  const checkScrollLimits = () => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    setCanScrollLeft(scrollLeft > 20)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    checkScrollLimits()
    el.addEventListener('scroll', checkScrollLimits, { passive: true })
    return () => el.removeEventListener('scroll', checkScrollLimits)
  }, [])

  // 鼠标拖拽横向滚动交互
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - containerRef.current.offsetLeft)
    setScrollLeft(containerRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // 滚动倍速
    containerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  // 滚轮直接转换为横向滚动
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      containerRef.current.scrollLeft += e.deltaY * 0.8
    }
  }

  const scrollByAmount = (amount: number) => {
    if (!containerRef.current) return
    containerRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* 顶部引导与横向滑动导航 */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif text-white tracking-wide">
              天下八荒 · 典籍界域探索长卷
            </h3>
            <p className="text-xs text-stone-400 font-serif">
              按住鼠标横向拖拽或使用滚轮，漫游八大名著神魔武道世界
            </p>
          </div>
        </div>

        {/* 快速平移箭头 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByAmount(-400)}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full border transition-all ${
              canScrollLeft
                ? 'bg-stone-900 border-amber-400/40 text-amber-200 hover:bg-stone-800'
                : 'bg-stone-950/50 border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
            aria-label="向左滑动"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollByAmount(400)}
            disabled={!canScrollRight}
            className={`p-2 rounded-full border transition-all ${
              canScrollRight
                ? 'bg-stone-900 border-amber-400/40 text-amber-200 hover:bg-stone-800'
                : 'bg-stone-950/50 border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
            aria-label="向右滑动"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 长卷视口 */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className="chronicles-viewport"
      >
        <div className="chronicles-track">
          {books.map((book, idx) => {
            const prog = book.totalChapters > 0
              ? Math.min(100, Math.max(0, Math.round((book.currentChapter / book.totalChapters) * 100)))
              : 0

            return (
              <div key={book.id} className="chronicle-node">
                {/* 节点序数徽章 */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 text-xs font-mono flex items-center justify-center font-bold">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-serif text-amber-200/90 tracking-wider">
                    {book.realmTag || `${book.dynasty || '传世'} · 界域`}
                  </span>
                </div>

                {/* 节点大卡片 */}
                <div
                  className="chronicle-node-card group cursor-pointer"
                  onClick={() => onSelectBook(book)}
                >
                  {/* 背景立绘图层 */}
                  <div
                    className="chronicle-backdrop-art"
                    style={{ backgroundImage: `url(${book.bannerImage || book.cover})` }}
                  />
                  <div className="chronicle-vignette" />

                  {/* 顶部悬浮操作 */}
                  <div className="relative z-10 flex items-center justify-between mb-auto">
                    <span className="px-2.5 py-1 rounded text-[11px] font-serif bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300">
                      {book.genre || '古典文学'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(book)
                      }}
                      className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                        isFavorite(book)
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                          : 'bg-black/60 border-white/20 text-stone-300 hover:text-white'
                      }`}
                      aria-label="收藏"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(book) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* 底部信息层 */}
                  <div className="relative z-10 space-y-3">
                    <div>
                      <h4 className="text-2xl font-serif text-white group-hover:text-amber-300 transition-colors drop-shadow-md">
                        {book.title}
                      </h4>
                      <p className="text-xs text-amber-200/80 font-serif mt-0.5">
                        {book.author} · 约 {(book.wordCount / 10000).toFixed(1)} 万字
                      </p>
                    </div>

                    {book.quote && (
                      <p className="text-xs text-stone-300/90 font-serif italic border-l-2 border-amber-400/60 pl-2 line-clamp-2">
                        “{book.quote}”
                      </p>
                    )}

                    {/* 收录名士微缩头像条 */}
                    {book.characterList && book.characterList.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <Users className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <div className="flex -space-x-2 overflow-hidden">
                          {book.characterList.slice(0, 4).map((c) => (
                            <img
                              key={c.name}
                              src={c.avatar}
                              alt={c.name}
                              title={c.name}
                              className="w-6 h-6 rounded-full border border-amber-400/40 object-cover"
                            />
                          ))}
                        </div>
                        {book.characterList.length > 4 && (
                          <span className="text-[10px] text-stone-400 font-mono">
                            +{book.characterList.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 进度与进入按钮 */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="text-[11px] font-serif text-stone-400">
                        {book.readingStatus === 'reading' ? (
                          <span className="text-emerald-400">研读中 · {prog}%</span>
                        ) : book.readingStatus === 'completed' ? (
                          <span className="text-amber-300">已完卷</span>
                        ) : (
                          <span className="text-stone-500">待启卷</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenStory(book)
                        }}
                        className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-serif font-semibold hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-1 shadow"
                      >
                        <BookOpen className="w-3 h-3" />
                        入卷
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
