import { useMemo } from 'react'
import type { Character } from '@/types'

interface GalleryCardStripProps {
  characters: Character[]
  onSelectCharacter?: (characterId: string) => void
}

// 预置多样化阵营与旋转错落角
const ROTATION_DELTAS = [-3, 2.2, -1.8, 3.5, -2.5, 1.6, -3.2, 2.8, -1.2, 3.0]
const Y_DELTAS = [8, -12, 14, -8, 10, -16, 6, -10, 12, -14]

// 缺省展示样本神魔卡牌
const FALLBACK_CHARACTERS = [
  {
    id: 'char-sunwukong',
    name: '孙悟空',
    originBook: '西游记',
    rarity: 'legendary',
    grade: 'S',
    combatPower: 980,
    faction: 'faction-mythic',
    avatar: '/images/characters/sunwukong.png',
    fallbackBg: 'linear-gradient(135deg, #78350f, #d97706)',
  },
  {
    id: 'char-nezha',
    name: '哪吒',
    originBook: '封神演义',
    rarity: 'legendary',
    grade: 'S',
    combatPower: 940,
    faction: 'faction-mythic',
    avatar: '/images/characters/nezha.png',
    fallbackBg: 'linear-gradient(135deg, #831843, #db2777)',
  },
  {
    id: 'char-guanyu',
    name: '关羽',
    originBook: '三国演义',
    rarity: 'epic',
    grade: 'A',
    combatPower: 890,
    faction: 'faction-mortal',
    avatar: '/images/characters/guanyu.png',
    fallbackBg: 'linear-gradient(135deg, #991b1b, #dc2626)',
  },
  {
    id: 'char-baisuzhen',
    name: '白素贞',
    originBook: '白蛇传',
    rarity: 'epic',
    grade: 'A',
    combatPower: 880,
    faction: 'faction-immortal',
    avatar: '/images/characters/baisuzhen.png',
    fallbackBg: 'linear-gradient(135deg, #065f46, #059669)',
  },
  {
    id: 'char-zhugeliang',
    name: '诸葛亮',
    originBook: '三国演义',
    rarity: 'epic',
    grade: 'A',
    combatPower: 870,
    faction: 'faction-mortal',
    avatar: '/images/characters/zhugeliang.png',
    fallbackBg: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
  },
  {
    id: 'char-wusong',
    name: '武松',
    originBook: '水浒传',
    rarity: 'rare',
    grade: 'B',
    combatPower: 820,
    faction: 'faction-mortal',
    avatar: '/images/characters/wusong.png',
    fallbackBg: 'linear-gradient(135deg, #713f12, #a16207)',
  },
  {
    id: 'char-diji',
    name: '迪迦',
    originBook: '超古代奇谭',
    rarity: 'legendary',
    grade: 'S',
    combatPower: 960,
    faction: 'faction-fantasy',
    avatar: '/images/characters/tiga.png',
    fallbackBg: 'linear-gradient(135deg, #3730a3, #6366f1)',
  },
  {
    id: 'char-houyi',
    name: '后羿',
    originBook: '山海经',
    rarity: 'legendary',
    grade: 'S',
    combatPower: 950,
    faction: 'faction-mythic',
    avatar: '/images/characters/houyi.png',
    fallbackBg: 'linear-gradient(135deg, #854d0e, #ca8a04)',
  },
]

export function GalleryCardStrip({ characters, onSelectCharacter }: GalleryCardStripProps) {
  const displayItems = useMemo(() => {
    if (characters && characters.length > 0) {
      return characters.slice(0, 10).map((char) => {
        let factionClass = 'faction-mythic'
        if (char.originBook.includes('三国') || char.originBook.includes('水浒') || char.originBook.includes('红楼')) {
          factionClass = 'faction-mortal'
        } else if (char.originBook.includes('白蛇') || char.originBook.includes('聊斋')) {
          factionClass = 'faction-immortal'
        } else if (char.originBook.includes('奥特') || char.type === 'demon' || char.originBook.includes('奇谭')) {
          factionClass = 'faction-fantasy'
        }
        return {
          id: char.id,
          name: char.name,
          originBook: char.originBook,
          rarity: char.rarity || 'epic',
          grade: char.grade || 'A',
          combatPower: char.combatPower || (char.stats?.attack ? char.stats.attack * 10 : 850),
          faction: factionClass,
          avatar: char.avatar || `/images/characters/${char.id}.png`,
          fallbackBg: 'linear-gradient(135deg, #1e1533, #3b1d60)',
        }
      })
    }
    return FALLBACK_CHARACTERS
  }, [characters])

  return (
    <div className="gallery-strip-wrapper" id="gallery-strip-wrapper">
      <div className="gallery-strip-track" id="gallery-strip-track">
        {displayItems.map((item, index) => {
          const rotation = ROTATION_DELTAS[index % ROTATION_DELTAS.length]
          const yOffset = Y_DELTAS[index % Y_DELTAS.length]
          return (
            <article
              key={item.id + index}
              className={`strip-character-card ${item.faction} strip-gem-card`}
              style={{
                transform: `translateY(${yOffset}px) rotate(${rotation}deg)`,
              }}
              onClick={() => onSelectCharacter?.(item.id)}
              tabIndex={0}
              role="button"
              aria-label={`查看 ${item.name} 详情`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectCharacter?.(item.id)
                }
              }}
            >
              {/* 卡面头像与阵营 */}
              <div className="strip-card-img-wrap">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="strip-card-img"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    if (target.parentElement) {
                      target.parentElement.style.background = item.fallbackBg
                    }
                  }}
                />
                <span className="strip-card-badge">{item.originBook}</span>
              </div>

              {/* 角色名与品阶 */}
              <h4 className="strip-card-name">{item.name}</h4>
              <div className="strip-card-meta">
                <span>品阶 <strong>{item.grade}</strong></span>
                <span style={{ textTransform: 'capitalize' }}>{item.rarity}</span>
              </div>

              {/* 战力总评 */}
              <div className="strip-card-power">
                <span>综合战力</span>
                <strong>{item.combatPower}</strong>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
