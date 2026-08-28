import { BookOpen, Heart, Users } from 'lucide-react'
import type { Book } from '@/types'

interface BookCardProps {
  book: Book
  progress: number
  isFavorite: boolean
  onOpen: () => void
  onToggleFavorite: () => void
}

const statusLabels = {
  not_started: '未开始',
  reading: '正在阅读',
  completed: '已完成',
} as const

export function BookCard({ book, progress, isFavorite, onOpen, onToggleFavorite }: BookCardProps) {
  return (
    <article className="book-card">
      <button
        type="button"
        onClick={onOpen}
        className="book-card-open"
        aria-label={`打开《${book.title}》`}
      >
        <div className="book-card-cover">
          {book.cover ? (
            <img src={book.cover} alt="" loading="lazy" />
          ) : (
            <div className="book-card-cover-fallback" aria-hidden="true">
              <BookOpen />
              <span>{book.title.slice(0, 4)}</span>
            </div>
          )}
          <span className="book-card-cover-shade" aria-hidden="true" />
          <span className={`book-card-status is-${book.readingStatus}`}>
            <span aria-hidden="true" />
            {statusLabels[book.readingStatus]}
          </span>
        </div>

        <div className="book-card-body">
          <div className="book-card-heading">
            <div>
              <span>{book.sourceType === 'classic' ? '名著典藏' : '本地入卷'}</span>
              <h3>{book.title}</h3>
            </div>
            <span>{book.author}</span>
          </div>

          <div className="book-card-meta">
            <span><Users aria-hidden="true" />{book.charactersExtracted.length} 位角色</span>
            <span>{book.wordCount.toLocaleString('zh-CN')} 字</span>
          </div>

          {book.totalChapters > 0 && (
            <div
              className="book-card-progress"
              role="progressbar"
              aria-label={`《${book.title}》阅读进度`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div>
                <span>第 {book.currentChapter} / {book.totalChapters} 章</span>
                <span>{progress}%</span>
              </div>
              <span aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
            </div>
          )}
        </div>

        <span className="book-card-open-cue" aria-hidden="true">入卷</span>
      </button>

      <button
        type="button"
        className={`book-card-favorite${isFavorite ? ' is-active' : ''}`}
        aria-label={isFavorite ? `取消收藏《${book.title}》` : `收藏《${book.title}》`}
        aria-pressed={isFavorite}
        onClick={onToggleFavorite}
      >
        <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  )
}
