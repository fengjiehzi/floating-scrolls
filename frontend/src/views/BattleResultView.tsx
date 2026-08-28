import { Award, Download, Home, RotateCcw, ScrollText, Shield, Sparkles, Swords, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { useGameStore } from '@/store/gameStore'

function downloadBattleReport(result: NonNullable<ReturnType<typeof useGameStore.getState>['battleResult']>) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1600
  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#0b0a09'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#c9a962'
  context.lineWidth = 3
  context.strokeRect(58, 58, 1084, 1484)
  context.fillStyle = '#e4c879'
  context.font = '700 46px "Noto Serif SC", serif'
  context.fillText('万卷浮生 · 古战报', 100, 145)
  context.fillStyle = '#f3e7cf'
  context.font = '700 96px "Noto Serif SC", serif'
  context.fillText(result.winner === 'player' ? '大捷' : '惜败', 100, 290)
  context.font = '600 42px "Noto Serif SC", serif'
  context.fillText(`${result.player.name}  对阵  ${result.enemy.name}`, 100, 390)

  context.fillStyle = '#c9bda8'
  context.font = '32px "Noto Sans SC", sans-serif'
  const lines = [
    `回合：${result.rounds}`,
    `造成伤害：${result.damageDealt}`,
    `承受伤害：${result.damageTaken}`,
    `治疗量：${result.healing}`,
    `经验：+${result.rewards.experience}`,
  ]
  lines.forEach((line, index) => context.fillText(line, 100, 520 + index * 72))

  context.fillStyle = '#e4c879'
  context.font = '600 36px "Noto Serif SC", serif'
  context.fillText('关键回合', 100, 930)
  context.fillStyle = '#c9bda8'
  context.font = '27px "Noto Sans SC", sans-serif'
  result.keyMoments.slice(-5).forEach((moment, index) => {
    const text = moment.message.length > 48 ? `${moment.message.slice(0, 48)}…` : moment.message
    context.fillText(`· ${text}`, 100, 1000 + index * 74)
  })

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `万卷浮生-战报-${result.id.slice(0, 8)}.png`
    anchor.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export function BattleResultView() {
  const navigate = useNavigate()
  const { battleResult, startBattle, resetBattle, addToast } = useGameStore()

  if (!battleResult) {
    return (
      <main className="battle-result-page">
        <div className="result-empty">
          <PageState kind="empty" title="尚无可展开的战报" message="完成一场战斗后，结算卷轴会出现在这里。" icon={ScrollText} actionLabel="前往演武场" onAction={() => navigate('/battle')} />
        </div>
      </main>
    )
  }

  const victory = battleResult.winner === 'player'

  return (
    <main className={`battle-result-page ${victory ? 'is-victory' : 'is-defeat'}`}>
      <header className="result-topbar">
        <span><ScrollText aria-hidden="true" />万卷浮生 · 战报</span>
        <button type="button" className="button-secondary" onClick={() => {
          resetBattle()
          navigate('/')
        }}><Home aria-hidden="true" />返回卷首</button>
      </header>

      <div className="result-manuscript">
        <section className="result-verdict">
          <div className="result-emblem">{victory ? <Trophy aria-hidden="true" /> : <Shield aria-hidden="true" />}</div>
          <span className="section-kicker">本场结局</span>
          <h1>{victory ? '大捷' : '惜败'}</h1>
          <p>{victory
            ? `${battleResult.player.name} 击败了 ${battleResult.enemy.name}`
            : `${battleResult.player.name} 惜败于 ${battleResult.enemy.name}`}</p>
        </section>

        <section className="result-grid">
          <div className="result-stats panel">
            <div className="panel-heading"><span>数</span><h2>战斗统计</h2></div>
            <dl>
              <div><dt>造成伤害</dt><dd>{battleResult.damageDealt}</dd></div>
              <div><dt>承受伤害</dt><dd>{battleResult.damageTaken}</dd></div>
              <div><dt>治疗量</dt><dd>{battleResult.healing}</dd></div>
              <div><dt>总回合</dt><dd>{battleResult.rounds}</dd></div>
            </dl>
          </div>

          <div className="result-timeline panel">
            <div className="panel-heading"><span>记</span><h2>关键回合</h2></div>
            <ol>
              {battleResult.keyMoments.map((moment) => (
                <li key={moment.id}><span>{moment.type === 'damage' ? <Swords aria-hidden="true" /> : <Sparkles aria-hidden="true" />}</span><p>{moment.message}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="result-rewards panel">
          <Award aria-hidden="true" />
          <div><span className="section-kicker">本场收获</span><h2>经验 +{battleResult.rewards.experience}</h2></div>
          <p>{battleResult.rewards.itemName ? `获得：${battleResult.rewards.itemName}` : '失败亦有所得，整备后可再次挑战。'}</p>
        </section>

        <div className="result-actions">
          <button type="button" className="button-primary" onClick={() => {
            startBattle(battleResult.player, battleResult.enemy)
            navigate('/battle')
          }}><RotateCcw aria-hidden="true" />再次挑战</button>
          <button type="button" className="button-secondary" onClick={() => {
            resetBattle()
            navigate('/characters')
          }}><Home aria-hidden="true" />返回角色库</button>
          <button type="button" className="button-secondary" onClick={() => {
            downloadBattleReport(battleResult)
            addToast({ type: 'success', message: '战报图片已生成' })
          }}><Download aria-hidden="true" />生成战报图</button>
        </div>
      </div>
    </main>
  )
}
