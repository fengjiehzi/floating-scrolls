import { useState } from 'react'
import { Search, Swords, Shield, Heart, Zap, Target, Flame } from 'lucide-react'
import { CharacterCard } from '@/components/CharacterCard'
import { Modal } from '@/components/Modal'
import { useGameStore } from '@/store/gameStore'
import type { Character } from '@/types'

export function CharacterView() {
  const { characters, removeCharacter } = useGameStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.originBook.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRemove = () => {
    if (selectedCharacter) {
      removeCharacter(selectedCharacter.id)
      setSelectedCharacter(null)
      setIsModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-2">角色图鉴</h1>
            <p className="text-text-secondary">查看和管理你的传奇角色</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="搜索角色..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-text-muted/30 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-border-gold/50 transition-colors"
          />
        </div>

        {filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Swords className="w-20 h-20 text-text-muted/30 mb-4" />
            <p className="text-text-secondary text-lg">暂无角色</p>
            <p className="text-text-muted text-sm">从书库中提取角色来组建你的阵容</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onClick={() => {
                  setSelectedCharacter(character)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCharacter(null)
        }}
        title={selectedCharacter?.name}
        size="lg"
      >
        {selectedCharacter && (
          <div className="space-y-6">
            <div className="relative h-48 bg-bg-secondary rounded-lg overflow-hidden">
              <img
                src={selectedCharacter.avatar}
                alt={selectedCharacter.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
              <div className="absolute bottom-2 right-2 px-3 py-1 text-xs font-bold rounded bg-black/60 text-border-gold">
                {selectedCharacter.rarity === 'legendary' && '传说'}
                {selectedCharacter.rarity === 'epic' && '史诗'}
                {selectedCharacter.rarity === 'rare' && '稀有'}
                {selectedCharacter.rarity === 'common' && '普通'}
              </div>
            </div>

            <div>
              <p className="text-sm text-text-secondary mb-2">出处：{selectedCharacter.originBook}</p>
              <p className="text-text-secondary">{selectedCharacter.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                <Swords className="w-5 h-5 text-accent-red" />
                <div>
                  <div className="text-xs text-text-muted">攻击</div>
                  <div className="font-bold text-text-primary">{selectedCharacter.stats.attack}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-text-muted">防御</div>
                  <div className="font-bold text-text-primary">{selectedCharacter.stats.defense}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                <Heart className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-xs text-text-muted">生命</div>
                  <div className="font-bold text-text-primary">{selectedCharacter.stats.maxHealth}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-xs text-text-muted">速度</div>
                  <div className="font-bold text-text-primary">{selectedCharacter.stats.speed}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                <Target className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-text-muted">暴击率</div>
                  <div className="font-bold text-text-primary">{selectedCharacter.stats.critRate}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-xs text-text-muted">暴击伤害</div>
                  <div className="font-bold text-text-primary">{selectedCharacter.stats.critDamage}%</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
