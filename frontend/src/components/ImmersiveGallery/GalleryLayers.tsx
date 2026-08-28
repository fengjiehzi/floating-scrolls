/**
 * 1. 天空背景层 (Sky Background Layer)
 * 包含紫金星云、恒星微粒与深邃渐变
 */
export function SkyLayer() {
  return (
    <div className="gallery-layer layer-sky" aria-hidden="true">
      <div className="sky-stars-canvas" />
      <div className="sky-nebula-glow" />
    </div>
  )
}

/**
 * 2. 远景仙阙 / 万卷天阁层 (Portal Building Layer)
 * 耸立于远景云海尽头的凌霄宫阙与神光光环
 */
export function PortalBuildingLayer() {
  return (
    <div className="gallery-layer layer-building" aria-hidden="true">
      <div className="portal-building-container">
        <div className="portal-building-halo" />
        <svg
          className="portal-building-svg"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="palace-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="palace-base-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0.8" />
            </linearGradient>
            <filter id="celestial-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 殿阁重檐飞翼 (Multi-tiered Eaves) */}
          <path
            d="M100 28 L114 48 L86 48 Z"
            fill="url(#palace-gold-grad)"
            filter="url(#celestial-glow)"
          />
          <path
            d="M60 62 C75 58 125 58 140 62 L132 72 L68 72 Z"
            fill="url(#palace-gold-grad)"
          />
          <path
            d="M42 86 C65 80 135 80 158 86 L148 98 L52 98 Z"
            fill="url(#palace-gold-grad)"
          />
          <path
            d="M24 116 C55 108 145 108 176 116 L164 130 L36 130 Z"
            fill="url(#palace-gold-grad)"
          />

          {/* 阁楼廊柱与台基 (Pavilion Base & Pillars) */}
          <rect x="76" y="48" width="48" height="14" fill="url(#palace-base-grad)" rx="2" />
          <rect x="62" y="72" width="76" height="14" fill="url(#palace-base-grad)" rx="2" />
          <rect x="46" y="98" width="108" height="18" fill="url(#palace-base-grad)" rx="3" />
          <rect x="30" y="130" width="140" height="28" fill="url(#palace-base-grad)" rx="4" />

          {/* 仙阁立柱细线 (Pillar Lines) */}
          <line x1="56" y1="130" x2="56" y2="158" stroke="#fde047" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="84" y1="130" x2="84" y2="158" stroke="#fde047" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="116" y1="130" x2="116" y2="158" stroke="#fde047" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="144" y1="130" x2="144" y2="158" stroke="#fde047" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* 天阁顶端神珠 (Crown Orb) */}
          <circle cx="100" cy="22" r="5" fill="#ffffff" filter="url(#celestial-glow)" />
        </svg>
      </div>
    </div>
  )
}

/**
 * 3. 洞天岩壁 / 晶石古卷镂空层 (Cave Frame Layer)
 * 中央为椭圆透明洞口，四周为带有紫晶矿脉与金线符文的洞天岩壁
 */
