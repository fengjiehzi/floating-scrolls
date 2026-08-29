import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  BookOpen,
  ChevronDown,
  Search,
  X,
  Check,
  ScrollText,
} from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

export interface HeroDeckCharacter {
  id: string
  name: string
  source: string
  specialty: string
  grade: 'S' | 'A' | 'B' | 'C'
  rarity: 'legendary' | 'epic' | 'rare' | 'common'
  image: string
  quote: string
  description: string
  power: number
  stats: {
    attack: number
    defense: number
    speed: number
    intelligence: number
    special: number
  }
  skills: string[]
  accentColor: string
}

// 23 位核心典籍名士专属文学设定、诗号与光晕配置
const CANONICAL_PRESETS: Record<string, Partial<HeroDeckCharacter>> = {
  孙悟空: {
    specialty: '齐天神威 · 斗战狂战',
    quote: '金猴奋起千钧棒，玉宇澄清万里埃。',
    description: '金箍棒挟万钧之力，七十二变莫测通神。若面临强敌硬战，大圣当为破阵首选。',
    accentColor: '#f59e0b',
  },
  唐僧: {
    specialty: '金蝉法相 · 佛光慈悲',
    quote: '心生，种种魔生；心灭，种种魔灭。',
    description: '身披锦襕袈裟，手持九环锡杖。以深厚佛法化解凶戾，安定全队心神。',
    accentColor: '#eab308',
  },
  猪八戒: {
    specialty: '天蓬神威 · 罡风巨力',
    quote: '当年曾做天蓬帅，执掌天河水路兵。',
    description: '手持九齿钉耙，身具天罡变化与磅礴体力，能抗能打，勇猛无俦。',
    accentColor: '#ec4899',
  },
  诸葛亮: {
    specialty: '卧龙奇谋 · 八阵智控',
    quote: '三顾频烦天下计，两朝开济老臣心。',
    description: '羽扇纶巾，锦囊藏天机。以八阵困敌、借东风火攻，掌控全局战局节奏。',
    accentColor: '#10b981',
  },
  关羽: {
    specialty: '武圣雄风 · 青龙绝斩',
    quote: '玉可碎而不可改其白，竹可焚而不可毁其节。',
    description: '青龙偃月刀重八十二斤，过关斩将如探囊取物，威震华夏之绝世武圣。',
    accentColor: '#ef4444',
  },
  曹操: {
    specialty: '魏武雄图 · 威权统御',
    quote: '对酒当歌，人生几何？周公吐哺，天下归心。',
    description: '挟天子以令诸侯，横槊赋诗。兼具雄才大略与雷霆兵法，睥睨群雄。',
    accentColor: '#8b5cf6',
  },
  刘备: {
    specialty: '昭烈仁义 · 帝王气运',
    quote: '勿以恶小而为之，勿以善小而不为。',
    description: '手执双股剑，桃园结义聚天下豪杰，仁德载道，气运加身。',
    accentColor: '#22c55e',
  },
  貂蝉: {
    specialty: '倾国绝色 · 闭月连环',
    quote: '一点樱桃启绛唇，两行碎玉喷阳春。',
    description: '连环奇计动乾坤，闭月容颜惑敌心，舞影翩跹间化解万丈烽烟。',
    accentColor: '#f43f5e',
  },
  鲁智深: {
    specialty: '花和尚 · 拔树神力',
    quote: '禅杖打开危险路，戒刀杀尽不平人。',
    description: '六十二斤水磨禅杖，倒拔垂杨柳之惊天神力，刚猛不屈，专打不平。',
    accentColor: '#ea580c',
  },
  武松: {
    specialty: '景阳行者 · 醉打狂澜',
    quote: '身纳千秋浩然气，拳震山岗猛虎伏。',
    description: '景阳冈赤手空拳毙猛虎，醉拳连环，身怀无双胆魄与绝顶武艺。',
    accentColor: '#d97706',
  },
  林冲: {
    specialty: '豹子头 · 风雪枪魂',
    quote: '仗义是林冲，为人最朴忠。江湖驰誉望，京国显英雄。',
    description: '八十万禁军教头，林家枪法出神入化，风雪山神庙怒破重围。',
    accentColor: '#3b82f6',
  },
  宋江: {
    specialty: '及时雨 · 忠义领袖',
    quote: '他年若得报冤仇，血染浔阳江口。',
    description: '梁山泊总首领，及时甘霖润泽群雄，号令一百单八将共赴水泊。',
    accentColor: '#a855f7',
  },
  林黛玉: {
    specialty: '绛珠仙韵 · 才情幻境',
    quote: '质本洁来还洁去，强于污淖陷渠沟。',
    description: '孤高傲世，才冠大观。以潇湘才情化作无形心刃，太虚幻境控人心魄。',
    accentColor: '#ec4899',
  },
  贾宝玉: {
    specialty: '通灵顽石 · 赤子心魂',
    quote: '无故寻愁觅恨，有时似傻如狂。',
    description: '落胎衔玉，神瑛侍者转世。通灵宝玉护佑神魂，大观园才情通灵。',
    accentColor: '#f43f5e',
  },
  薛宝钗: {
    specialty: '蘅芜端方 · 冷香玉锁',
    quote: '珍重芳姿昼掩门，自携手瓮灌苔盆。',
    description: '金锁良缘，冷香丸调理阴阳。端方稳重，才德兼备，以和润之术掌控局势。',
    accentColor: '#06b6d4',
  },
  哪吒: {
    specialty: '三头六臂 · 烈火神速',
    quote: '踏火轮擎乾坤圈，翻天覆海显神通。',
    description: '脚踏风火双轮，臂挽乾坤混天。莲花真身兼具疾速突进与暴烈攻伐。',
    accentColor: '#ef4444',
  },
  姜子牙: {
    specialty: '封神执榜 · 奇门道法',
    quote: '宁在直中取，不向曲中求。',
    description: '执掌打神长鞭，杏黄旗护佑金光。奇门遁甲与天道真言定鼎乾坤。',
    accentColor: '#06b6d4',
  },
  妲己: {
    specialty: '九尾妖狐 · 倾世魅术',
    quote: '倾国倾城妖狐相，惑乱三界起风云。',
    description: '轩辕坟九尾真身，绝世魅惑瓦解强敌意志，烈焰炮烙尽显妖王威严。',
    accentColor: '#d946ef',
  },
  二郎神: {
    specialty: '显圣真君 · 天眼神通',
    quote: '仪容清俊貌堂堂，两耳垂肩目有光。',
    description: '三尖两刃神锋，眉间天眼洞察三界一切虚妄，啸天神犬扑杀强敌。',
    accentColor: '#6366f1',
  },
  迪迦: {
    specialty: '光之巨人 · 复合光耀',
    quote: '根本赢不了？我听不懂！',
    description: '来自超古代的光之巨人，随意切换强力与空中形态，哉佩利敖光线贯通天地。',
    accentColor: '#38bdf8',
  },
  白素贞: {
    specialty: '千年水行 · 灵术生机',
    quote: '断桥烟雨千重浪，盗得仙草救凡生。',
    description: '千年修行，水漫金山。兼具江海洪流与回生仙法，攻守兼备。',
    accentColor: '#14b8a6',
  },
  后羿: {
    specialty: '射日神威 · 贯云破天',
    quote: '彤弓素矰射九日，万古箭神落天光。',
    description: '帝俊赐予彤弓白羽，一箭曾射落九日天乌，箭芒所向，无坚不摧。',
    accentColor: '#eab308',
  },
  项羽: {
    specialty: '破釜沉舟 · 绝世霸气',
    quote: '力拔山兮气盖世，时不利兮骓不逝。',
    description: '力拔山兮气盖世，破釜沉舟决死一战。以霸绝天下的神力横扫千军。',
    accentColor: '#f97316',
  },
}

