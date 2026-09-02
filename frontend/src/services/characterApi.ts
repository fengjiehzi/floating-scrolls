import type { Character, CharacterSkill, CharacterStats } from '@/types'
import { apiUrl } from '@/services/apiUrl'

interface ApiCharacterStats {
  power: number
  speed: number
  intelligence: number
  defense: number
  special_ability: number
  hp: number
  mp: number
}

interface ApiCharacterForm {
  name: string
  desc?: string
  bonuses?: Partial<ApiCharacterStats>
}

interface ApiCharacterSkill {
  name: string
  type?: string
  desc?: string
  narration?: string
  multiplier?: number
  mp_cost?: number
}

interface ApiCharacter {
  id: number | string
  name: string
  grade: string
  source: string
  image?: string | null
  stats: ApiCharacterStats
  skills?: ApiCharacterSkill[]
  forms?: ApiCharacterForm[]
  source_basis?: string | null
}

interface CharacterListResponse {
  characters: ApiCharacter[]
}

const rarityByGrade: Record<string, Character['rarity']> = {
  S: 'legendary',
  A: 'epic',
  B: 'rare',
  C: 'common',
}

function mapStats(stats: ApiCharacterStats): CharacterStats {
  const critRate = Math.min(35, ((stats.speed + stats.intelligence) / 400) * 100)
  return {
    attack: stats.power,
    defense: stats.defense,
    health: stats.hp,
    maxHealth: stats.hp,
    speed: stats.speed,
    intelligence: stats.intelligence,
    specialAbility: stats.special_ability,
    mana: stats.mp,
    maxMana: stats.mp,
    critRate: Math.round(critRate),
    critDamage: 150,
  }
}

function mapFormStats(stats: Partial<ApiCharacterStats> = {}): Partial<CharacterStats> {
  return {
    ...(stats.power !== undefined && { attack: stats.power }),
    ...(stats.defense !== undefined && { defense: stats.defense }),
    ...(stats.hp !== undefined && { health: stats.hp, maxHealth: stats.hp }),
    ...(stats.speed !== undefined && { speed: stats.speed }),
    ...(stats.intelligence !== undefined && { intelligence: stats.intelligence }),
    ...(stats.special_ability !== undefined && { specialAbility: stats.special_ability }),
    ...(stats.mp !== undefined && { mana: stats.mp, maxMana: stats.mp }),
  }
}

function mapSkills(skills: ApiCharacterSkill[] = [], characterId: string): CharacterSkill[] {
  return skills.map((skill, index) => ({
    id: `${characterId}-skill-${index}`,
    name: skill.name,
    type: skill.type || 'physical_attack',
    description: skill.desc || skill.narration || '暂无技能说明',
    multiplier: skill.multiplier ?? 1,
    manaCost: skill.mp_cost ?? 0,
    narration: skill.narration || skill.desc || '',
  }))
}

function mapCharacter(character: ApiCharacter): Character {
  return {
    id: String(character.id),
    name: character.name,
    originBook: character.source,
    originBookId: character.source,
    description: character.source_basis || '暂无出处说明',
    avatar: character.image || '',
    stats: mapStats(character.stats),
    skills: mapSkills(character.skills, String(character.id)),
    forms: (character.forms || []).map((form, index) => ({
      id: `${character.id}-${index}`,
      name: form.name,
      stats: mapFormStats(form.bonuses),
      skills: [],
      description: form.desc || '',
    })),
    currentFormIndex: 0,
    rarity: rarityByGrade[character.grade] || 'common',
    grade: (['S', 'A', 'B', 'C'].includes(character.grade) ? character.grade : 'C') as Character['grade'],
    combatPower: character.stats.power,
  }
}

import { FALLBACK_CHARACTERS } from '@/data/charactersData'

export async function fetchCharacters(): Promise<Character[]> {
  try {
    const response = await fetch(apiUrl('/api/characters'), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return FALLBACK_CHARACTERS
    }

    const data = await response.json() as CharacterListResponse
    if (!Array.isArray(data.characters) || data.characters.length === 0) {
      return FALLBACK_CHARACTERS
    }

    return data.characters.map(mapCharacter)
  } catch (err) {
    console.warn('[characterApi] 后端接口离线或超时，使用内置典籍角色数据', err)
    return FALLBACK_CHARACTERS
  }
}

export async function fetchCharacterById(id: string): Promise<Character> {
  try {
    const response = await fetch(apiUrl(`/api/characters/${encodeURIComponent(id)}`), {
      headers: { Accept: 'application/json' },
    })

    if (response.ok) {
      const data = await response.json() as { character?: ApiCharacter }
      if (data.character) {
        return mapCharacter(data.character)
      }
    }
  } catch (err) {
    console.warn(`[characterApi] 无法连接后端获取角色 ${id}，使用内置数据`, err)
  }

  const fallback = FALLBACK_CHARACTERS.find((c) => c.id === id)
  if (fallback) return fallback

  throw new Error('未找到该角色')
}