export function CaveFrameLayer() {
  return (
    <div className="gallery-layer layer-cave" id="gallery-cave-layer" aria-hidden="true">
      <svg
        className="cave-frame-svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 遮罩定义：白色为不透明岩壁，黑色为中央镂空透明洞口 */}
          <mask id="cave-aperture-mask">
            <rect width="1920" height="1080" fill="white" />
            {/* 有机起伏的洞天镂空光斑 */}
            <path
              d="M960 160 C1240 150 1480 270 1520 480 C1560 690 1340 880 960 890 C580 900 380 720 400 490 C420 260 680 170 960 160 Z"
              fill="black"
            />
            {/* 边缘微小侵蚀透光 */}
            <circle cx="450" cy="280" r="16" fill="black" opacity="0.4" />
            <circle cx="1490" cy="340" r="22" fill="black" opacity="0.3" />
            <circle cx="510" cy="740" r="18" fill="black" opacity="0.5" />
            <circle cx="1410" cy="710" r="25" fill="black" opacity="0.4" />
          </mask>

          {/* 岩壁暗沉玄岩渐变 */}
          <radialGradient id="cave-rock-grad" cx="50%" cy="44%" r="65%">
            <stop offset="25%" stopColor="#1e1333" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#120b22" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#080410" stopOpacity="1" />
          </radialGradient>

          {/* 紫珀晶石微光 */}
          <linearGradient id="crystal-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b0764" stopOpacity="0.9" />
          </linearGradient>

          {/* 金石裂纹流金 */}
          <linearGradient id="vein-gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. 岩壁主体基底 (带遮罩) */}
        <rect
          width="1920"
          height="1080"
          fill="url(#cave-rock-grad)"
          mask="url(#cave-aperture-mask)"
        />

        {/* 2. 洞天边缘晶簇与钟乳石笋 (Crystalline Stalactites) */}
        {/* 左上晶簇 */}
        <polygon points="180,0 240,160 210,0" fill="url(#crystal-purple)" opacity="0.75" />
        <polygon points="260,0 330,220 290,0" fill="url(#crystal-purple)" opacity="0.85" />
        <polygon points="360,0 410,140 380,0" fill="url(#crystal-purple)" opacity="0.7" />

        {/* 右上晶簇 */}
        <polygon points="1520,0 1560,180 1600,0" fill="url(#crystal-purple)" opacity="0.8" />
        <polygon points="1630,0 1670,250 1710,0" fill="url(#crystal-purple)" opacity="0.9" />
        <polygon points="1740,0 1770,150 1800,0" fill="url(#crystal-purple)" opacity="0.7" />

        {/* 左下与右下升起的石笋晶脉 */}
        <polygon points="120,1080 180,860 230,1080" fill="url(#crystal-purple)" opacity="0.8" />
        <polygon points="240,1080 300,790 350,1080" fill="url(#crystal-purple)" opacity="0.85" />
        <polygon points="1580,1080 1630,810 1690,1080" fill="url(#crystal-purple)" opacity="0.8" />
        <polygon points="1710,1080 1760,880 1810,1080" fill="url(#crystal-purple)" opacity="0.75" />

        {/* 3. 洞天孔壁金石符文裂纹 (Gold Rock Fissures) */}
        <path
          d="M380 480 Q520 210 960 180 Q1400 210 1540 480 Q1380 860 960 870 Q540 850 380 480 Z"
          stroke="url(#vein-gold)"
          strokeWidth="3.5"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M400 470 Q550 240 960 210 Q1370 240 1520 470"
          stroke="#e9d5ff"
          strokeWidth="1"
          strokeDasharray="12 8"
          fill="none"
          opacity="0.4"
        />
      </svg>
    </div>
  )
}

/**
 * 4. 前景流云遮罩层 (Front Clouds Layer)
 * 位于所有卡片之上，遮挡卡片底部，形成烟波浩渺的深邃景深
 */
export function FrontCloudsLayer() {
  return (
    <div className="gallery-layer layer-front-clouds" aria-hidden="true">
      <svg
        className="cloud-mist-svg"
        viewBox="0 0 2400 600"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mist-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#3b0764" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#080410" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="mist-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#6b21a8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#090514" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* 远层流云 */}
        <path
          d="M0 320 C300 240 600 360 900 280 C1200 200 1500 340 1800 260 C2100 180 2400 300 2700 240 L2700 600 L0 600 Z"
          fill="url(#mist-grad-1)"
        />

        {/* 近层翻滚紫金仙雾 */}
        <path
          d="M0 420 C240 330 520 440 820 350 C1120 260 1440 430 1740 330 C2040 230 2360 380 2660 300 L2660 600 L0 600 Z"
          fill="url(#mist-grad-2)"
        />
      </svg>
    </div>
  )
}
