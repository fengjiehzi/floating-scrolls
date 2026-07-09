export interface Skill {
  id: string
  name: string
  description: string
  damage: number
  cooldown: number
  currentCooldown: number
  manaCost: number
  type: 'attack' | 'defense' | 'heal' | 'buff' | 'debuff'
  effect: string
  icon: string
}
