import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  BookOpen,
  Swords,
  Heart,
  Sparkles,
  Users,
  Shield,
  Clock,
  Compass,
  CheckCircle2,
  Lock,
  Unlock,
  Scroll,
} from 'lucide-react'
import type { Book } from '@/types'

interface BookDetailDrawerProps {
  book: Book | null
  isOpen: boolean
  isFavorite: boolean
  onClose: () => void
  onToggleFavorite: (book: Book) => void
}

export function BookDetailDrawer({
  book,
  isOpen,
  isFavorite,
  onClose,
  onToggleFavorite,
}: BookDetailDrawerProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!book) return null

  const progressPercent = book.totalChapters > 0
    ? Math.min(100, Math.max(0, Math.round((book.currentChapter / book.totalChapters) * 100)))
    : 0

  const handleStartStory = () => {
    onClose()
    navigate('/story')
  }

  const handleGoBattle = () => {
    onClose()
    navigate('/battle')
  }

  return (
    <>
      {/* 遮罩背景 */}
      <div
        className={`drawer-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 侧边滑出抽屉 */}
      <aside
        className={`book-drawer-panel ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${book.title} 卷宗秘录`}
      >
        {/* 顶部艺术封面与关闭按钮 */}
        <div
          className="drawer-header-art"
          style={{ backgroundImage: `url(${book.bannerImage || book.cover})` }}
        >
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(book)}
              className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                isFavorite
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-400'
                  : 'bg-black/60 border-white/20 text-stone-300 hover:text-white hover:border-amber-400/50'
              }`}
              title={isFavorite ? '取消收藏' : '加入珍藏'}
              aria-label={isFavorite ? '取消收藏' : '加入珍藏'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-stone-300 hover:text-white hover:border-amber-400/50 transition-all"
              aria-label="关闭卷宗"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 封面浮动信息 */}
          <div className="absolute bottom-4 left-6 right-6 z-10">
            <div className="flex items-center gap-2 mb-1.5">
              {book.dynasty && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 border border-amber-500/40 text-amber-300">
                  {book.dynasty}
                </span>
              )}
              {book.genre && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-900/80 border border-stone-700 text-stone-300">
                  {book.genre}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                book.readingStatus === 'reading'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : book.readingStatus === 'completed'
                  ? 'bg-amber-950/80 border border-amber-500/40 text-amber-200'
                  : 'bg-stone-800/80 border border-stone-600 text-stone-400'
              }`}>
                {book.readingStatus === 'reading' ? '正在研读' : book.readingStatus === 'completed' ? '已全卷通读' : '尚未启卷'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-wide drop-shadow-md">
              {book.title}
            </h2>
            <p className="text-xs text-amber-200/80 font-serif mt-0.5">
              著：{book.author} · 约 {(book.wordCount / 10000).toFixed(1)} 万字
            </p>
          </div>
        </div>

        {/* 抽屉滚动内容 */}
        <div className="drawer-body-scroll space-y-6">
          {/* 原著经典判词 */}
          {book.quote && (
            <div className="p-3.5 rounded-lg bg-amber-950/20 border-l-2 border-amber-400/80 text-amber-100/90 text-sm font-serif italic leading-relaxed">
              “{book.quote}”
            </div>
          )}

          {/* 典籍简介 */}
          <div className="space-y-2">
            <h3 className="text-xs font-serif uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
              <Scroll className="w-3.5 h-3.5" /> 典籍总纲 · 缘起
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed font-sans font-light">
              {book.description}
            </p>
          </div>

          {/* 阅读进度卡片 */}
          <div className="p-3.5 rounded-lg bg-stone-900/60 border border-amber-900/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                研读进度：第 {book.currentChapter} / {book.totalChapters} 回
              </span>
              <div className="w-48 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-base font-serif font-semibold text-amber-300 tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* 解构名士席位 */}
          {book.characterList && book.characterList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-serif uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 卷中名士 ({book.characterList.length})
                </h3>
                <button
                  onClick={() => {
                    onClose()
                    navigate('/characters')
                  }}
                  className="text-xs text-stone-400 hover:text-amber-300 transition-colors"
                >
                  查看全部名士 &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {book.characterList.map((char) => (
                  <div
                    key={char.name}
                    onClick={() => {
                      onClose()
                      navigate(char.id ? `/characters/${char.id}` : '/characters')
                    }}
                    className="group p-2 rounded-lg bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-800/80 transition-all cursor-pointer flex items-center gap-2.5"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-400/30 flex-shrink-0">
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {char.grade && (
                        <span className="absolute bottom-0 right-0 text-[9px] px-1 bg-amber-500 text-black font-bold rounded-tl">
                          {char.grade}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-serif text-stone-200 group-hover:text-amber-200 truncate">
                        {char.name}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {char.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 镇卷法宝槽位 */}
          {book.itemList && book.itemList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-serif uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 镇卷法宝 ({book.itemList.length})
                </h3>
                <button
                  onClick={() => {
                    onClose()
                    navigate('/items')
                  }}
                  className="text-xs text-stone-400 hover:text-amber-300 transition-colors"
                >
                  法宝藏阁 &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {book.itemList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/90 flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-semibold text-stone-200">
                          {item.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-mono ${
                          item.rarity === 'mythic'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                            : item.rarity === 'legendary'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/50'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-600/50'
                        }`}>
                          {item.rarity}
                        </span>
                      </div>
                      {item.desc && (
                        <p className="text-[11px] text-stone-400 mt-0.5 font-light">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 章节因果树 */}
          {book.chapters && book.chapters.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-serif uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> 章节推演脉络
              </h3>

              <div className="space-y-3 pt-1">
                {book.chapters.map((chap) => (
                  <div key={chap.id} className="chapter-node-line">
                    <div
                      className={`chapter-dot ${
                        chap.status === 'completed'
                          ? 'is-completed'
                          : chap.status === 'unlocked'
                          ? 'is-unlocked'
                          : ''
                      }`}
                    >
                      {chap.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                      {chap.status === 'unlocked' && <Unlock className="w-2 h-2 text-emerald-400" />}
                      {chap.status === 'locked' && <Lock className="w-2 h-2 text-stone-600" />}
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-900/40 border border-stone-800/80 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-medium text-stone-200">
                          第 {chap.number} 回 · {chap.title}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {chap.status === 'completed' ? '已通关' : chap.status === 'unlocked' ? '可探索' : '封印'}
                        </span>
                      </div>
                      {chap.summary && (
                        <p className="text-[11px] text-stone-400 mt-1 font-light leading-relaxed">
                          {chap.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 抽屉底部固定主操作栏 */}
        <div className="p-4 bg-black/90 border-t border-amber-900/30 flex items-center gap-3">
          <button
            onClick={handleStartStory}
            className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-serif font-semibold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {book.readingStatus === 'reading' ? '继续推演剧情' : '以此卷入局'}
          </button>

          <button
            onClick={handleGoBattle}
            className="py-2.5 px-4 rounded-lg bg-stone-900 border border-amber-500/40 text-amber-200 font-serif text-sm hover:bg-stone-800 hover:border-amber-400 transition-all flex items-center gap-1.5"
            title="携本卷收录名士前往对决"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            名士集结
          </button>
        </div>
      </aside>
    </>
  )
}
