import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Brain, Heart, LockKeyhole, Shield, Sparkles, Swords, WandSparkles, Zap } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { ProgressBar } from '@/components/ProgressBar'
import { RarityBadge } from '@/components/RarityBadge'
import { fetchCharacterById } from '@/services/characterApi'
import { useGameStore } from '@/store/gameStore'
import type { Character, CharacterStats } from '@/types'

const statRows: Array<{ key: keyof CharacterStats; label: string; icon: typeof Heart; max: number }> = [
  { key: 'maxHealth', label: '生命', icon: Heart, max: 10000 },
  { key: 'attack', label: '攻击', icon: Swords, max: 100 },
  { key: 'defense', label: '防御', icon: Shield, max: 100 },
  { key: 'speed', label: '速度', icon: Zap, max: 100 },
  { key: 'intelligence', label: '智略', icon: Brain, max: 100 },
  { key: 'specialAbility', label: '异能', icon: Sparkles, max: 100 },
]

export function CharacterDetailView() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { characters, setPreferredFighter } = useGameStore()
  const cachedCharacter = characters.find((character) => character.id === id)
  const [character, setCharacter] = useState<Character | null>(cachedCharacter || null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(cachedCharacter ? 'success' : 'loading')
  const [error, setError] = useState<string | null>(null)
  const [formIndex, setFormIndex] = useState(cachedCharacter?.currentFormIndex || 0)

  useEffect(() => {
    let active = true
    setStatus(cachedCharacter ? 'success' : 'loading')
    setCharacter(cachedCharacter || null)
    setError(null)

    void fetchCharacterById(id)
      .then((nextCharacter) => {
        if (!active) return
        setCharacter(nextCharacter)
        setFormIndex(nextCharacter.currentFormIndex)
        setStatus('success')
      })
      .catch((reason: unknown) => {
        if (!active || cachedCharacter) return
        setError(reason instanceof Error ? reason.message : '角色详情加载失败')
        setStatus('error')
      })

    return () => { active = false }
  }, [cachedCharacter, id])

  const effectiveStats = useMemo(() => {
    if (!character) return null
    const bonus = character.forms[formIndex]?.stats || {}
    return {
      ...character.stats,
      attack: character.stats.attack + (bonus.attack || 0),
      defense: character.stats.defense + (bonus.defense || 0),
      health: character.stats.health + (bonus.health || 0),
      maxHealth: character.stats.maxHealth + (bonus.maxHealth || 0),
      speed: character.stats.speed + (bonus.speed || 0),
      intelligence: character.stats.intelligence + (bonus.intelligence || 0),
      specialAbility: character.stats.specialAbility + (bonus.specialAbility || 0),
      mana: character.stats.mana + (bonus.mana || 0),
      maxMana: character.stats.maxMana + (bonus.maxMana || 0),
    }
  }, [character, formIndex])

  if (status === 'loading') {
    return <main className="page-shell"><div className="page-container"><PageState kind="loading" title="正在展开角色卷宗…" /></div></main>
  }

  if (status === 'error' || !character || !effectiveStats) {
    return (
      <main className="page-shell"><div className="page-container">
        <PageState kind="error" title="角色卷宗不存在" message={error} actionLabel="返回角色库" onAction={() => navigate('/characters')} />
      </div></main>
    )
  }

  const currentForm = character.forms[formIndex]

  return (
    <main className="page-shell">
      <div className="page-container character-detail-page">
        <header className="detail-toolbar">
          <button type="button" className="button-secondary" onClick={() => navigate('/characters')}>
            <ArrowLeft aria-hidden="true" />返回角色库
          </button>
          <span>角色详情 · {character.originBook}</span>
        </header>

        <section className="character-detail-hero">
          <div className="character-showcase panel">
            <div className="character-showcase-art">
              <BookOpen className="asset-fallback-icon" aria-hidden="true" />
              {character.avatar ? <img src={character.avatar} alt={character.name} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
              <RarityBadge rarity={character.rarity} />
            </div>
            <div className="form-switcher" aria-label="角色形态">
              {character.forms.length > 0 ? character.forms.map((form, index) => (
                <button key={form.id} type="button" className={formIndex === index ? 'is-active' : ''} onClick={() => setFormIndex(index)}>
                  {form.name}
                </button>
              )) : <span>基础形态</span>}
            </div>
          </div>

          <article className="character-identity">
            <span className="section-kicker">{currentForm?.name || '基础形态'}</span>
            <h1>{character.name}</h1>
            <p className="character-title">{character.grade} 级角色 · 战力 {character.combatPower}</p>
            <p className="character-lore">{character.description}</p>
            <div className="character-tags">
              <span>{character.originBook}</span>
              <span>{character.type === 'myth' ? '神话' : '典籍角色'}</span>
              <span>{currentForm?.description || '形态可切换'}</span>
            </div>
          </article>

          <aside className="character-stat-panel panel">
            <div className="panel-heading"><span>六维</span><h2>战斗属性</h2></div>
            {statRows.map(({ key, label, icon: Icon, max }) => {
              const value = Number(effectiveStats[key] || 0)
              return (
                <div className="detail-stat" key={key}>
                  <Icon aria-hidden="true" />
                  <ProgressBar label={label} progress={value} max={max} color={key === 'maxHealth' ? 'red' : 'gold'} />
                </div>
              )
            })}
          </aside>
        </section>

        <section className="character-detail-lower">
          <div className="skill-manuscript panel">
            <div className="panel-heading"><span>术</span><h2>角色技能</h2></div>
            <div className="detail-skill-grid">
              {character.skills.length > 0 ? character.skills.map((skill) => (
                <article key={skill.id}>
                  <WandSparkles aria-hidden="true" />
                  <div><h3>{skill.name}</h3><p>{skill.description}</p></div>
                  <span>{skill.manaCost > 0 ? `${skill.manaCost} 灵力` : '无消耗'}</span>
                </article>
              )) : <p className="muted-copy">暂无技能记录。</p>}
            </div>
          </div>

          <aside className="equipment-panel panel">
            <div className="panel-heading"><span>器</span><h2>装备法宝</h2></div>
            <LockKeyhole aria-hidden="true" />
            <p>装备接口需要玩家身份。本次界面保留槽位与状态，不伪装为已保存。</p>
            <button type="button" className="button-secondary" disabled>登录后配置</button>
          </aside>
        </section>

        <div className="detail-action-bar">
          <div><strong>{character.name}</strong><span>将作为我方默认出战角色</span></div>
          <button type="button" className="button-danger" onClick={() => {
            setPreferredFighter(character.id)
            navigate('/battle')
          }}>
            <Swords aria-hidden="true" />选择出战
          </button>
        </div>
      </div>
    </main>
  )
}
