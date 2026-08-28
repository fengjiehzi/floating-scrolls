import { create } from 'zustand'
import type {
  AIConfig,
  BattleResult,
  BattleState,
  Book,
  Character,
  Item,
  LoadStatus,
  ToastMessage,
} from '@/types'
import { fetchCharacters } from '@/services/characterApi'
import { fetchItems } from '@/services/itemApi'

interface GameStore {
  characters: Character[]
  charactersStatus: LoadStatus
  charactersError: string | null
  items: Item[]
  itemsStatus: LoadStatus
  itemsError: string | null
  books: Book[]
  battle: BattleState
  battleResult: BattleResult | null
  preferredFighterId: string | null
  aiConfig: AIConfig
  currentView: 'welcome' | 'library' | 'characters' | 'items' | 'battle' | 'story' | 'settings'
  toasts: ToastMessage[]

  addCharacter: (character: Character) => void
  loadCharacters: (force?: boolean) => Promise<void>
  loadItems: (force?: boolean) => Promise<void>
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  addBook: (book: Book) => void
  removeBook: (id: string) => void
  updateBattleState: (state: Partial<BattleState>) => void
  startBattle: (player: Character, enemy: Character) => void
  endBattle: (winner: 'player' | 'enemy') => void
  resetBattle: () => void
  setPreferredFighter: (id: string | null) => void
  addBattleLog: (log: Omit<BattleState['logs'][0], 'id' | 'timestamp'>) => void
  updateAIConfig: (config: Partial<AIConfig>) => void
  setCurrentView: (view: GameStore['currentView']) => void
  addToast: (message: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

const emptyBattle: BattleState = {
  isActive: false,
  round: 0,
  player: null,
  enemy: null,
  playerHealth: 100,
  enemyHealth: 100,
  logs: [],
  isPlayerTurn: true,
  winner: null,
}

export const useGameStore = create<GameStore>((set, get) => ({
  characters: [],
  charactersStatus: 'idle',
  charactersError: null,
  items: [],
  itemsStatus: 'idle',
  itemsError: null,
  books: [],
  battle: emptyBattle,
  battleResult: null,
  preferredFighterId: null,
  aiConfig: {
    apiKey: '',
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
  },
  currentView: 'welcome',
  toasts: [],

  addCharacter: (character) => set((state) => ({ characters: [...state.characters, character] })),

  loadCharacters: async (force = false) => {
    const status = get().charactersStatus
    if (!force && (status === 'loading' || status === 'success')) return

    set({ charactersStatus: 'loading', charactersError: null })
    try {
      const characters = await fetchCharacters()
      set({ characters, charactersStatus: 'success' })
    } catch (error) {
      set({
        charactersStatus: 'error',
        charactersError: error instanceof Error ? error.message : '角色数据加载失败',
      })
    }
  },

  loadItems: async (force = false) => {
    const status = get().itemsStatus
    if (!force && (status === 'loading' || status === 'success')) return

    set({ itemsStatus: 'loading', itemsError: null })
    try {
      const items = await fetchItems()
      set({ items, itemsStatus: 'success' })
    } catch (error) {
      set({
        itemsStatus: 'error',
        itemsError: error instanceof Error ? error.message : '法宝数据加载失败',
      })
    }
  },

  removeCharacter: (id) => set((state) => ({
    characters: state.characters.filter((character) => character.id !== id),
  })),

  updateCharacter: (id, updates) => set((state) => ({
    characters: state.characters.map((character) => (
      character.id === id ? { ...character, ...updates } : character
    )),
  })),

  addBook: (book) => set((state) => ({ books: [...state.books, book] })),
  removeBook: (id) => set((state) => ({ books: state.books.filter((book) => book.id !== id) })),
  updateBattleState: (updates) => set((state) => ({ battle: { ...state.battle, ...updates } })),

  startBattle: (player, enemy) => set({
    battleResult: null,
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

  endBattle: (winner) => set((state) => {
    const { battle } = state
    if (!battle.player || !battle.enemy || battle.winner) return state

    const damageDealt = battle.logs.reduce((total, log) => (
      log.type === 'damage' && log.data?.attacker === battle.player?.name
        ? total + (log.data?.damage || 0)
        : total
    ), 0)
    const damageTaken = battle.logs.reduce((total, log) => (
      log.type === 'damage' && log.data?.attacker === battle.enemy?.name
        ? total + (log.data?.damage || 0)
        : total
    ), 0)
    const healing = battle.logs.reduce((total, log) => total + (log.data?.amount || 0), 0)

    return {
      battle: { ...battle, isActive: false, winner },
      battleResult: {
        id: crypto.randomUUID(),
        winner,
        player: battle.player,
        enemy: battle.enemy,
        rounds: battle.round,
        damageDealt,
        damageTaken,
        healing,
        keyMoments: battle.logs
          .filter((log) => ['damage', 'heal', 'round', 'end'].includes(log.type))
          .slice(-6),
        rewards: {
          experience: winner === 'player' ? 120 + battle.round * 8 : 30,
          ...(winner === 'player' && { itemName: '残卷墨印' }),
        },
        completedAt: Date.now(),
      },
    }
  }),

  resetBattle: () => set({ battle: { ...emptyBattle }, battleResult: null }),
  setPreferredFighter: (id) => set({ preferredFighterId: id }),

  addBattleLog: (log) => set((state) => ({
    battle: {
      ...state.battle,
      logs: [
        ...state.battle.logs,
        { ...log, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    },
  })),

  updateAIConfig: (config) => set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),
  setCurrentView: (view) => set({ currentView: view }),
  addToast: (message) => set((state) => ({
    toasts: [...state.toasts, { ...message, id: crypto.randomUUID() }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),
}))
