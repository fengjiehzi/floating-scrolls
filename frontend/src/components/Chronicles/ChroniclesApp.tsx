import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FilePlus2, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { FloatingDust } from './FloatingDust'
import { ChroniclesHeader, type LibraryViewMode } from './ChroniclesHeader'
import { ChroniclesStage, type ChronicleMetrics } from './ChroniclesStage'
import { ChroniclesNavigator } from './ChroniclesNavigator'
import { BookDetailDrawer } from '@/components/Library/BookDetailDrawer'
import { ScrollPavilionGrid } from '@/components/Library/ScrollPavilionGrid'
import { Modal } from '@/components/Modal'
import { WORLD_CHRONICLE_META, WORLD_NODES, type WorldNode } from '@/data/worldsData'
import { CLASSIC_BOOKS } from '@/data/classicsData'
import { useGameStore } from '@/store/gameStore'
import type { Book } from '@/types'

type CatalogFilter = 'all' | 'reading' | 'favorite' | 'completed' | 'upload'

const CATALOG_FILTERS: { value: CatalogFilter; label: string }[] = [
  { value: 'all', label: '全部典籍' },
  { value: 'reading', label: '正在研读' },
  { value: 'favorite', label: '我的珍藏' },
  { value: 'completed', label: '已经完卷' },
  { value: 'upload', label: '本地入卷' },
]

