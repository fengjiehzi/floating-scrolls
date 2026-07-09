import { Swords, Shield, Heart, Zap } from 'lucide-react'
import type { Character } from '@/types'

interface CharacterCardProps {
  character: Character
  onClick?: () => void
  selected?: boolean
}

const rarityColors = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
}

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-yellow-500/30',
}

export function CharacterCard({ character, onClick, selected }: CharacterCardProps) {
  const { stats } = character
  const healthPercent = (stats.health / stats.maxHealth) * 100

  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-card border-2 rounded-xl overflow-hidden card-shadow cursor-pointer transition-all duration-300 ${
        rarityColors[character.rarity]
      } ${selected ? 'ring-2 ring-accent-gold' : ''} hover:scale-[1.02] ${rarityGlow[character.rarity]}`}
    >
      <div className="relative h-28 bg-bg-secondary overflow-hidden">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
        <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded bg-black/60 text-border-gold">
          {character.rarity === 'legendary' && '传说'}
          {character.rarity === 'epic' && '史诗'}
          {character.rarity === 'rare' && '稀有'}
          {character.rarity === 'common' && '普通'}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-base font-bold text-text-primary mb-1">{character.name}</h3>
        <p className="text-xs text-text-secondary mb-2 truncate">{character.originBook}</p>
        
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-muted">生命值</span>
            <span className="text-text-secondary">{stats.health}/{stats.maxHealth}</span>
          </div>
          <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-red to-red-400 transition-all duration-500"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1">
          <div className="flex flex-col items-center gap-0.5">
            <Swords className="w-4 h-4 text-accent-red/70" />
            <span className="text-xs text-text-secondary">{stats.attack}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Shield className="w-4 h-4 text-blue-400/70" />
            <span className="text-xs text-text-secondary">{stats.defense}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Heart className="w-4 h-4 text-red-400/70" />
            <span className="text-xs text-text-secondary">{stats.maxHealth}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Zap className="w-4 h-4 text-yellow-400/70" />
            <span className="text-xs text-text-secondary">{stats.speed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
