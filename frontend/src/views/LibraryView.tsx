import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Clock3, FilePlus2, Plus, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookCard } from '@/components/BookCard'
import { Modal } from '@/components/Modal'
import { PageState } from '@/components/PageState'
import { useGameStore } from '@/store/gameStore'
import type { Book } from '@/types'

type LibraryFilter = 'all' | 'reading' | 'favorite' | 'completed' | 'upload'

const filters: { value: LibraryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'reading', label: '正在阅读' },
  { value: 'favorite', label: '已收藏' },
  { value: 'completed', label: '已完成' },
  { value: 'upload', label: '本地入卷' },
]

const demoBooks: Book[] = [
  {
    id: 'demo-xiyou', title: '西游记', author: '吴承恩', cover: '/library/xiyouji-sun-wukong.png',
    description: '西行取经与神魔劫难。每一次选择，都会让熟悉的西行路生出新的岔口。', fileUrl: '',
    wordCount: 820000, charactersExtracted: ['孙悟空', '唐僧', '猪八戒'], createdAt: '2026-08-16T08:00:00+08:00',
    updatedAt: '2026-08-26T10:20:00+08:00', sourceType: 'classic', readingStatus: 'reading',
    currentChapter: 4, totalChapters: 10, lastReadAt: '2026-08-26T10:20:00+08:00', isFavorite: true,
  },
  {
    id: 'demo-sanguo', title: '三国演义', author: '罗贯中', cover: '/library/sanguo-guanyu.png',
    description: '群雄逐鹿，谋略纵横。一封未曾送达的军令，正改变赤壁之前的局势。', fileUrl: '',
    wordCount: 730000, charactersExtracted: ['关羽', '诸葛亮', '曹操'], createdAt: '2026-08-12T08:00:00+08:00',
    updatedAt: '2026-08-25T22:10:00+08:00', sourceType: 'classic', readingStatus: 'reading',
    currentChapter: 2, totalChapters: 10, lastReadAt: '2026-08-25T22:10:00+08:00', isFavorite: false,
  },
  {
    id: 'demo-shuihu', title: '水浒传', author: '施耐庵', cover: '/library/shuihuzhuan-wusong.png',
    description: '梁山群雄的聚义与抉择。英雄名册已展开，故事尚待你落下第一笔。', fileUrl: '',
    wordCount: 740000, charactersExtracted: ['武松', '鲁智深', '林冲'], createdAt: '2026-08-10T08:00:00+08:00',
    updatedAt: '2026-08-10T08:00:00+08:00', sourceType: 'classic', readingStatus: 'not_started',
    currentChapter: 0, totalChapters: 10, lastReadAt: null, isFavorite: false,
  },
  {
    id: 'demo-honglou', title: '红楼梦', author: '曹雪芹', cover: '/library/hongloumeng-lindaiyu.png',
    description: '大观园中的情缘与兴衰。旧日选择已经封卷，仍可随时重读这一段浮生。', fileUrl: '',
    wordCount: 860000, charactersExtracted: ['林黛玉', '贾宝玉', '薛宝钗'], createdAt: '2026-07-28T08:00:00+08:00',
    updatedAt: '2026-08-20T18:30:00+08:00', sourceType: 'classic', readingStatus: 'completed',
    currentChapter: 10, totalChapters: 10, lastReadAt: '2026-08-20T18:30:00+08:00', isFavorite: true,
  },
  {
    id: 'demo-fengshen', title: '封神演义', author: '许仲琳', cover: '/library/fengshen-nezha.png',
    description: '商周易代与诸神封榜。风火轮尚未转动，封神台下已有名字隐约浮现。', fileUrl: '',
    wordCount: 610000, charactersExtracted: ['哪吒', '姜子牙', '妲己'], createdAt: '2026-08-06T08:00:00+08:00',
    updatedAt: '2026-08-06T08:00:00+08:00', sourceType: 'classic', readingStatus: 'not_started',
    currentChapter: 0, totalChapters: 10, lastReadAt: null, isFavorite: false,
  },
]

const statusLabels = {
  not_started: '未开始',
  reading: '正在阅读',
  completed: '已完成',
} as const

