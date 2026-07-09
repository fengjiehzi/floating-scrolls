import { BookOpen, Users } from 'lucide-react'
import type { Book } from '@/types'

interface BookCardProps {
  book: Book
  onClick?: () => void
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative bg-gradient-card border border-border-gold/20 rounded-xl overflow-hidden card-shadow hover:border-border-gold/50 hover:glow-gold transition-all duration-300 cursor-pointer group"
    >
      <div className="relative h-32 bg-bg-secondary overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-border-gold/30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-text-primary mb-1 truncate group-hover:text-gradient-gold transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-text-secondary mb-3 truncate">{book.author}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Users className="w-3 h-3" />
            <span>{book.charactersExtracted.length} 角色</span>
          </div>
          <span className="text-xs text-text-muted">{book.wordCount.toLocaleString()} 字</span>
        </div>
      </div>
    </div>
  )
}
