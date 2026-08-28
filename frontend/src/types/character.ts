export interface CharacterStats {
  attack: number
  defense: number
  health: number
  maxHealth: number
  speed: number
  intelligence: number
  specialAbility: number
  mana: number
  maxMana: number
  critRate?: number
  critDamage?: number
}

export interface CharacterSkill {
  id: string
  name: string
  type: string
  description: string
  multiplier: number
  manaCost: number
  narration: string
}

export interface CharacterForm {
  id: string
  name: string
  stats: Partial<CharacterStats>
  skills: string[]
  description: string
}

export interface Character {
  id: string
  name: string
  originBook: string
  originBookId: string
  description: string
  avatar: string
  stats: CharacterStats
  skills: CharacterSkill[]
  forms: CharacterForm[]
  currentFormIndex: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  grade: 'S' | 'A' | 'B' | 'C'
  combatPower: number
  type?: 'myth' | 'human' | 'spirit' | 'demon'
}
