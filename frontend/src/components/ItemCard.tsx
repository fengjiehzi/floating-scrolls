import { Gem, Shield, Sparkles, Swords, Wind } from 'lucide-react'
import { RarityBadge } from '@/components/RarityBadge'
import type { Item } from '@/types'

interface ItemCardProps {
  item: Item
  onClick?: () => void
}

const typeLabels: Record<string, string> = {
  weapon: '兵刃',
  armor: '护具',
  accessory: '佩饰',
  treasure: '法器',
  consumable: '消耗品',
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const bonuses = Object.entries(item.statsBonus).filter(([, value]) => value !== undefined).slice(0, 3)
  const bonusIcons = [Swords, Shield, Wind]

  return (
    <button type="button" onClick={onClick} className={`item-card rarity-${item.rarity}`}>
      <div className="item-card-art">
        <Gem className="asset-fallback-icon" aria-hidden="true" />
        {item.image ? <img src={item.image} alt={item.name} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
        <RarityBadge rarity={item.rarity} />
      </div>
      <div className="item-card-body">
        <div className="item-card-heading">
          <div>
            <h3>{item.name}</h3>
            <p>{item.source}</p>
          </div>
          <span>{typeLabels[item.type] || item.type}</span>
        </div>
        <div className="item-card-bonuses" aria-label="属性加成">
          {bonuses.length > 0 ? bonuses.map(([key, value], index) => {
            const Icon = bonusIcons[index] || Sparkles
            return <span key={key}><Icon aria-hidden="true" />+{value}</span>
          }) : <span><Sparkles aria-hidden="true" />特殊法宝</span>}
        </div>
      </div>
    </button>
  )
}