export function ChroniclesApp() {
  const navigate = useNavigate()
  const { addToast, books, addBook } = useGameStore()
  const [viewMode, setViewMode] = useState<LibraryViewMode>('chronicles')
  const [activeTab, setActiveTab] = useState<WorldNode['chapterCategory']>('all')
  const [activeWorldId, setActiveWorldId] = useState(WORLD_NODES[0].id)
  const [scrollX, setScrollX] = useState(0)
  const [stageMetrics, setStageMetrics] = useState<ChronicleMetrics>({
    viewportWidth: 0,
    maxScroll: 0,
    contentWidth: 1,
    cardCenters: [],
  })
  const scrollRef = useRef(0)
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null)
  const positioningWorldRef = useRef<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({})
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('all')
  const [query, setQuery] = useState('')
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [newBook, setNewBook] = useState<Partial<Book>>({})

  const filteredWorlds = useMemo(() => {
    if (activeTab === 'all') return WORLD_NODES
    return WORLD_NODES.filter((world) => world.chapterCategory === activeTab)
  }, [activeTab])

  const allBooks = useMemo(() => [...CLASSIC_BOOKS, ...books], [books])
  const isFavorite = useCallback(
    (book: Book) => favoriteMap[book.id] ?? book.isFavorite,
    [favoriteMap],
  )

  const filteredBooks = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('zh-CN')
    return allBooks.filter((book) => {
      const matchesQuery = !keyword
        || book.title.toLocaleLowerCase('zh-CN').includes(keyword)
        || book.author.toLocaleLowerCase('zh-CN').includes(keyword)
        || book.charactersExtracted.some((name) => name.toLocaleLowerCase('zh-CN').includes(keyword))
      const matchesFilter = catalogFilter === 'all'
        || (catalogFilter === 'reading' && book.readingStatus === 'reading')
        || (catalogFilter === 'favorite' && isFavorite(book))
        || (catalogFilter === 'completed' && book.readingStatus === 'completed')
        || (catalogFilter === 'upload' && book.sourceType === 'upload')
      return matchesQuery && matchesFilter
    })
  }, [allBooks, catalogFilter, isFavorite, query])

  const featuredBook = useMemo(() => (
    filteredBooks.find((book) => book.readingStatus === 'reading')
    ?? filteredBooks[0]
    ?? null
  ), [filteredBooks])

  const recentBooks = useMemo(() => filteredBooks
    .filter((book) => book.id !== featuredBook?.id && book.lastReadAt)
    .sort((left, right) => Date.parse(right.lastReadAt || right.updatedAt) - Date.parse(left.lastReadAt || left.updatedAt))
    .slice(0, 3), [featuredBook?.id, filteredBooks])

  const scrollProgress = stageMetrics.maxScroll > 0
    ? Math.min(1, Math.max(0, -scrollX / stageMetrics.maxScroll))
    : 0
  const activeWorldIndex = filteredWorlds.findIndex((world) => world.id === activeWorldId)
  const exploredCount = WORLD_CHRONICLE_META.exploredWorldIds.length

  const handleMetricsChange = useCallback((metrics: ChronicleMetrics) => {
    setStageMetrics(metrics)
  }, [])

  const setScrollPosition = useCallback((value: number) => {
    scrollRef.current = value
    setScrollX(value)
  }, [])

  const handleManualScrollChange = useCallback((value: number) => {
    positioningWorldRef.current = null
    scrollTweenRef.current?.kill()
    setScrollPosition(value)
  }, [setScrollPosition])

  const animateScrollTo = useCallback((target: number, worldId?: string) => {
    const next = Math.max(-stageMetrics.maxScroll, Math.min(0, target))
    scrollTweenRef.current?.kill()
    positioningWorldRef.current = worldId || null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setScrollPosition(next)
      return
    }

    const proxy = { value: scrollRef.current }
    scrollTweenRef.current = gsap.to(proxy, {
      value: next,
      duration: 0.8,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => setScrollPosition(proxy.value),
    })
  }, [setScrollPosition, stageMetrics.maxScroll])

  useEffect(() => {
    scrollRef.current = scrollX
  }, [scrollX])

  useEffect(() => () => {
    scrollTweenRef.current?.kill()
  }, [])

  const handleTabChange = (tab: WorldNode['chapterCategory']) => {
    setActiveTab(tab)
    scrollTweenRef.current?.kill()
    positioningWorldRef.current = null
    setScrollPosition(0)
    const target = tab === 'all'
      ? WORLD_NODES[0]
      : WORLD_NODES.find((world) => world.chapterCategory === tab)
    if (target) setActiveWorldId(target.id)
  }

  useEffect(() => {
    if (positioningWorldRef.current) return
    if (stageMetrics.maxScroll === 0 || stageMetrics.viewportWidth === 0) return
    const visibleCenter = -scrollX + stageMetrics.viewportWidth / 2
    let closestWorld = filteredWorlds[0]
    let minDistance = Number.POSITIVE_INFINITY

    filteredWorlds.forEach((world, index) => {
      const cardCenter = stageMetrics.cardCenters[index]
      if (cardCenter === undefined) return
      const distance = Math.abs(visibleCenter - cardCenter)
      if (distance < minDistance) {
        minDistance = distance
        closestWorld = world
      }
    })

    if (closestWorld) {
      setActiveWorldId((current) => closestWorld.id === current ? current : closestWorld.id)
    }
  }, [filteredWorlds, scrollX, stageMetrics.cardCenters, stageMetrics.maxScroll, stageMetrics.viewportWidth])

  const scrollToWorld = (world: WorldNode) => {
    setActiveWorldId(world.id)
    const index = filteredWorlds.findIndex((item) => item.id === world.id)
    if (index === -1) return
    const cardCenter = stageMetrics.cardCenters[index]
    if (cardCenter === undefined) return
    const target = -(cardCenter - stageMetrics.viewportWidth / 2)
    animateScrollTo(target, world.id)
  }

  const handleStepScroll = (direction: 'left' | 'right') => {
    const index = activeWorldIndex === -1 ? 0 : activeWorldIndex
    const nextIndex = direction === 'left'
      ? Math.max(0, index - 1)
      : Math.min(filteredWorlds.length - 1, index + 1)
    if (filteredWorlds[nextIndex]) scrollToWorld(filteredWorlds[nextIndex])
  }

  const handleResetLocation = () => {
    if (!filteredWorlds[0]) return
    scrollToWorld(filteredWorlds[0])
    addToast({ type: 'info', message: `已时空定位至《${filteredWorlds[0].title}》。` })
  }

  const openBook = (book: Book) => {
    setSelectedBook(book)
    setIsDrawerOpen(true)
  }

  const handleWorldSelect = (world: WorldNode) => {
    setActiveWorldId(world.id)
    const matchedBook = allBooks.find((book) => book.id === world.bookId)
    if (matchedBook) openBook(matchedBook)
  }

  const handleWorldAction = (world: WorldNode) => {
    if (world.status === 'enter' || world.status === 'exploring') {
      navigate('/story')
      return
    }
    handleWorldSelect(world)
  }

  const toggleFavorite = (book: Book) => {
    const nextValue = !isFavorite(book)
    setFavoriteMap((current) => ({ ...current, [book.id]: nextValue }))
    addToast({
      type: nextValue ? 'success' : 'info',
      message: `《${book.title}》${nextValue ? '已加入藏书阁珍藏。' : '已取消珍藏。'}`,
    })
  }

  const openCatalog = (filter: CatalogFilter = 'all') => {
    setCatalogFilter(filter)
    setViewMode('catalog')
  }

  const handleAddBook = () => {
    if (!newBook.title?.trim() || !newBook.author?.trim()) return
    const timestamp = new Date().toISOString()
    addBook({
      id: crypto.randomUUID(),
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      cover: '/library/chronicles-map-scroll-v2.png',
      description: newBook.description?.trim() || '',
      fileUrl: '',
      wordCount: 0,
      charactersExtracted: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      sourceType: 'upload',
      readingStatus: 'not_started',
      currentChapter: 0,
      totalChapters: 0,
      lastReadAt: null,
      isFavorite: false,
    })
    setNewBook({})
    setIsAddBookOpen(false)
    setCatalogFilter('upload')
    addToast({ type: 'success', message: '典籍已加入当前会话。' })
  }

  return (
    <div className={`chronicles-container is-${viewMode}`}>
      <div className="chronicles-vignette" />
      <div className="chronicles-grain" />
      {viewMode === 'chronicles' && <FloatingDust />}

      <ChroniclesHeader
        activeTab={activeTab}
        viewMode={viewMode}
        onTabChange={handleTabChange}
        onViewModeChange={(mode) => setViewMode(mode)}
        onOpenFavorites={() => openCatalog('favorite')}
        onOpenRanking={() => addToast({ type: 'info', message: '界域排行榜尚在编纂，当前可先探索八大世界。' })}
      />

      {viewMode === 'chronicles' ? (
        <>
          <main className="chronicles-main">
            <ChroniclesStage
              worlds={filteredWorlds}
              activeWorldId={activeWorldId}
              scrollX={scrollX}
              onScrollChange={handleManualScrollChange}
              onMetricsChange={handleMetricsChange}
              onWorldSelect={handleWorldSelect}
              onWorldAction={handleWorldAction}
              onStepScroll={handleStepScroll}
            />
          </main>

          <ChroniclesNavigator
            worlds={filteredWorlds}
            activeWorldId={activeWorldId}
            scrollProgress={scrollProgress}
            explorationPercent={WORLD_CHRONICLE_META.explorationPercent}
            exploredCount={exploredCount}
            totalWorldCount={WORLD_NODES.length}
            canPrev={activeWorldIndex > 0}
            canNext={activeWorldIndex >= 0 && activeWorldIndex < filteredWorlds.length - 1}
            onSelectNode={scrollToWorld}
            onScrollProgressChange={(progress) => handleManualScrollChange(-stageMetrics.maxScroll * progress)}
            onPrev={() => handleStepScroll('left')}
            onNext={() => handleStepScroll('right')}
            onResetLocation={handleResetLocation}
          />
        </>
      ) : (
        <main className="library-catalog-shell">
          <section className="library-catalog-intro" aria-labelledby="library-catalog-title">
            <div>
              <span>万卷在案 · 因果可寻</span>
              <h2 id="library-catalog-title">藏书总目</h2>
              <p>从世界长卷回到案前，检索典籍、查看研读进度，或将自己的故事收入卷中。</p>
            </div>
            <button type="button" className="library-import-button" onClick={() => setIsAddBookOpen(true)}>
              <Plus aria-hidden="true" />本地入卷
            </button>
          </section>

          <section className="library-catalog-toolbar" aria-label="藏书筛选与搜索">
            <div className="library-catalog-filters" role="toolbar" aria-label="筛选藏书">
              {CATALOG_FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.value}
                  className={catalogFilter === filter.value ? 'is-active' : ''}
                  aria-pressed={catalogFilter === filter.value}
                  onClick={() => setCatalogFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="library-catalog-search">
              <Search aria-hidden="true" />
              <span className="sr-only">搜索典籍</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索书名、作者或卷中名士"
              />
            </label>
          </section>

          {filteredBooks.length > 0 ? (
            <ScrollPavilionGrid
              books={filteredBooks}
              featuredBook={featuredBook}
              recentBooks={recentBooks}
              favoriteOverrides={favoriteMap}
              onSelectBook={openBook}
              onToggleFavorite={toggleFavorite}
              onOpenStory={() => navigate('/story')}
            />
          ) : (
            <section className="library-catalog-empty" aria-live="polite">
              <Search aria-hidden="true" />
              <h3>没有找到对应典籍</h3>
              <p>调整筛选条件或搜索词，亦可将新的故事收入卷中。</p>
            </section>
          )}
        </main>
      )}

      <BookDetailDrawer
        book={selectedBook}
        isOpen={isDrawerOpen}
        isFavorite={selectedBook ? isFavorite(selectedBook) : false}
        onClose={() => setIsDrawerOpen(false)}
        onToggleFavorite={toggleFavorite}
      />

      <Modal isOpen={isAddBookOpen} onClose={() => setIsAddBookOpen(false)} title="典籍入卷" size="lg">
        <div className="form-stack">
          <div className="inline-notice">
            <FilePlus2 aria-hidden="true" />
            <span>本次新增保存在当前前端会话，不会上传文件或调用 AI 服务。</span>
          </div>
          <label>
            <span>书名</span>
            <input
              className="field"
              value={newBook.title || ''}
              onChange={(event) => setNewBook({ ...newBook, title: event.target.value })}
              placeholder="请输入书名"
            />
          </label>
          <label>
            <span>作者</span>
            <input
              className="field"
              value={newBook.author || ''}
              onChange={(event) => setNewBook({ ...newBook, author: event.target.value })}
              placeholder="请输入作者"
            />
          </label>
          <label>
            <span>简介</span>
            <textarea
              className="field"
              rows={4}
              value={newBook.description || ''}
              onChange={(event) => setNewBook({ ...newBook, description: event.target.value })}
              placeholder="请输入典籍简介"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={() => setIsAddBookOpen(false)}>取消</button>
            <button
              type="button"
              className="button-primary"
              onClick={handleAddBook}
              disabled={!newBook.title?.trim() || !newBook.author?.trim()}
            >
              加入当前会话
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
