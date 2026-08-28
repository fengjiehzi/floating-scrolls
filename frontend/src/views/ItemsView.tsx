import { useEffect, useMemo, useState } from 'react'
import { Gem, LockKeyhole, Search, SlidersHorizontal } from 'lucide-react'
import { ItemCard } from '@/components/ItemCard'
import { Modal } from '@/components/Modal'
import { PageState } from '@/components/PageState'
import { RarityBadge } from '@/components/RarityBadge'
import { useGameStore } from '@/store/gameStore'
import type { Item } from '@/types'

const rarityOptions = [
  ['all', '全部稀有度'],
  ['legendary', '传说'],
  ['epic', '史诗'],
  ['rare', '稀有'],
  ['common', '普通'],
] as const

const typeLabels: Record<string, string> = {
  weapon: '兵刃',
  armor: '护具',
  accessory: '佩饰',
  treasure: '法器',
  consumable: '消耗品',
}

const bonusLabels: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  health: '生命',
  speed: '速度',
  mana: '灵力',
}

export function ItemsView() {
  const { items, itemsStatus, itemsError, loadItems } = useGameStore()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [type, setType] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const sources = useMemo(() => [...new Set(items.map((item) => item.source))], [items])
  const types = useMemo(() => [...new Set(items.map((item) => item.type))], [items])
  const filteredItems = useMemo(() => items.filter((item) => {
    const keyword = query.trim().toLowerCase()
    return (!keyword || item.name.toLowerCase().includes(keyword) || item.source.toLowerCase().includes(keyword))
      && (source === 'all' || item.source === source)
      && (type === 'all' || item.type === type)
      && (rarity === 'all' || item.rarity === rarity)
  }), [items, query, rarity, source, type])

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="page-header">
          <div>
            <span className="section-kicker">器藏万象</span>
            <h1 className="page-title">法宝库</h1>
            <p className="page-lead">浏览典籍中的兵刃、护具与法器，查看出处、稀有度和属性加成。</p>
          </div>
          <div className="page-count"><strong>{items.length}</strong><span>件法宝</span></div>
        </header>

        <section className="collection-toolbar" aria-label="法宝筛选">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">搜索法宝</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="按名称或出处检索" />
          </label>
          <div className="collection-selects">
            <SlidersHorizontal aria-hidden="true" />
            <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="按出处筛选">
              <option value="all">全部出处</option>
              {sources.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={type} onChange={(event) => setType(event.target.value)} aria-label="按类型筛选">
              <option value="all">全部类型</option>
              {types.map((value) => <option key={value} value={value}>{typeLabels[value] || value}</option>)}
            </select>
            <select value={rarity} onChange={(event) => setRarity(event.target.value)} aria-label="按稀有度筛选">
              {rarityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </section>

        {itemsStatus === 'loading' ? (
          <PageState kind="loading" title="正在清点法宝…" />
        ) : itemsStatus === 'error' ? (
          <PageState kind="error" title="法宝库暂时无法打开" message={itemsError} actionLabel="重新连接" onAction={() => void loadItems(true)} />
        ) : filteredItems.length === 0 ? (
          <PageState kind="empty" title={items.length === 0 ? '库中尚无法宝' : '没有符合条件的法宝'} message="调整搜索词或筛选条件后再试。" icon={Gem} />
        ) : (
          <div className="item-grid">
            {filteredItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} title={selectedItem?.name} size="lg">
        {selectedItem && (
          <div className="item-detail">
            <div className="item-detail-art">
              <Gem className="asset-fallback-icon" aria-hidden="true" />
              {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.name} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
              <RarityBadge rarity={selectedItem.rarity} />
            </div>
            <div className="item-detail-copy">
              <p className="section-kicker">{selectedItem.source} · {typeLabels[selectedItem.type] || selectedItem.type}</p>
              <p>{selectedItem.description}</p>
              {selectedItem.sourceBasis && <blockquote>{selectedItem.sourceBasis}</blockquote>}
            </div>
            <div className="item-detail-bonuses">
              {Object.entries(selectedItem.statsBonus).map(([key, value]) => (
                <span key={key}><b>{bonusLabels[key] || key}</b> +{value}</span>
              ))}
            </div>
            <div className="protected-action">
              <LockKeyhole aria-hidden="true" />
              <div><strong>装备功能需要登录</strong><span>本次 React UI 不调用受保护的玩家装备接口。</span></div>
              <button type="button" className="button-primary" disabled>装备法宝</button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}
