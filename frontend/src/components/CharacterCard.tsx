import { Swords, Shield, Heart, Zap } from 'lucide-react'
import { RarityBadge } from '@/components/RarityBadge'
import type { Character } from '@/types'

interface CharacterCardProps {
  character: Character
  onClick?: () => void
  selected?: boolean
}

export function CharacterCard({ character, onClick, selected }: CharacterCardProps) {
  const { stats } = character
  const healthPercent = stats.maxHealth > 0 ? (stats.health / stats.maxHealth) * 100 : 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`character-card rarity-${character.rarity} ${selected ? 'is-selected' : ''}`}
    >
      <div className="character-card-portrait">
        <span className="asset-fallback" aria-hidden="true">{character.name.slice(0, 1)}</span>
        {character.avatar && (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        )}
        <RarityBadge rarity={character.rarity} />
      </div>
      <div className="character-card-body">
        <div className="character-card-heading">
          <div>
            <h3>{character.name}</h3>
            <p>{character.originBook}</p>
          </div>
          <div className="character-power"><span>战力</span><strong>{character.combatPower}</strong></div>
        </div>
        
        <div className="character-card-health">
          <div>
            <span>生命</span>
            <span>{stats.health}/{stats.maxHealth}</span>
          </div>
          <div className="health-track" aria-hidden="true">
            <span style={{ transform: `scaleX(${healthPercent / 100})` }} />
          </div>
        </div>
        
        <div className="character-card-stats">
          <div>
            <Swords aria-hidden="true" className="w-4 h-4" />
            <span>{stats.attack}</span>
          </div>
          <div>
            <Shield aria-hidden="true" className="w-4 h-4" />
            <span>{stats.defense}</span>
          </div>
          <div>
            <Heart aria-hidden="true" className="w-4 h-4" />
            <span>{stats.maxHealth}</span>
          </div>
          <div>
            <Zap aria-hidden="true" className="w-4 h-4" />
            <span>{stats.speed}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
