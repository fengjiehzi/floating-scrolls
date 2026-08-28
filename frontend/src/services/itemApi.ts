import type { Item, ItemStatsBonus } from '@/types'

interface ApiItem {
  id: number | string
  name: string
  source: string
  rarity: Item['rarity']
  type: string
  image?: string | null
  description?: string | null
  stats_bonus?: Record<string, number>
  skill_bonus?: string | null
  source_basis?: string | null
}

function mapStatsBonus(stats: Record<string, number> = {}): ItemStatsBonus {
  return {
    ...(stats.power !== undefined && { power: stats.power }),
    ...(stats.speed !== undefined && { speed: stats.speed }),
    ...(stats.intelligence !== undefined && { intelligence: stats.intelligence }),
    ...(stats.defense !== undefined && { defense: stats.defense }),
    ...(stats.special_ability !== undefined && { specialAbility: stats.special_ability }),
    ...(stats.hp !== undefined && { health: stats.hp }),
    ...(stats.mp !== undefined && { mana: stats.mp }),
  }
}

function mapItem(item: ApiItem): Item {
  return {
    id: String(item.id),
    name: item.name,
    source: item.source,
    rarity: item.rarity || 'common',
    type: item.type,
    image: item.image || '',
    description: item.description || '暂无法宝说明',
    statsBonus: mapStatsBonus(item.stats_bonus),
    skillBonus: item.skill_bonus || '',
    sourceBasis: item.source_basis || '',
  }
}

export async function fetchItems(): Promise<Item[]> {
  const response = await fetch('/api/items', { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`法宝接口请求失败（${response.status}）`)

  const data = await response.json() as { items?: ApiItem[] }
  if (!Array.isArray(data.items)) throw new Error('法宝接口返回格式不正确')
  return data.items.map(mapItem)
}
