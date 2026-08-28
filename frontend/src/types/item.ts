export interface ItemStatsBonus {
  power?: number
  speed?: number
  intelligence?: number
  defense?: number
  specialAbility?: number
  health?: number
  mana?: number
}

export interface Item {
  id: string
  name: string
  source: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  type: 'weapon' | 'armor' | 'accessory' | 'treasure' | string
  image: string
  description: string
  statsBonus: ItemStatsBonus
  skillBonus: string
  sourceBasis: string
}
