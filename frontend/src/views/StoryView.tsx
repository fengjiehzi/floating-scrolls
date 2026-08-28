import { useEffect, useRef, useState } from 'react'
import { BookOpen, ChevronRight, Clapperboard, Lightbulb, ListTree, MapPin, RotateCcw, Sparkles, Users, X } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { useGameStore } from '@/store/gameStore'

interface DemoStoryNode {
  id: string
  chapter: number
  title: string
  speaker: string
  text: string
  choices?: Array<{ id: string; text: string; next: string; tone: 'gold' | 'jade' | 'red' }>
  ending?: boolean
}

const storyNodes: Record<string, DemoStoryNode> = {
  intro: {
    id: 'intro', chapter: 1, title: '墨夜开卷', speaker: '旁白',
    text: '夜雨叩窗，你在藏经阁最深处发现一册无名古卷。封面没有题字，只有一枚尚未干透的朱砂指印。指尖触及纸面时，远处忽然传来金铁交鸣，书页间浮出一行小字：入卷者，可改一人命数。',
    choices: [
      { id: 'open', text: '揭开朱砂封印，进入书中', next: 'city', tone: 'gold' },
      { id: 'listen', text: '先循着金铁之声寻找线索', next: 'clue', tone: 'jade' },
      { id: 'leave', text: '合上古卷，尝试离开藏经阁', next: 'sealed', tone: 'red' },
    ],
  },
  city: {
    id: 'city', chapter: 2, title: '长安异闻', speaker: '守卷人',
    text: '墨色漫过视野。再睁眼时，你已立在长安城外，城门上的铜钉正一颗颗渗出金光。守卷人说，今夜有一位不属于此书的人物闯入城中；若不能在子时前找到他，两部典籍的命数都会纠缠在一起。',
    choices: [
      { id: 'gate', text: '查看城门留下的金色划痕', next: 'ending', tone: 'jade' },
      { id: 'market', text: '前往西市打听陌生人的去向', next: 'ending', tone: 'gold' },
    ],
  },
  clue: {
    id: 'clue', chapter: 2, title: '残页低语', speaker: '神秘声音',
    text: '声音来自书架背后。你抽出一页残纸，上面画着一根直指云端的铁棒，旁边却写着“三顾茅庐”四字。两个世界已开始重叠，而残页边缘的墨迹仍在向同一个名字聚拢。',
    choices: [
      { id: 'name', text: '读出墨迹聚成的名字', next: 'ending', tone: 'gold' },
      { id: 'burn', text: '用灯火烧掉这张错乱的残页', next: 'sealed', tone: 'red' },
    ],
  },
  sealed: {
    id: 'sealed', chapter: 2, title: '无门可退', speaker: '守卷人',
    text: '门没有打开。整座藏经阁像一页被折起的纸，四壁向中间缓慢合拢。你终于明白，拒绝选择本身也会成为命运的一笔。朱砂印重新浮在掌心，等待你作出决定。',
    choices: [{ id: 'return', text: '回到卷首，重新选择', next: 'intro', tone: 'gold' }],
  },
  ending: {
    id: 'ending', chapter: 3, title: '异客现身', speaker: '旁白',
    text: '鼓声三响，长街尽头的雾被一道金光劈开。那位异客终于回头，身后的影子却同时属于两部典籍。你记下了他的名字，也因此获得改写下一章的资格。第一卷在晨光中缓缓合上。',
    ending: true,
  },
}

