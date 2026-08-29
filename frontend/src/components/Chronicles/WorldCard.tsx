import type { WorldNode } from '@/data/worldsData'

interface WorldCardProps {
  world: WorldNode
  isActive: boolean
  onClick: () => void
  onActionClick: (e: React.MouseEvent) => void
}

export function WorldCard({
  world,
  isActive,
  onClick,
  onActionClick,
}: WorldCardProps) {
  const getStatusClass = (status: WorldNode['status']) => {
    switch (status) {
      case 'exploring':
        return 'is-exploring'
      case 'unlocked':
        return 'is-unlocked'
      case 'enter':
        return 'is-enter'
      default:
        return 'is-enter'
    }
  }

  return (
    <article
      data-world-id={world.id}
      className={`world-card-wrapper ${isActive ? 'is-active' : ''}`}
      style={{
        transformOrigin: 'center bottom',
      }}
    >
      <button
        type="button"
        className="world-card-open-target"
        onClick={onClick}
        aria-label={`查阅《${world.title}》世界秘卷`}
      />

      <span className="world-card-corner corner-tl" aria-hidden="true" />
      <span className="world-card-corner corner-tr" aria-hidden="true" />
      <span className="world-card-corner corner-bl" aria-hidden="true" />
      <span className="world-card-corner corner-br" aria-hidden="true" />

      {/* 顶部金属编号徽章 */}
      <div className="world-card-badge-num">
        {world.number}
      </div>

      {/* 角色立绘艺术图层 */}
      <div className="world-card-art-box">
        <img
          src={world.coverImage}
          alt={world.title}
          className="world-card-art-img"
          style={{ objectPosition: world.artPosition || '50% 15%' }}
          loading="lazy"
        />
        <div className="world-card-shade" />
      </div>

      {/* 下半部分卡牌文字信息 */}
      <div className="world-card-info">
        <h4 className="world-card-title">{world.title}</h4>
        <p className="world-card-subtitle">{world.subtitle}</p>
        <p className="world-card-quote">“{world.quote}”</p>

        {/* 状态徽章按钮 */}
        <button
          type="button"
          onClick={onActionClick}
          className={`world-card-status-btn ${getStatusClass(world.status)}`}
        >
          {world.statusLabel}
        </button>
      </div>

      {/* 底部势力圆形印章节点 */}
      <div className="world-seal-node">
        <div className="world-seal-circle">
          {world.factionChar}
        </div>
        <span className="world-seal-name">{world.factionName}</span>
      </div>
    </article>
  )
}
