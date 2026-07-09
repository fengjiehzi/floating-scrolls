export interface CharacterStats {
  attack: number
  defense: number
  health: number
  maxHealth: number
  speed: number
  critRate: number
  critDamage: number
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
  forms: CharacterForm[]
  currentFormIndex: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  type: 'myth' | 'human' | 'spirit' | 'demon'
}
