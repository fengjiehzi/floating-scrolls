import { ArrowRight, BookOpen, Clock, Heart, Users, Sparkles, ScrollText, CheckCircle } from 'lucide-react'
import type { Book } from '@/types'

interface ScrollPavilionGridProps {
  books: Book[]
  featuredBook: Book | null
  recentBooks: Book[]
  favoriteOverrides: Record<string, boolean>
  onSelectBook: (book: Book) => void
  onToggleFavorite: (book: Book) => void
  onOpenStory: (book: Book) => void
}

export function ScrollPavilionGrid({
  books,
  featuredBook,
  recentBooks,
  favoriteOverrides,
  onSelectBook,
  onToggleFavorite,
  onOpenStory,
}: ScrollPavilionGridProps) {
  const isFavorite = (book: Book) => favoriteOverrides[book.id] ?? book.isFavorite

  const getProgress = (book: Book) => {
    if (book.totalChapters <= 0) return 0
    return Math.min(100, Math.max(0, Math.round((book.currentChapter / book.totalChapters) * 100)))
  }

  return (
    <div className="space-y-10">
      {/* 顶部主展台与近期翻阅：非对称二栏布局 */}
      {featuredBook && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧主案卷续读展台 (占据 8 列) */}
          <div className="lg:col-span-8 library-podium-card p-6 sm:p-8 flex flex-col justify-between">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-serif bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {featuredBook.readingStatus === 'reading' ? '案上续读' : '典籍荐读'}
                  </span>
                  {featuredBook.realmTag && (
                    <span className="px-2 py-0.5 rounded text-[11px] bg-stone-900/80 border border-stone-700 text-stone-300">
                      {featuredBook.realmTag}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onToggleFavorite(featuredBook)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${
                    isFavorite(featuredBook)
                      ? 'text-rose-400 hover:text-rose-300'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  aria-label="收藏典籍"
                >
                  <Heart className={`w-4 h-4 ${isFavorite(featuredBook) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* 封面立绘缩略 */}
                <div
                  onClick={() => onSelectBook(featuredBook)}
                  className="w-28 sm:w-36 h-40 sm:h-48 rounded-lg overflow-hidden flex-shrink-0 shadow-2xl border border-amber-400/30 cursor-pointer group relative"
                >
                  <img
                    src={featuredBook.cover}
                    alt={featuredBook.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] text-amber-200/90 font-serif">
                    点击查阅秘卷
                  </span>
                </div>

                {/* 文本与进度信息 */}
                <div className="flex-1 space-y-2.5">
                  <h2
                    onClick={() => onSelectBook(featuredBook)}
                    className="text-2xl sm:text-3xl font-serif text-white hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {featuredBook.title}
                  </h2>

                  <p className="text-xs text-amber-200/80 font-serif">
                    【{featuredBook.dynasty || '古典'}】{featuredBook.author} 著 · 约 {(featuredBook.wordCount / 10000).toFixed(1)} 万字
                  </p>

                  {featuredBook.quote && (
                    <p className="text-xs text-stone-300/90 font-serif italic border-l border-amber-500/40 pl-2 line-clamp-2">
                      “{featuredBook.quote}”
                    </p>
                  )}

                  <p className="text-xs text-stone-400 line-clamp-2 font-light leading-relaxed">
                    {featuredBook.description}
                  </p>

                  {/* 进度条 */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span className="flex items-center gap-1 font-serif">
                        <Clock className="w-3 h-3 text-amber-400" />
                        第 {featuredBook.currentChapter} 回 / 共 {featuredBook.totalChapters} 回
                      </span>
                      <span className="text-amber-300 font-mono font-medium">
                        {getProgress(featuredBook)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-800/90 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${getProgress(featuredBook)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮栏 */}
            <div className="relative z-10 pt-6 mt-4 border-t border-amber-900/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>收录名士：{featuredBook.charactersExtracted.join('、')}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onSelectBook(featuredBook)}
                  className="px-4 py-2 rounded-lg bg-stone-900 border border-amber-400/30 text-amber-200 text-xs font-serif hover:border-amber-400 transition-all"
                >
                  典籍秘卷
                </button>
                <button
                  onClick={() => onOpenStory(featuredBook)}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-serif font-semibold hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-1.5 shadow-md shadow-amber-900/40"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {featuredBook.readingStatus === 'reading' ? '继续推演' : '启卷入局'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 右侧近期翻阅 (占据 4 列) */}
          <div className="lg:col-span-4 rounded-xl bg-stone-950/80 border border-stone-800 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-xs font-serif uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5" /> 近期翻阅
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  {recentBooks.length} 卷在案
                </span>
              </div>

              <div className="space-y-2.5">
                {recentBooks.length > 0 ? (
                  recentBooks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBook(b)}
                      className="group p-3 rounded-lg bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/40 hover:bg-stone-900 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={b.cover}
                          alt={b.title}
                          className="w-9 h-12 rounded object-cover border border-stone-700 group-hover:scale-105 transition-transform flex-shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-serif text-stone-200 group-hover:text-amber-200 truncate">
                            {b.title}
                          </p>
                          <p className="text-[11px] text-stone-400 truncate">
                            第 {b.currentChapter} 回 · {b.author}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-500 group-hover:text-amber-300 transition-colors">
                        <span className="text-xs font-mono">{getProgress(b)}%</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-stone-500 font-serif">
                    尚无其他研读记录，请在下方挑选题典
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-900 text-center">
              <p className="text-[11px] text-stone-500 font-serif">
                每一次翻阅，都会在因果树上留存印记
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 藏书阁 3D 典籍网格 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif text-stone-200 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-sm" />
            藏阁全帙 ({books.length})
          </h3>
          <span className="text-xs text-stone-500 font-serif">
            点击任意书卷展开秘录或开始推演
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => {
            const prog = getProgress(book)
            return (
              <div key={book.id} className="book-3d-wrapper">
                <div
                  className="book-3d-card group cursor-pointer h-full flex flex-col justify-between"
                  onClick={() => onSelectBook(book)}
                >
                  {/* 线装书书脊装订线 */}
                  <div className="book-spine-stitch" />
                  <div className="book-sheen-overlay" />

                  {/* 封面区 */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120e0c] via-black/30 to-transparent" />

                    {/* 顶部标签与收藏 */}
                    <div className="absolute top-3 left-4 right-3 flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5">
                        {book.dynasty && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 backdrop-blur-md border border-white/20 text-amber-200">
                            {book.dynasty}
                          </span>
                        )}
                        {book.readingStatus === 'completed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 border border-amber-400/40 text-amber-200 flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> 完卷
                          </span>
                        )}
                      </div>

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

                    {/* 封面底部标题 */}
                    <div className="absolute bottom-2 left-5 right-3 z-10">
                      <h4 className="text-xl font-serif text-white group-hover:text-amber-300 transition-colors drop-shadow">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-amber-200/80 font-serif">
                        {book.author} 著 · {book.genre || '典籍'}
                      </p>
                    </div>
                  </div>

                  {/* 信息与操作区 */}
                  <div className="p-4 pl-6 space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-stone-400 line-clamp-2 font-light leading-relaxed">
                      {book.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-stone-800/80">
                      {/* 进度 */}
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-serif">
                        <span>
                          {book.readingStatus === 'reading'
                            ? `研读中 · 第 ${book.currentChapter} / ${book.totalChapters} 回`
                            : book.readingStatus === 'completed'
                            ? '已通读全卷'
                            : '尚未启卷'}
                        </span>
                        <span className="font-mono text-amber-300/90">{prog}%</span>
                      </div>
                      <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400/80 rounded-full transition-all duration-300"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>

                    {/* 底部按钮 */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-stone-500 font-serif flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        {book.charactersExtracted.length} 位名士
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenStory(book)
                        }}
                        className="px-3 py-1.5 rounded bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-serif transition-all flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        推演
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
