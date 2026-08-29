export type BookSourceType = 'classic' | 'upload'
export type BookReadingStatus = 'not_started' | 'reading' | 'completed'

export interface BookChapter {
  id: string
  number: number
  title: string
  summary?: string
  status: 'locked' | 'unlocked' | 'completed'
}

export interface BookCharacterRef {
  id?: string | number
  name: string
  title: string
  avatar: string
  grade?: string
}

export interface BookItemRef {
  id: string | number
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  desc?: string
}

export interface Book {
  id: string
  title: string
  author: string
  cover: string
  bannerImage?: string
  description: string
  quote?: string
  genre?: string
  dynasty?: string
  fileUrl: string
  wordCount: number
  charactersExtracted: string[]
  characterList?: BookCharacterRef[]
  itemList?: BookItemRef[]
  chapters?: BookChapter[]
  createdAt: string
  updatedAt: string
  sourceType: BookSourceType
  readingStatus: BookReadingStatus
  currentChapter: number
  totalChapters: number
  lastReadAt: string | null
  isFavorite: boolean
  colorTheme?: string
  realmTag?: string
}