export function StoryView() {
  const { characters } = useGameStore()
  const [started, setStarted] = useState(false)
  const [nodeId, setNodeId] = useState('intro')
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [drawer, setDrawer] = useState<'chapters' | 'context' | null>(null)
  const timerRef = useRef<number | null>(null)
  const node = storyNodes[nodeId]

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (!drawer) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [drawer])

  const choose = (choice: NonNullable<DemoStoryNode['choices']>[number]) => {
    setIsGenerating(true)
    setHistory((current) => [...current, choice.text])
    timerRef.current = window.setTimeout(() => {
      setNodeId(choice.next)
      setIsGenerating(false)
      setDrawer(null)
    }, 620)
  }

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setNodeId('intro')
    setHistory([])
    setIsGenerating(false)
    setStarted(false)
  }

  if (!started) {
    return (
      <main className="page-shell story-entry-page">
        <div className="page-container">
          <header className="page-header">
            <div><span className="section-kicker">本地剧情演示</span><h1 className="page-title">浮生录</h1><p className="page-lead">让典籍人物走入同一页故事，每次选择都会留下新的墨迹。</p></div>
          </header>
          <section className="story-threshold panel">
            <div className="story-sigil"><BookOpen aria-hidden="true" /><Sparkles aria-hidden="true" /></div>
            <div><span className="section-kicker">卷一待启</span><h2>墨夜藏卷</h2><p>当前使用确定性的本地章节，不调用需要认证的 AI 剧情接口。</p></div>
            <div className="story-threshold-action"><span>{characters.length > 0 ? `${characters.length} 位角色可作为故事线索` : '离线时仍可阅读演示章节'}</span><button type="button" className="button-primary" onClick={() => setStarted(true)}>展开第一卷<ChevronRight aria-hidden="true" /></button></div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="story-reader">
      <header className="story-reader-topbar">
        <div><span className="section-kicker">浮生录 · 本地演示</span><strong>{node.title}</strong></div>
        <div className="story-mobile-tools">
          <button type="button" onClick={() => setDrawer('chapters')}><ListTree aria-hidden="true" />章节</button>
          <button type="button" onClick={() => setDrawer('context')}><Lightbulb aria-hidden="true" />线索</button>
        </div>
        <button type="button" className="story-reset" onClick={reset}><RotateCcw aria-hidden="true" />重新起卷</button>
      </header>

      <div className="story-reader-layout">
        <aside className={`story-chapters${drawer === 'chapters' ? ' is-open' : ''}`} aria-label="章节卷轴">
          <button type="button" className="drawer-close" onClick={() => setDrawer(null)} aria-label="关闭章节"><X /></button>
          <span className="section-kicker">章节</span>
          <ol>
            {[1, 2, 3].map((chapter) => (
              <li key={chapter} className={node.chapter === chapter ? 'is-active' : node.chapter > chapter ? 'is-complete' : ''}>
                <span>{String(chapter).padStart(2, '0')}</span>
                <div><strong>{chapter === 1 ? '墨夜开卷' : chapter === 2 ? '长安异闻' : '异客现身'}</strong><small>{node.chapter > chapter ? '已阅' : node.chapter === chapter ? '当前' : '未解锁'}</small></div>
              </li>
            ))}
          </ol>
          <div className="story-history-compact"><span>你的选择</span>{history.length > 0 ? history.map((choice, index) => <p key={`${choice}-${index}`}>{choice}</p>) : <p>尚未落笔</p>}</div>
        </aside>

        <article className="story-manuscript">
          {isGenerating ? (
            <PageState kind="loading" title="墨迹正在续写下一页…" />
          ) : (
            <>
              <header><span>卷 {node.chapter}</span><h1>{node.title}</h1><p>{node.speaker}</p></header>
              <p className="story-prose">{node.text}</p>
              {node.ending ? (
                <div className="story-ending"><Sparkles aria-hidden="true" /><h2>第一卷已合</h2><p>下一段命数将在新的选择中展开。</p><button type="button" className="button-primary" onClick={reset}>重开一卷</button></div>
              ) : (
                <section className="story-choice-list" aria-labelledby="story-choices-title">
                  <div className="story-section-heading"><span>抉择</span><h2 id="story-choices-title">下一笔如何落下</h2></div>
                  {node.choices?.map((choice, index) => (
                    <button key={choice.id} type="button" className={`story-choice tone-${choice.tone}`} onClick={() => choose(choice)}>
                      <span>{String(index + 1).padStart(2, '0')}</span><strong>{choice.text}</strong><ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </section>
              )}
              <footer>第 {node.chapter} 章 · 墨夜藏卷</footer>
            </>
          )}
        </article>

        <aside className={`story-context${drawer === 'context' ? ' is-open' : ''}`} aria-label="剧情信息">
          <button type="button" className="drawer-close" onClick={() => setDrawer(null)} aria-label="关闭线索"><X /></button>
          <section><div className="story-aside-heading"><Users aria-hidden="true" /><h2>当前角色</h2></div><div className="story-character-list">{characters.slice(0, 3).map((character) => <span key={character.id}>{character.name}<small>{character.originBook}</small></span>)}{characters.length === 0 && <span>守卷人<small>本地演示</small></span>}</div></section>
          <section><div className="story-aside-heading"><Lightbulb aria-hidden="true" /><h2>线索</h2></div><ul><li>未干的朱砂指印</li><li>跨越典籍的金铁之声</li><li>正在聚拢的墨迹</li></ul></section>
          <section><div className="story-aside-heading"><MapPin aria-hidden="true" /><h2>当前目标</h2></div><p>在子时前确认异客身份，并避免两部典籍的命数彻底重叠。</p></section>
          <section className="story-ai-note"><Clapperboard aria-hidden="true" /><div><strong>演示状态</strong><span>剧情内容来自本地固定节点。</span></div></section>
        </aside>
      </div>

      {drawer && <button type="button" className="drawer-scrim" onClick={() => setDrawer(null)} aria-label="关闭抽屉" />}
    </main>
  )
}
