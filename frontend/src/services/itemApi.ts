import type { Item, ItemStatsBonus } from '@/types'
import { apiUrl } from '@/services/apiUrl'

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

import { FALLBACK_ITEMS } from '@/data/itemsData'

export async function fetchItems(): Promise<Item[]> {
  try {
    const response = await fetch(apiUrl('/api/items'), { headers: { Accept: 'application/json' } })
    if (!response.ok) {
      return FALLBACK_ITEMS
    }

    const data = await response.json() as { items?: ApiItem[] }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return FALLBACK_ITEMS
    }

    return data.items.map(mapItem)
  } catch (err) {
    console.warn('[itemApi] 后端接口离线或超时，使用内置法宝数据', err)
    return FALLBACK_ITEMS
  }
}
