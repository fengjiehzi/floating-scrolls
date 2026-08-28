import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Bot, FastForward, Heart, PackageOpen, Shield, Sparkles, Swords, X, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CharacterCard } from '@/components/CharacterCard'
import { PageState } from '@/components/PageState'
import { ProgressBar } from '@/components/ProgressBar'
import { useGameStore } from '@/store/gameStore'
import type { Character, CharacterSkill } from '@/types'

interface DamageResult {
  damage: number
  critical: boolean
}

function calculateDamage(attacker: Character, defender: Character, multiplier = 1, reduction = 1): DamageResult {
  const base = attacker.stats.attack * Math.max(0.7, multiplier)
  const defenseReduction = 1 - (defender.stats.defense / (defender.stats.defense + 200))
  const critical = Math.random() < ((attacker.stats.critRate || 0) / 100)
  const criticalMultiplier = critical ? 1.5 : 1
  return {
    damage: Math.max(1, Math.round(base * defenseReduction * criticalMultiplier * reduction)),
    critical,
  }
}

export function BattleView() {
  const navigate = useNavigate()
  const {
    characters,
    charactersStatus,
    charactersError,
    preferredFighterId,
    battle,
    startBattle,
    updateBattleState,
    addBattleLog,
    endBattle,
    resetBattle,
    loadCharacters,
  } = useGameStore()
  const [selectedPlayer, setSelectedPlayer] = useState<Character | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<Character | null>(null)
  const [speed, setSpeed] = useState<1 | 2>(1)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [itemUsed, setItemUsed] = useState(false)
  const [feedback, setFeedback] = useState('')
  const enemyTimerRef = useRef<number | null>(null)
  const feedbackTimerRef = useRef<number | null>(null)
  const defendingRef = useRef(false)

  useEffect(() => {
    if (battle.isActive || selectedPlayer || characters.length === 0) return
    const preferred = characters.find((character) => character.id === preferredFighterId) || characters[0]
    setSelectedPlayer(preferred)
    setSelectedEnemy(characters.find((character) => character.id !== preferred.id) || null)
  }, [battle.isActive, characters, preferredFighterId, selectedPlayer])

  useEffect(() => {
    if (!battle.isActive || battle.isPlayerTurn || battle.winner) return
    enemyTimerRef.current = window.setTimeout(() => {
      const state = useGameStore.getState()
      const current = state.battle
      if (!current.isActive || current.winner || !current.player || !current.enemy || current.enemyHealth <= 0) return

      const enemySkill = current.enemy.skills.find((skill) => ['physical_attack', 'magic_attack', 'speed_attack', 'summon'].includes(skill.type))
      const result = calculateDamage(current.enemy, current.player, enemySkill?.multiplier || 1, defendingRef.current ? 0.5 : 1)
      defendingRef.current = false
      const nextHealth = Math.max(0, current.playerHealth - result.damage)
      state.addBattleLog({
        message: `${current.enemy.name} 使用 ${enemySkill?.name || '普通攻击'}，造成 ${result.damage} 点${result.critical ? '暴击' : ''}伤害。`,
        type: 'damage',
        data: { attacker: current.enemy.name, target: current.player.name, damage: result.damage, skillName: enemySkill?.name || '普通攻击', isCritical: result.critical },
      })
      state.updateBattleState({ playerHealth: nextHealth })
      setFeedback(`-${result.damage}`)

      if (nextHealth <= 0) {
        state.addBattleLog({ message: `${current.player.name} 被击败。`, type: 'end' })
        state.endBattle('enemy')
        navigate('/battle/result')
        return
      }

      state.updateBattleState({ isPlayerTurn: true, round: current.round + 1 })
      state.addBattleLog({ message: `第 ${current.round + 1} 回合开始。`, type: 'round' })
      setCooldowns((currentCooldowns) => Object.fromEntries(
        Object.entries(currentCooldowns).map(([key, value]) => [key, Math.max(0, value - 1)])
      ))
    }, 900 / speed)

    return () => {
      if (enemyTimerRef.current) window.clearTimeout(enemyTimerRef.current)
    }
  }, [battle.isActive, battle.isPlayerTurn, battle.winner, navigate, speed])

  useEffect(() => () => {
    if (enemyTimerRef.current) window.clearTimeout(enemyTimerRef.current)
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
  }, [])

  useEffect(() => {
    if (!feedback) return
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(''), 560)
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    }
  }, [feedback])

  const activeSkill = useMemo<CharacterSkill | null>(() => {
    if (!battle.player) return null
    return battle.player.skills.find((skill) => ['physical_attack', 'magic_attack', 'speed_attack', 'summon'].includes(skill.type)) || null
  }, [battle.player])

  const finishBattle = (winner: 'player' | 'enemy', defeatedName: string) => {
    addBattleLog({ message: `${defeatedName} 被击败。`, type: 'end' })
    endBattle(winner)
    navigate('/battle/result')
  }

  const attackEnemy = (skill?: CharacterSkill) => {
    const state = useGameStore.getState().battle
    if (!state.isActive || !state.isPlayerTurn || !state.player || !state.enemy) return
    if (skill && (cooldowns[skill.id] || 0) > 0) return

    const result = calculateDamage(state.player, state.enemy, skill?.multiplier || 1)
    const nextHealth = Math.max(0, state.enemyHealth - result.damage)
    addBattleLog({
      message: `${state.player.name} 使用 ${skill?.name || '普通攻击'}，造成 ${result.damage} 点${result.critical ? '暴击' : ''}伤害。`,
      type: 'damage',
      data: { attacker: state.player.name, target: state.enemy.name, damage: result.damage, skillName: skill?.name || '普通攻击', isCritical: result.critical },
    })
    updateBattleState({ enemyHealth: nextHealth, isPlayerTurn: false })
    setFeedback(`-${result.damage}`)
    if (skill) setCooldowns((current) => ({ ...current, [skill.id]: 3 }))
    if (nextHealth <= 0) finishBattle('player', state.enemy.name)
  }

  const defend = () => {
    if (!battle.isActive || !battle.isPlayerTurn) return
    defendingRef.current = true
    addBattleLog({ message: `${battle.player?.name} 进入防御姿态，下次承受伤害减半。`, type: 'buff' })
    updateBattleState({ isPlayerTurn: false })
  }

  const useItem = () => {
    const state = useGameStore.getState().battle
    if (!state.isActive || !state.isPlayerTurn || !state.player || itemUsed || state.playerHealth >= state.player.stats.maxHealth) return
    const amount = Math.min(Math.round(state.player.stats.maxHealth * 0.2), state.player.stats.maxHealth - state.playerHealth)
    addBattleLog({ message: `${state.player.name} 使用疗愈墨，恢复 ${amount} 点生命。`, type: 'heal', data: { target: state.player.name, amount } })
    updateBattleState({ playerHealth: state.playerHealth + amount, isPlayerTurn: false })
    setItemUsed(true)
    setFeedback(`+${amount}`)
  }

  const handleStart = () => {
    if (!selectedPlayer || !selectedEnemy) return
    setCooldowns({})
    setItemUsed(false)
    defendingRef.current = false
    startBattle(selectedPlayer, selectedEnemy)
    addBattleLog({ message: `战斗开始：${selectedPlayer.name} 对阵 ${selectedEnemy.name}。`, type: 'round' })
  }

  if (!battle.isActive && !battle.winner) {
    return (
      <main className="battle-select-page">
        <header className="battle-select-header">
          <button type="button" className="button-secondary" onClick={() => navigate('/')}><ArrowLeft aria-hidden="true" />返回卷首</button>
          <div><span className="section-kicker">演武场</span><h1>择定对阵双方</h1><p>从角色库选择我方与敌手，战斗将在全屏 HUD 中展开。</p></div>
          <span className="battle-mode-chip"><Bot aria-hidden="true" />本地演示战斗</span>
        </header>

        {charactersStatus === 'loading' ? (
          <PageState kind="loading" title="正在召集角色…" />
        ) : charactersStatus === 'error' ? (
          <PageState kind="error" title="演武场无法读取角色" message={charactersError} actionLabel="重新连接" onAction={() => void loadCharacters(true)} />
        ) : characters.length < 2 ? (
          <PageState kind="empty" title="可出战角色不足" message="至少需要两位角色才能开始对决。" icon={Swords} actionLabel="返回角色库" onAction={() => navigate('/characters')} />
        ) : (
          <>
            <div className="duelist-grid">
              <section className="duelist-panel panel">
                <div className="duelist-heading"><div><span>我方</span><h2>{selectedPlayer?.name || '选择角色'}</h2></div><Heart aria-hidden="true" /></div>
                <div className="battle-character-grid">
                  {characters.map((character) => <CharacterCard key={character.id} character={character} selected={selectedPlayer?.id === character.id} onClick={() => {
                    setSelectedPlayer(character)
                    if (selectedEnemy?.id === character.id) setSelectedEnemy(characters.find((item) => item.id !== character.id) || null)
                  }} />)}
                </div>
              </section>
              <section className="duelist-panel panel">
                <div className="duelist-heading is-enemy"><div><span>敌方</span><h2>{selectedEnemy?.name || '选择敌手'}</h2></div><Swords aria-hidden="true" /></div>
                <div className="battle-character-grid">
                  {characters.filter((character) => character.id !== selectedPlayer?.id).map((character) => <CharacterCard key={character.id} character={character} selected={selectedEnemy?.id === character.id} onClick={() => setSelectedEnemy(character)} />)}
                </div>
              </section>
            </div>
            <div className="battle-launch-bar"><span>{selectedPlayer && selectedEnemy ? `${selectedPlayer.name} / ${selectedEnemy.name}` : '双方角色就位后方可开战'}</span><button type="button" className="button-danger" disabled={!selectedPlayer || !selectedEnemy} onClick={handleStart}><Swords aria-hidden="true" />开始战斗</button></div>
          </>
        )}
      </main>
    )
  }

  return (
    <main className="battle-hud">
      <header className="battle-hud-topbar">
        <div className="battle-round"><span>回合</span><strong>{String(battle.round).padStart(2, '0')}</strong></div>
        <div className="battle-narration"><span>{battle.isPlayerTurn ? '我方行动' : '敌方行动'}</span><p>{battle.logs[battle.logs.length - 1]?.message || '双方正在对峙。'}</p></div>
        <div className="battle-hud-tools">
          <span><Bot aria-hidden="true" />本地模式</span>
          <button type="button" className={speed === 2 ? 'is-active' : ''} onClick={() => setSpeed((value) => value === 1 ? 2 : 1)} aria-label="切换战斗速度"><FastForward aria-hidden="true" />{speed}×</button>
          <button type="button" onClick={() => { resetBattle(); navigate('/') }} aria-label="退出战斗"><X aria-hidden="true" /></button>
        </div>
      </header>

      <section className="battle-stage" aria-label="战斗场地">
        <article className={`combatant combatant-player${battle.isPlayerTurn ? ' is-active' : ''}`}>
          {battle.player && <>{battle.player.avatar ? <img src={battle.player.avatar} alt={battle.player.name} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <div className="combatant-placeholder" aria-hidden="true">{battle.player.name.slice(0, 1)}</div>}<div className="combatant-info"><span>我方 · {battle.isPlayerTurn ? '行动中' : '待机'}</span><h2>{battle.player.name}</h2><p>{battle.player.originBook} · 战力 {battle.player.combatPower}</p><ProgressBar progress={battle.playerHealth} max={battle.player.stats.maxHealth} label="生命" color="red" /><div className="combatant-mini-stats"><span><Shield />{battle.player.stats.defense}</span><span><Zap />{battle.player.stats.speed}</span><span><Sparkles />{battle.player.stats.mana}</span></div></div></>}
        </article>

        <div className="battle-playfield" aria-live="polite">
          <div className="battle-seal"><Swords aria-hidden="true" /><span>对决</span></div>
          {feedback && <strong className={feedback.startsWith('+') ? 'is-heal' : 'is-damage'}>{feedback}</strong>}
        </div>

        <article className={`combatant combatant-enemy${!battle.isPlayerTurn ? ' is-active' : ''}`}>
          {battle.enemy && <>{battle.enemy.avatar ? <img src={battle.enemy.avatar} alt={battle.enemy.name} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <div className="combatant-placeholder" aria-hidden="true">{battle.enemy.name.slice(0, 1)}</div>}<div className="combatant-info"><span>敌方 · {!battle.isPlayerTurn ? '行动中' : '待机'}</span><h2>{battle.enemy.name}</h2><p>{battle.enemy.originBook} · 战力 {battle.enemy.combatPower}</p><ProgressBar progress={battle.enemyHealth} max={battle.enemy.stats.maxHealth} label="生命" color="red" /><div className="combatant-mini-stats"><span><Shield />{battle.enemy.stats.defense}</span><span><Zap />{battle.enemy.stats.speed}</span><span><Sparkles />{battle.enemy.stats.mana}</span></div></div></>}
        </article>
      </section>

      <section className="battle-action-tray" aria-label="战斗操作">
        <button type="button" className="action-attack" disabled={!battle.isPlayerTurn || !battle.isActive} onClick={() => attackEnemy()}><Swords aria-hidden="true" /><span><strong>攻击</strong><small>普通攻击</small></span></button>
        <button type="button" disabled={!battle.isPlayerTurn || !battle.isActive} onClick={defend}><Shield aria-hidden="true" /><span><strong>防御</strong><small>伤害减半</small></span></button>
        <button type="button" disabled={!battle.isPlayerTurn || !battle.isActive || !activeSkill || Boolean(activeSkill && cooldowns[activeSkill.id])} onClick={() => activeSkill && attackEnemy(activeSkill)}><Sparkles aria-hidden="true" /><span><strong>{activeSkill?.name || '主动技能'}</strong><small>{activeSkill && cooldowns[activeSkill.id] ? `冷却 ${cooldowns[activeSkill.id]}` : '消耗灵力'}</small></span></button>
        <button type="button" disabled={!battle.isPlayerTurn || !battle.isActive || itemUsed || battle.playerHealth >= (battle.player?.stats.maxHealth || 0)} onClick={useItem}><PackageOpen aria-hidden="true" /><span><strong>法宝</strong><small>{itemUsed ? '已使用' : '疗愈墨'}</small></span></button>
        <button type="button" disabled={!battle.isPlayerTurn || !battle.isActive} onClick={() => updateBattleState({ isPlayerTurn: false })}><BookOpen aria-hidden="true" /><span><strong>结束回合</strong><small>交由敌方</small></span></button>
      </section>
    </main>
  )
}