import { FALLBACK_CHARACTERS } from '@/data/charactersData'

// 推荐常驻快捷显示的经典名著列表
const DEFAULT_TOP_BOOKS = ['西游记', '三国演义', '水浒传', '红楼梦', '封神演义']

export function Hero() {
  const [active, setActive] = useState(0)
  const [selectedBook, setSelectedBook] = useState<string>('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { characters, setPreferredFighter } = useGameStore()

  // 1. 全量角色合并 (保证无论数据源如何均能呈现全部 23 位典籍名士)
  const sourceList = characters && characters.length > 0 ? characters : FALLBACK_CHARACTERS

  const allCharacters: HeroDeckCharacter[] = useMemo(() => {
    return sourceList.map((char) => {
      const preset = CANONICAL_PRESETS[char.name] || {}
      return {
        id: String(char.id),
        name: char.name,
        source: char.originBook || '古典名著',
        specialty: preset.specialty || `${char.originBook} · 名士风骨`,
        grade: char.grade || 'A',
        rarity: char.rarity || 'epic',
        image: char.avatar || '/images/classics/characters/xiyouji-sun-wukong.png',
        quote: preset.quote || `${char.name}入卷，与君共赴千秋浮生。`,
        description:
          preset.description || char.description || '从古典名著中苏醒的传奇角色，身怀通玄绝技与深厚修为。',
        power: char.combatPower || 90,
        stats: {
          attack: char.stats?.attack || 80,
          defense: char.stats?.defense || 75,
          speed: char.stats?.speed || 70,
          intelligence: char.stats?.intelligence || 80,
          special: char.stats?.specialAbility || 85,
        },
        skills: char.skills && char.skills.length > 0 ? char.skills.map((s) => s.name) : ['基础攻伐', '身法灵动'],
        accentColor: preset.accentColor || '#f59e0b',
      }
    })
  }, [sourceList])

  // 2. 提取所有典籍书籍及数量统计
  const allBookCategories = useMemo(() => {
    const bookMap = new Map<string, number>()
    allCharacters.forEach((char) => {
      const b = char.source || '其他典籍'
      bookMap.set(b, (bookMap.get(b) || 0) + 1)
    })
    return Array.from(bookMap.entries()).map(([name, count]) => ({
      id: name,
      name,
      count,
    }))
  }, [allCharacters])

  // 3. 常驻快捷显示的典籍（全部 + Top 4 + 当前选中的非常驻典籍）
  const quickPillBooks = useMemo(() => {
    const topExisting = allBookCategories.filter((b) => DEFAULT_TOP_BOOKS.includes(b.name))
    // 如果当前选中的典籍不在 Top 4 中，则动态追加到快捷栏
    const currentActiveNonTop =
      selectedBook !== 'all' && !DEFAULT_TOP_BOOKS.includes(selectedBook)
        ? allBookCategories.find((b) => b.id === selectedBook)
        : null

    return {
      topBooks: topExisting,
      extraSelected: currentActiveNonTop,
    }
  }, [allBookCategories, selectedBook])

  // 4. 浮层内搜索过滤后的典籍列表
  const filteredModalBooks = useMemo(() => {
    const query = bookSearchQuery.trim().toLowerCase()
    if (!query) return allBookCategories
    return allBookCategories.filter((b) => b.name.toLowerCase().includes(query))
  }, [allBookCategories, bookSearchQuery])

  // 5. 根据所选书籍筛选牌库
  const deckList = useMemo(() => {
    if (selectedBook === 'all') return allCharacters
    return allCharacters.filter((c) => c.source === selectedBook)
  }, [allCharacters, selectedBook])

  const count = deckList.length
  const safeActive = active < count ? active : 0
  const currentChar = deckList[safeActive] || deckList[0]

  const handleSelectBook = (bookId: string) => {
    setSelectedBook(bookId)
    setActive(0)
    setIsDropdownOpen(false)
    setBookSearchQuery('')
  }

  // 点击外部关闭下拉浮层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  // 键盘左右方向键翻阅牌库
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === 'ArrowLeft') {
        setActive((prev) => (prev > 0 ? prev - 1 : count - 1))
      } else if (e.key === 'ArrowRight') {
        setActive((prev) => (prev < count - 1 ? prev + 1 : 0))
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [count])

  const handlePrev = () => {
    setActive((prev) => (prev > 0 ? prev - 1 : count - 1))
  }

  const handleNext = () => {
    setActive((prev) => (prev < count - 1 ? prev + 1 : 0))
  }

  const handleEnterRole = (char: HeroDeckCharacter) => {
    if (char.id) {
      setPreferredFighter(char.id)
    }
    navigate(`/characters/${char.id}`)
  }

  // 3D 牌库卡片透视计算
  const visibleCards = useMemo(() => {
    return deckList.map((char, index) => {
      let diff = index - safeActive
      if (diff > count / 2) diff -= count
      if (diff < -count / 2) diff += count

      return {
        char,
        index,
        diff,
        isCurrent: diff === 0,
      }
    })
  }, [deckList, safeActive, count])

  if (!currentChar) return null

  return (
    <div className="relative w-full h-full overflow-hidden font-geist text-white select-none bg-transparent flex flex-col justify-between p-3 sm:p-5 lg:p-6">
      {/* 1. 背景氛围图层 (暗调水墨 + 当前角色景深模糊) */}
      {deckList.map((char, index) => (
        <div
          key={char.id}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out filter blur-2xl scale-110 opacity-20 ${
            safeActive === index ? 'opacity-25' : 'opacity-0 pointer-events-none'
          }`}
          style={{ backgroundImage: `url(${char.image})` }}
          aria-hidden="true"
        />
      ))}

      {/* 墨韵与暗角遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)] pointer-events-none" />

      {/* 2. TOP ZONE: 顶部标题与典籍快捷分类 + 典籍检索抽屉仓 */}
      <header className="relative z-30 flex flex-col gap-2 w-full shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs tracking-widest text-amber-300/80 uppercase font-serif">
                万卷浮生 · 典籍名士展卷
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal leading-tight tracking-tight text-white font-serif">
              唤醒典籍之魂，择一卷名士共赴浮生
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-serif text-amber-300/80 bg-black/40 border border-amber-400/20 px-3.5 py-1.5 rounded-full backdrop-blur-md shrink-0">
            <span>当前展卷</span>
            <strong className="text-amber-300 font-bold">{count}</strong>
            <span>位名士</span>
          </div>
        </div>

        {/* 方案 1：常驻快捷标签 + 位于全部典籍下方的百卷书阁按钮 */}
        <div className="relative flex flex-col gap-1.5 pt-1">
          {/* 第一行：典籍快捷横排 */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1.5 shrink-0 pr-1 text-white/50 text-xs font-serif">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>典籍筛选:</span>
            </div>

            {/* 全部典籍 */}
            <button
              type="button"
              onClick={() => handleSelectBook('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif transition-all duration-300 cursor-pointer shrink-0 ${
                selectedBook === 'all'
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-semibold'
                  : 'bg-black/40 hover:bg-white/10 text-white/70 hover:text-white border border-white/15'
              }`}
            >
              <span>全部典籍</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedBook === 'all' ? 'bg-amber-400/25 text-amber-300' : 'bg-white/10 text-white/45'
                }`}
              >
                {allCharacters.length}
              </span>
            </button>

            {/* 常用四大名著快捷按钮 */}
            {quickPillBooks.topBooks.map((book) => {
              const isSelected = selectedBook === book.id
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleSelectBook(book.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif transition-all duration-300 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-semibold'
                      : 'bg-black/40 hover:bg-white/10 text-white/70 hover:text-white border border-white/15'
                  }`}
                >
                  <span>{book.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-amber-400/25 text-amber-300' : 'bg-white/10 text-white/45'
                    }`}
                  >
                    {book.count}
                  </span>
                </button>
              )
            })}

            {/* 若选中的典籍非常驻 Top4，额外作为高亮激活胶囊呈现 */}
            {quickPillBooks.extraSelected && (
              <button
                type="button"
                onClick={() => handleSelectBook(quickPillBooks.extraSelected!.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif bg-amber-500/25 text-amber-200 border border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-semibold shrink-0"
              >
                <span>{quickPillBooks.extraSelected.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/25 text-amber-300">
                  {quickPillBooks.extraSelected.count}
                </span>
              </button>
            )}
          </div>

          {/* 第二行：位于「全部典籍」正下方的「百卷书阁」展开按钮 */}
          <div className="relative inline-block pl-[74px]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif transition-all duration-300 cursor-pointer shrink-0 ${
                isDropdownOpen
                  ? 'bg-amber-400 text-black font-semibold shadow-[0_0_16px_rgba(245,158,11,0.5)] border border-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>百卷书阁 ({allBookCategories.length})</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* 原方案：直接依附于按钮下方的下拉浮层 (UI与字号精修) */}
            {isDropdownOpen && (
              <div className="absolute left-[74px] top-full mt-2.5 w-[330px] sm:w-[400px] max-h-[460px] rounded-2xl bg-[#120f0d]/98 backdrop-blur-2xl border border-amber-500/45 ring-1 ring-amber-400/20 shadow-[0_24px_64px_rgba(0,0,0,0.95)] p-4 flex flex-col gap-3.5 z-50 animate-fadeIn select-none">
                {/* 浮层头部 */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide">
                        百卷书阁 · 全部入卷典籍
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    title="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 实时典籍搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70" />
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    placeholder="按书名快速检索 (如: 西游、封神、三国)..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/60 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 font-serif transition-all"
                    autoFocus
                  />
                  {bookSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBookSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 典籍列表 (带滚动条) */}
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[260px] pr-1 [scrollbar-width:thin]">
                  {/* 全部典籍选项 */}
                  <button
                    type="button"
                    onClick={() => handleSelectBook('all')}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-serif transition-all cursor-pointer ${
                      selectedBook === 'all'
                        ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-200 border border-amber-400/60 font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'hover:bg-white/10 text-white/85 hover:text-white border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${selectedBook === 'all' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-white/30 group-hover:bg-amber-400/60'}`} />
                      <span className="font-semibold">全部典籍 (全量入卷)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${selectedBook === 'all' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-white/60'}`}>
                        {allCharacters.length} 位名士
                      </span>
                      {selectedBook === 'all' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                  </button>

                  {/* 过滤后的书籍项 */}
                  {filteredModalBooks.map((book) => {
                    const isSelected = selectedBook === book.id
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleSelectBook(book.id)}
                        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-serif transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-200 border border-amber-400/60 font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'hover:bg-white/10 text-white/85 hover:text-white border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400/60 font-serif">《</span>
                          <span className="font-medium tracking-wide">{book.name}</span>
                          <span className="text-amber-400/60 font-serif">》</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold'
                                : 'bg-white/10 text-white/60 group-hover:bg-white/15'
                            }`}
                          >
                            {book.count} 位名士
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                      </button>
                    )
                  })}

                  {filteredModalBooks.length === 0 && (
                    <div className="py-8 text-center text-sm text-white/40 font-serif flex flex-col items-center gap-1.5">
                      <span>暂未查阅到与 “{bookSearchQuery}” 匹配的典籍</span>
                      <span className="text-xs text-white/25">请尝试搜索其他书名或清空关键词</span>
                    </div>
                  )}
                </div>

                {/* 底部轻量提示 */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-serif text-white/40 px-1">
                  <span>支持实时拼音/文字检索</span>
                  <span className="text-amber-300/60">共收录 {allBookCategories.length} 部典籍</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. CENTER ZONE: 中间核心 3D 卡片牌库展卷舞台 */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full my-1 overflow-hidden">
        {/* 左翻页浮动按钮 */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="上一个名士"
          className="absolute left-1 sm:left-4 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/50 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 border border-white/15 hover:border-amber-400/50 backdrop-blur-md transition-all cursor-pointer hover:scale-110 focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* 右翻页浮动按钮 */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="下一个名士"
          className="absolute right-1 sm:right-4 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/50 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 border border-white/15 hover:border-amber-400/50 backdrop-blur-md transition-all cursor-pointer hover:scale-110 focus:outline-none"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* 3D 牌库视口 */}
        <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] flex items-center justify-center [perspective:1200px]">
          {visibleCards.map(({ char, index, diff, isCurrent }) => {
            if (Math.abs(diff) > 2) return null

            // 计算 3D 牌库位移、缩放与透明度
            const translateX = diff * (window.innerWidth < 640 ? 130 : window.innerWidth < 1024 ? 200 : 260)
            const translateZ = -Math.abs(diff) * 130
            const rotateY = diff * -15
            const scale = isCurrent ? 1 : Math.max(0.72, 1 - Math.abs(diff) * 0.16)
            const opacity = isCurrent ? 1 : Math.max(0.25, 0.7 - Math.abs(diff) * 0.25)
            const zIndex = 30 - Math.abs(diff) * 10

            return (
              <article
                key={char.id}
                onClick={() => setActive(index)}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  zIndex,
                  opacity,
                }}
                className={`absolute w-[240px] sm:w-[280px] lg:w-[310px] h-[360px] sm:h-[420px] lg:h-[450px] rounded-2xl cursor-pointer transition-all duration-500 ease-out select-none ${
                  isCurrent
                    ? 'ring-2 ring-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                    : 'hover:opacity-90'
                }`}
              >
                {/* 卡牌主体框架 (琉璃玉石与金属鎏金边框质感) */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#1c1815] via-[#120f0d] to-[#0d0a09] border border-amber-500/35 flex flex-col justify-between p-3.5 shadow-2xl">
                  {/* 卡牌顶部装饰徽章 */}
                  <div className="relative z-20 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-serif font-medium bg-black/60 border border-amber-400/40 text-amber-300 backdrop-blur-md">
                      《{char.source}》
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-amber-400 text-black shadow-sm">
                        {char.grade} 阶
                      </span>
                    </div>
                  </div>

                  {/* 卡牌核心立绘区域 (完整居中显示角色头部与身躯，消除不规则裁剪与偏移) */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center pt-8 pb-20 px-3 overflow-hidden pointer-events-none">
                    {/* 角色背后光晕 */}
                    <div
                      className="absolute w-44 h-44 rounded-full filter blur-2xl opacity-40 transition-colors"
                      style={{ backgroundColor: char.accentColor }}
                    />
                    <img
                      src={char.image}
                      alt={char.name}
                      className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain object-center filter drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                      }}
                    />
                  </div>

                  {/* 底部信息遮罩与文字 */}
                  <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-7 pb-1 px-1 rounded-b-xl">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-white tracking-wide">
                        {char.name}
                      </h2>
                      <div className="flex items-center gap-1 text-amber-300 text-xs font-semibold">
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>战力 {char.power}</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-200/85 font-medium truncate mb-1.5">
                      {char.specialty}
                    </p>

                    {/* 核心技能标签预览 */}
                    <div className="flex flex-wrap gap-1">
                      {char.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/75 border border-white/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>

      {/* 4. BOTTOM ZONE: 底部详细生平、诗号与入卷结契主操作 (无小头像) */}
      <footer className="relative z-10 w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-white/15 pt-3 shrink-0">
        {/* 左侧：生平与诗号 */}
        <div className="flex-1 max-w-3xl">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-serif text-amber-400 font-bold tracking-widest uppercase">
              {selectedBook === 'all' ? '全部典籍' : `《${selectedBook}》`} · 第 {String(safeActive + 1).padStart(2, '0')} / {String(count).padStart(2, '0')} 卷
            </span>
            <span className="text-xs text-white/40">·</span>
            <span className="text-xs text-white/60 font-serif">
              {currentChar.source} · {currentChar.specialty}
            </span>
          </div>

          <p
            key={`quote-${currentChar.name}`}
            className="animate-[fadeIn_0.5s_ease] text-xs sm:text-sm font-serif italic text-amber-300/90 mb-1"
          >
            “{currentChar.quote}”
          </p>

          <p
            key={`desc-${currentChar.name}`}
            className="animate-[fadeIn_0.5s_ease] text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2"
          >
            {currentChar.description}
          </p>
        </div>

        {/* 右侧：入卷结契黄金按钮 */}
        <div className="flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => handleEnterRole(currentChar)}
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-serif font-bold text-sm sm:text-base shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:shadow-[0_0_32px_rgba(245,158,11,0.65)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>入卷结契 · 查看卷宗</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>
      </footer>
    </div>
  )
}

export default Hero
