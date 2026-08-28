import type { Character, Item } from '@/types'

type Rarity = Character['rarity'] | Item['rarity']

const labels: Record<Rarity, string> = {
  legendary: '传说',
  epic: '史诗',
  rare: '稀有',
  common: '普通',
}

interface RarityBadgeProps {
  rarity: Rarity
}

export function RarityBadge({ rarity }: RarityBadgeProps) {
  return <span className={`rarity-badge rarity-${rarity}`}>{labels[rarity]}</span>
}