function getReadingProgress(book: Book) {
  if (book.totalChapters <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((book.currentChapter / book.totalChapters) * 100)))
}

function sortByLastRead(left: Book, right: Book) {
  return Date.parse(right.lastReadAt || right.updatedAt) - Date.parse(left.lastReadAt || left.updatedAt)
}

function formatLastRead(value: string | null) {
  if (!value) return '尚未启卷'
  const elapsed = Date.now() - Date.parse(value)
  if (!Number.isFinite(elapsed) || elapsed < 0) return '最近翻阅'
  const hours = Math.floor(elapsed / 3600000)
  if (hours < 1) return '刚刚翻阅'
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value))
}

export function LibraryView() {
  const navigate = useNavigate()
  const { books, addBook } = useGameStore()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all')
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBook, setNewBook] = useState<Partial<Book>>({})
  const allBooks = useMemo(() => [...books, ...demoBooks], [books])
  const isFavorite = (book: Book) => favoriteOverrides[book.id] ?? book.isFavorite

  const featuredBook = useMemo(() => (
    [...allBooks].filter((book) => book.readingStatus === 'reading').sort(sortByLastRead)[0]
    || [...allBooks].sort(sortByLastRead)[0]
  ), [allBooks])

  const recentBooks = useMemo(() => [...allBooks]
    .filter((book) => book.id !== featuredBook?.id && book.lastReadAt)
    .sort(sortByLastRead)
    .slice(0, 3), [allBooks, featuredBook?.id])

  const filteredBooks = useMemo(() => allBooks.filter((book) => {
    const keyword = query.trim().toLocaleLowerCase('zh-CN')
    const matchesQuery = !keyword
      || book.title.toLocaleLowerCase('zh-CN').includes(keyword)
      || book.author.toLocaleLowerCase('zh-CN').includes(keyword)
      || book.charactersExtracted.some((name) => name.toLocaleLowerCase('zh-CN').includes(keyword))
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'reading' && book.readingStatus === 'reading')
      || (activeFilter === 'favorite' && (favoriteOverrides[book.id] ?? book.isFavorite))
      || (activeFilter === 'completed' && book.readingStatus === 'completed')
      || (activeFilter === 'upload' && book.sourceType === 'upload')
    return matchesQuery && matchesFilter
  }), [activeFilter, allBooks, favoriteOverrides, query])

  const toggleFavorite = (book: Book) => {
    setFavoriteOverrides((current) => ({ ...current, [book.id]: !(current[book.id] ?? book.isFavorite) }))
  }

  const handleAddBook = () => {
    if (!newBook.title?.trim() || !newBook.author?.trim()) return
    const timestamp = new Date().toISOString()
    addBook({
      id: crypto.randomUUID(),
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      cover: '',
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
    setIsModalOpen(false)
  }

  return (
    <main className="page-shell library-page">
      <div className="page-container">
        <header className="page-header library-page-header">
          <div>
            <span className="section-kicker">典籍总目</span>
            <h1 className="page-title">书库</h1>
            <p className="page-lead">这里收录你曾进入的故事。人物、章节与选择，会在一次次翻阅中沉淀成可重返的世界。</p>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="button-primary">
            <Plus aria-hidden="true" />典籍入卷
          </button>
        </header>

        {featuredBook && (
          <section className="library-focus" aria-labelledby="library-focus-title">
            <article className="library-featured">
              <div className="library-featured-media">
                {featuredBook.cover ? (
                  <img src={featuredBook.cover} alt="" fetchPriority="high" />
                ) : (
                  <div className="library-featured-fallback" aria-hidden="true"><BookOpen /><span>{featuredBook.title}</span></div>
                )}
                <span className="library-featured-shade" aria-hidden="true" />
                <span className={`library-featured-status is-${featuredBook.readingStatus}`}>
                  <span aria-hidden="true" />{statusLabels[featuredBook.readingStatus]}
                </span>
              </div>

              <div className="library-featured-copy">
                <span className="section-kicker">续读案卷</span>
                <h2 id="library-focus-title">{featuredBook.title}</h2>
                <p className="library-featured-author">{featuredBook.author} · {featuredBook.sourceType === 'classic' ? '名著典藏' : '本地入卷'}</p>
                <p>{featuredBook.description}</p>

                <div className="library-featured-meta">
                  <span><Users aria-hidden="true" />{featuredBook.charactersExtracted.length} 位角色</span>
                  <span>{featuredBook.wordCount.toLocaleString('zh-CN')} 字</span>
                  <span>{formatLastRead(featuredBook.lastReadAt)}</span>
                </div>

                {featuredBook.totalChapters > 0 && (
                  <div
                    className="library-featured-progress"
                    role="progressbar"
                    aria-label={`《${featuredBook.title}》阅读进度`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={getReadingProgress(featuredBook)}
                  >
                    <div><span>第 {featuredBook.currentChapter} / {featuredBook.totalChapters} 章</span><span>{getReadingProgress(featuredBook)}%</span></div>
                    <span aria-hidden="true"><span style={{ width: `${getReadingProgress(featuredBook)}%` }} /></span>
                  </div>
                )}

                <button type="button" className="button-primary library-continue" onClick={() => navigate('/story')}>
                  {featuredBook.readingStatus === 'reading' ? '继续阅读' : '进入典籍'}<ArrowRight aria-hidden="true" />
                </button>
              </div>
            </article>

            <aside className="library-recent" aria-labelledby="library-recent-title">
              <div className="library-recent-heading">
                <div><Clock3 aria-hidden="true" /><h2 id="library-recent-title">最近翻阅</h2></div>
                <span>{recentBooks.length} 卷</span>
              </div>
              <div className="library-recent-list">
                {recentBooks.map((book) => (
                  <button type="button" key={book.id} onClick={() => navigate('/story')} aria-label={`继续阅读《${book.title}》`}>
                    <span>{statusLabels[book.readingStatus]}</span>
                    <strong>{book.title}</strong>
                    <small>{book.author} · {formatLastRead(book.lastReadAt)}</small>
                    <ArrowRight aria-hidden="true" />
                  </button>
                ))}
                {recentBooks.length === 0 && <p>尚无最近翻阅记录，从下方选择一部典籍开始。</p>}
              </div>
            </aside>
          </section>
        )}

        <section className="library-archive" aria-labelledby="library-archive-title">
          <div className="library-archive-heading">
            <div>
              <h2 id="library-archive-title">全部藏卷</h2>
              <p>按阅读状态、收藏与来源快速找到下一段故事。</p>
            </div>
            <span><BookOpen aria-hidden="true" />{filteredBooks.length} / {allBooks.length} 部</span>
          </div>

          <div className="library-toolbar">
            <div className="library-filters" role="toolbar" aria-label="筛选藏书">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter.value}
                  className={activeFilter === filter.value ? 'is-active' : ''}
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="search-field library-search">
              <Search aria-hidden="true" />
              <span className="sr-only">搜索典籍</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书名、作者或角色" />
            </label>
          </div>

          {filteredBooks.length === 0 ? (
            <PageState kind="empty" title="没有找到对应典籍" message="调整搜索词或筛选条件后再试。" icon={BookOpen} />
          ) : (
            <div className="library-grid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  progress={getReadingProgress(book)}
                  isFavorite={isFavorite(book)}
                  onOpen={() => navigate('/story')}
                  onToggleFavorite={() => toggleFavorite(book)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="典籍入卷">
        <div className="form-stack">
          <div className="inline-notice"><FilePlus2 aria-hidden="true" /><span>本次新增仅保存在当前前端会话，不会上传到受保护接口。</span></div>
          <label><span>书名</span><input className="field" value={newBook.title || ''} onChange={(event) => setNewBook({ ...newBook, title: event.target.value })} placeholder="请输入书名" /></label>
          <label><span>作者</span><input className="field" value={newBook.author || ''} onChange={(event) => setNewBook({ ...newBook, author: event.target.value })} placeholder="请输入作者" /></label>
          <label><span>简介</span><textarea className="field" rows={4} value={newBook.description || ''} onChange={(event) => setNewBook({ ...newBook, description: event.target.value })} placeholder="请输入书籍简介" /></label>
          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={() => setIsModalOpen(false)}>取消</button>
            <button type="button" className="button-primary" onClick={handleAddBook} disabled={!newBook.title?.trim() || !newBook.author?.trim()}>加入当前会话</button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
