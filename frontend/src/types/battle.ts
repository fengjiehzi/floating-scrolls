import type { Character } from './character'

export interface BattleLog {
  id: string
  timestamp: number
  message: string
  type: 'damage' | 'heal' | 'skill' | 'buff' | 'debuff' | 'round' | 'end'
  data?: {
    attacker?: string
    target?: string
    damage?: number
    skillName?: string
    isCritical?: boolean
    amount?: number
    buffName?: string
    duration?: number
  }
}

export interface BattleState {
  isActive: boolean
  round: number
  player: Character | null
  enemy: Character | null
  playerHealth: number
  enemyHealth: number
  logs: BattleLog[]
  isPlayerTurn: boolean
  winner: 'player' | 'enemy' | null
}
