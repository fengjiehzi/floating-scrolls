interface HeroCharacterCardsProps {
  onSelectCharacter?: (characterId: string) => void
}

// 预置三大典籍传奇神魔预览
const HERO_PRESETS = [
  {
    id: 'char-sunwukong',
    name: '齐天大圣 · 孙悟空',
    originBook: '《西游记》',
    rarity: 'legendary' as const,
    rarityLabel: '传说 · 神话',
    quote: '金猴奋起千钧棒，玉宇澄清万里埃。',
    attack: 98,
    speed: 96,
    avatar: '/images/characters/sunwukong.png',
    cardClass: 'hero-card-1',
    fallbackBg: 'linear-gradient(135deg, #78350f, #f59e0b, #451a03)',
  },
  {
    id: 'char-nezha',
    name: '三坛海会 · 哪吒',
    originBook: '《封神演义》',
    rarity: 'legendary' as const,
    rarityLabel: '传说 · 仙神',
    quote: '踏火轮擎乾坤圈，翻天覆海显神通。',
    attack: 94,
    speed: 92,
    avatar: '/images/characters/nezha.png',
    cardClass: 'hero-card-2',
    fallbackBg: 'linear-gradient(135deg, #831843, #ec4899, #500724)',
  },
  {
    id: 'char-baisuzhen',
    name: '千载灵蛇 · 白素贞',
    originBook: '《白蛇传》',
    rarity: 'epic' as const,
    rarityLabel: '史诗 · 灵妖',
    quote: '断桥烟雨千重浪，盗得仙草救凡生。',
    attack: 88,
    speed: 90,
    avatar: '/images/characters/baisuzhen.png',
    cardClass: 'hero-card-3',
    fallbackBg: 'linear-gradient(135deg, #064e3b, #10b981, #022c22)',
  },
]

export function HeroCharacterCards({ onSelectCharacter }: HeroCharacterCardsProps) {
  return (
    <div className="hero-cards-deck" id="gallery-hero-deck">
      {HERO_PRESETS.map((hero) => (
        <article
          key={hero.id}
          className={`hero-glass-card ${hero.cardClass} hero-stagger-card`}
          onClick={() => onSelectCharacter?.(hero.id)}
          tabIndex={0}
          role="button"
          aria-label={`查看 ${hero.name} 详情`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectCharacter?.(hero.id)
            }
          }}
        >
          {/* 头像与稀有度徽章 */}
          <div className="card-avatar-wrap">
            <img
              src={hero.avatar}
              alt={hero.name}
              className="card-avatar-img"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                if (target.parentElement) {
                  target.parentElement.style.background = hero.fallbackBg
                }
              }}
            />
            <span className={`card-rarity-pill rarity-${hero.rarity}`}>
              {hero.rarityLabel}
            </span>
          </div>

          {/* 角色出处与名称 */}
          <div className="card-header-meta">
            <h3 className="card-char-name">{hero.name}</h3>
            <span className="card-char-origin">{hero.originBook}</span>
          </div>

          {/* 诗号名言 */}
          <p className="card-char-quote">{hero.quote}</p>

          {/* 基础数值概览 */}
          <div className="card-stats-mini">
            <span>攻击 <strong>{hero.attack}</strong></span>
            <span>身法 <strong>{hero.speed}</strong></span>
            <span>位阶 <strong>S</strong></span>
          </div>
        </article>
      ))}
    </div>
  )
}
