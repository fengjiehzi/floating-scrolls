import { create } from 'zustand'
import type { Character, Book, BattleState, AIConfig, ToastMessage } from '@/types'

interface GameStore {
  characters: Character[]
  books: Book[]
  battle: BattleState
  aiConfig: AIConfig
  currentView: 'welcome' | 'library' | 'characters' | 'battle' | 'story' | 'settings'
  toasts: ToastMessage[]
  
  addCharacter: (character: Character) => void
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  addBook: (book: Book) => void
  removeBook: (id: string) => void
  updateBattleState: (state: Partial<BattleState>) => void
  startBattle: (player: Character, enemy: Character) => void
  endBattle: (winner: 'player' | 'enemy') => void
  addBattleLog: (log: Omit<BattleState['logs'][0], 'id' | 'timestamp'>) => void
  updateAIConfig: (config: Partial<AIConfig>) => void
  setCurrentView: (view: GameStore['currentView']) => void
  addToast: (message: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

export const useGameStore = create<GameStore>((set) => ({
  characters: [],
  books: [],
  battle: {
    isActive: false,
    round: 0,
    player: null,
    enemy: null,
    playerHealth: 100,
    enemyHealth: 100,
    logs: [],
    isPlayerTurn: true,
    winner: null,
  },
  aiConfig: {
    apiKey: '',
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
  },
  currentView: 'welcome',
  toasts: [],

  addCharacter: (character) =>
    set((state) => ({
      characters: [...state.characters, character],
    })),

  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
    })),

  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  addBook: (book) =>
    set((state) => ({
      books: [...state.books, book],
    })),

  removeBook: (id) =>
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
    })),

  updateBattleState: (state) =>
    set((prev) => ({
      battle: { ...prev.battle, ...state },
    })),

  startBattle: (player, enemy) =>
    set({
      battle: {
        isActive: true,
        round: 1,
        player,
        enemy,
        playerHealth: player.stats.maxHealth,
        enemyHealth: enemy.stats.maxHealth,
        logs: [],
        isPlayerTurn: player.stats.speed >= enemy.stats.speed,
        winner: null,
      },
    }),

  endBattle: (winner) =>
    set((state) => ({
      battle: {
        ...state.battle,
        isActive: false,
        winner,
      },
    })),

  addBattleLog: (log) =>
    set((state) => ({
      battle: {
        ...state.battle,
        logs: [
          ...state.battle.logs,
          { ...log, id: crypto.randomUUID(), timestamp: Date.now() },
        ],
      },
    })),

  updateAIConfig: (config) =>
    set((state) => ({
      aiConfig: { ...state.aiConfig, ...config },
    })),

  setCurrentView: (view) => set({ currentView: view }),

  addToast: (message) =>
    set((state) => ({
      toasts: [...state.toasts, { ...message, id: crypto.randomUUID() }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
