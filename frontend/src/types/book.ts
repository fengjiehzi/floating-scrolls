export type BookSourceType = 'classic' | 'upload'
export type BookReadingStatus = 'not_started' | 'reading' | 'completed'

export interface Book {
  id: string
  title: string
  author: string
  cover: string
  description: string
  fileUrl: string
  wordCount: number
  charactersExtracted: string[]
  createdAt: string
  updatedAt: string
  sourceType: BookSourceType
  readingStatus: BookReadingStatus
  currentChapter: number
  totalChapters: number
  lastReadAt: string | null
  isFavorite: boolean
}
