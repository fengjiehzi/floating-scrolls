import { useState } from 'react'
import { Plus, Search, BookOpen } from 'lucide-react'
import { BookCard } from '@/components/BookCard'
import { Modal } from '@/components/Modal'
import { useGameStore } from '@/store/gameStore'
import type { Book } from '@/types'

export function LibraryView() {
  const { books, addBook } = useGameStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBook, setNewBook] = useState<Partial<Book>>({})

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddBook = () => {
    if (newBook.title && newBook.author) {
      addBook({
        id: crypto.randomUUID(),
        title: newBook.title,
        author: newBook.author,
        cover: '',
        description: newBook.description || '',
        fileUrl: '',
        wordCount: newBook.wordCount || 0,
        charactersExtracted: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setNewBook({})
      setIsModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-2">书库</h1>
            <p className="text-text-secondary">管理你的古籍典藏，提取传奇角色</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border border-border-gold rounded-lg text-accent-gold hover:from-accent-gold/30 hover:to-border-gold/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>上传书籍</span>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="搜索书籍..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-text-muted/30 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-border-gold/50 transition-colors"
          />
        </div>

        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-20 h-20 text-text-muted/30 mb-4" />
            <p className="text-text-secondary text-lg">暂无书籍</p>
            <p className="text-text-muted text-sm">点击上方按钮上传第一本书籍</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="上传书籍">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">书名</label>
            <input
              type="text"
              value={newBook.title || ''}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              className="w-full px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-border-gold/50"
              placeholder="请输入书名"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">作者</label>
            <input
              type="text"
              value={newBook.author || ''}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              className="w-full px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-border-gold/50"
              placeholder="请输入作者"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">简介</label>
            <textarea
              value={newBook.description || ''}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              className="w-full px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-border-gold/50 resize-none"
              rows={3}
              placeholder="请输入书籍简介"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddBook}
              disabled={!newBook.title || !newBook.author}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border border-border-gold rounded-lg text-accent-gold disabled:opacity-50 disabled:cursor-not-allowed hover:from-accent-gold/30 hover:to-border-gold/30 transition-all"
            >
              上传
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
