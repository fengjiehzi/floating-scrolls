import React, { useState, useEffect } from 'react'
import { Swords, Heart, Shield, Zap, RotateCcw, BookOpen } from 'lucide-react'
import { CharacterCard } from '@/components/CharacterCard'
import { SkillButton } from '@/components/SkillButton'
import { ProgressBar } from '@/components/ProgressBar'
import { useGameStore } from '@/store/gameStore'
import { eventBus } from '@/utils/eventBus'
import type { Character, Skill } from '@/types'

export function BattleView() {
  const {
    characters,
    battle,
    startBattle,
    updateBattleState,
    addBattleLog,
    endBattle,
    setCurrentView,
  } = useGameStore()

  const [selectedPlayer, setSelectedPlayer] = useState<Character | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<Character | null>(null)
  const logsContainerRef = React.createRef<HTMLDivElement>()

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [battle.logs])

  useEffect(() => {
    const handleDamage = (data: { attacker: string; target: string; damage: number; skillName: string; isCritical?: boolean }) => {
      addBattleLog({
        message: `${data.attacker} 使用 ${data.skillName} 对 ${data.target} 造成 ${data.damage} 点${data.isCritical ? '暴击' : ''}伤害！`,
        type: 'damage',
        data,
      })

      if (data.target === battle.player?.name) {
        updateBattleState({ playerHealth: Math.max(0, battle.playerHealth - data.damage) })
      } else {
        updateBattleState({ enemyHealth: Math.max(0, battle.enemyHealth - data.damage) })
      }
    }

    eventBus.on('battle:damage', handleDamage)
    return () => eventBus.off('battle:damage', handleDamage)
  }, [addBattleLog, updateBattleState, battle.player?.name, battle.playerHealth, battle.enemyHealth])

  useEffect(() => {
    if (battle.playerHealth <= 0) {
      addBattleLog({ message: `${battle.player?.name} 被击败！`, type: 'end' })
      endBattle('enemy')
    } else if (battle.enemyHealth <= 0) {
      addBattleLog({ message: `${battle.enemy?.name} 被击败！`, type: 'end' })
      endBattle('player')
    }
  }, [battle.playerHealth, battle.enemyHealth, battle.player?.name, battle.enemy?.name, addBattleLog, endBattle])

  const handleStartBattle = () => {
    if (selectedPlayer && selectedEnemy) {
      startBattle(selectedPlayer, selectedEnemy)
      addBattleLog({ message: `⚔️ 战斗开始！${selectedPlayer.name} VS ${selectedEnemy.name}`, type: 'round' })
    }
  }

  const handleSkill = (skill: Skill) => {
    if (!battle.isPlayerTurn || !battle.isActive) return

    const damage = Math.floor(skill.damage * (1 + battle.player!.stats.critRate / 100))
    const isCritical = Math.random() < battle.player!.stats.critRate / 100

    eventBus.emit('battle:damage', {
      attacker: battle.player!.name,
      target: battle.enemy!.name,
      damage: isCritical ? damage * 2 : damage,
      skillName: skill.name,
      isCritical,
    })

    updateBattleState({ isPlayerTurn: false })

    setTimeout(() => {
      if (battle.enemyHealth > 0) {
        const enemySkills: Skill[] = [
          { id: '1', name: '普通攻击', description: '基础攻击', damage: battle.enemy!.stats.attack, cooldown: 0, currentCooldown: 0, manaCost: 0, type: 'attack', effect: '', icon: '' },
        ]
        const randomSkill = enemySkills[0]
        const enemyDamage = Math.floor(randomSkill.damage * (1 + battle.enemy!.stats.critRate / 100))
        const enemyCrit = Math.random() < battle.enemy!.stats.critRate / 100

        eventBus.emit('battle:damage', {
          attacker: battle.enemy!.name,
          target: battle.player!.name,
          damage: enemyCrit ? enemyDamage * 2 : enemyDamage,
          skillName: randomSkill.name,
          isCritical: enemyCrit,
        })

        updateBattleState({ isPlayerTurn: true, round: battle.round + 1 })
        addBattleLog({ message: `--- 第 ${battle.round + 1} 回合 ---`, type: 'round' })
      }
    }, 1500)
  }

  const skills: Skill[] = [
    { id: '1', name: '普通攻击', description: '基础攻击', damage: 50, cooldown: 0, currentCooldown: 0, manaCost: 0, type: 'attack', effect: '', icon: '' },
    { id: '2', name: '技能一', description: '强力技能', damage: 100, cooldown: 3, currentCooldown: 0, manaCost: 20, type: 'attack', effect: '', icon: '' },
    { id: '3', name: '技能二', description: '防御技能', damage: 0, cooldown: 4, currentCooldown: 0, manaCost: 15, type: 'defense', effect: '', icon: '' },
    { id: '4', name: '必杀技', description: '终极技能', damage: 200, cooldown: 6, currentCooldown: 0, manaCost: 50, type: 'attack', effect: '', icon: '' },
  ]

  if (!battle.isActive) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gradient-gold mb-2">战斗竞技场</h1>
              <p className="text-text-secondary">选择你的角色进行对决</p>
            </div>
            <button
              onClick={() => setCurrentView('welcome')}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>返回主页</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                选择你的角色
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {characters.length === 0 ? (
                  <p className="col-span-full text-text-secondary">请先从书库提取角色</p>
                ) : (
                  characters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      selected={selectedPlayer?.id === char.id}
                      onClick={() => setSelectedPlayer(char)}
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Swords className="w-5 h-5 text-accent-red" />
                选择对手
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {characters.length === 0 ? (
                  <p className="col-span-full text-text-secondary">请先从书库提取角色</p>
                ) : (
                  characters
                    .filter((char) => char.id !== selectedPlayer?.id)
                    .map((char) => (
                      <CharacterCard
                        key={char.id}
                        character={char}
                        selected={selectedEnemy?.id === char.id}
                        onClick={() => setSelectedEnemy(char)}
                      />
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleStartBattle}
              disabled={!selectedPlayer || !selectedEnemy}
              className="px-8 py-4 bg-gradient-to-r from-accent-red/20 to-red-500/20 border-2 border-accent-red rounded-xl font-bold text-xl text-accent-red disabled:opacity-50 disabled:cursor-not-allowed hover:from-accent-red/30 hover:to-red-500/30 hover:shadow-lg hover:shadow-accent-red/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Swords className="w-6 h-6" />
                <span>开始战斗</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gradient-gold">战斗进行中</h1>
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary rounded-lg">
            <RotateCcw className="w-4 h-4 text-text-muted" />
            <span className="text-text-secondary">回合 {battle.round}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className={`p-6 rounded-xl border-2 ${battle.isPlayerTurn ? 'border-accent-gold glow-gold' : 'border-text-muted/30'} bg-gradient-card card-shadow`}>
            <h3 className="text-lg font-bold text-text-primary mb-2">我方角色</h3>
            {battle.player && (
              <div className="flex items-center gap-4">
                <img
                  src={battle.player.avatar}
                  alt={battle.player.name}
                  className="w-24 h-24 rounded-lg object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-text-primary">{battle.player.name}</h4>
                  <p className="text-sm text-text-secondary">{battle.player.originBook}</p>
                  <ProgressBar
                    progress={battle.playerHealth}
                    max={battle.player.stats.maxHealth}
                    label="生命值"
                    color="red"
                  />
                  <div className="flex gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Swords className="w-4 h-4 text-accent-red" />
                      <span className="text-text-secondary">{battle.player.stats.attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-text-secondary">{battle.player.stats.defense}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-text-secondary">{battle.player.stats.speed}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl border-2 ${!battle.isPlayerTurn ? 'border-accent-red glow-red' : 'border-text-muted/30'} bg-gradient-card card-shadow`}>
            <h3 className="text-lg font-bold text-text-primary mb-2">敌方角色</h3>
            {battle.enemy && (
              <div className="flex items-center gap-4">
                <img
                  src={battle.enemy.avatar}
                  alt={battle.enemy.name}
                  className="w-24 h-24 rounded-lg object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-text-primary">{battle.enemy.name}</h4>
                  <p className="text-sm text-text-secondary">{battle.enemy.originBook}</p>
                  <ProgressBar
                    progress={battle.enemyHealth}
                    max={battle.enemy.stats.maxHealth}
                    label="生命值"
                    color="red"
                  />
                  <div className="flex gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Swords className="w-4 h-4 text-accent-red" />
                      <span className="text-text-secondary">{battle.enemy.stats.attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-text-secondary">{battle.enemy.stats.defense}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-text-secondary">{battle.enemy.stats.speed}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-xl p-4 mb-8">
          <h3 className="text-lg font-bold text-text-primary mb-4">战斗日志</h3>
          <div
            ref={logsContainerRef}
            className="h-40 overflow-y-auto space-y-2 pr-2"
          >
            {battle.logs.map((log) => (
              <div
                key={log.id}
                className={`text-sm py-1 px-2 rounded ${
                  log.type === 'damage' ? 'text-red-400' :
                  log.type === 'heal' ? 'text-green-400' :
                  log.type === 'round' ? 'text-border-gold font-bold' :
                  log.type === 'end' ? 'text-accent-red font-bold text-lg' :
                  'text-text-secondary'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">技能栏</h3>
          <div className="flex flex-wrap gap-4">
            {skills.map((skill) => (
              <SkillButton
                key={skill.id}
                skill={skill}
                onClick={() => handleSkill(skill)}
                disabled={!battle.isPlayerTurn}
              />
            ))}
          </div>
          {!battle.isPlayerTurn && (
            <p className="mt-4 text-center text-text-muted">敌方回合，请等待...</p>
          )}
        </div>

        {battle.winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-gradient-card border-2 border-border-gold rounded-xl p-8 text-center animate-scale-in">
              <div className="text-6xl mb-4">{battle.winner === 'player' ? '🎉' : '💀'}</div>
              <h2 className="text-3xl font-bold text-gradient-gold mb-2">
                {battle.winner === 'player' ? '胜利！' : '失败！'}
              </h2>
              <p className="text-text-secondary mb-6">
                {battle.winner === 'player' ? `${battle.player?.name} 击败了 ${battle.enemy?.name}` : `${battle.enemy?.name} 击败了 ${battle.player?.name}`}
              </p>
              <button
                onClick={() => updateBattleState({ isActive: false, winner: null, logs: [] })}
                className="px-6 py-3 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border border-border-gold rounded-lg text-accent-gold hover:from-accent-gold/30 hover:to-border-gold/30 transition-all"
              >
                返回选择
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}