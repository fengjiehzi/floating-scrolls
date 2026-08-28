import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  LayoutGrid,
  RotateCcw,
  BookOpen,
  Users,
  Shield,
  Swords,
  Settings,
  Scroll,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SkyLayer, PortalBuildingLayer, CaveFrameLayer, FrontCloudsLayer } from './GalleryLayers'
import { HeroCharacterCards } from './HeroCharacterCards'
import { GalleryCardStrip } from './GalleryCardStrip'
import type { Character } from '@/types'
import './immersive-gallery.css'

gsap.registerPlugin(ScrollTrigger)

interface ImmersiveCharacterGalleryProps {
  characters: Character[]
  onToggleViewMode: () => void
}

export function ImmersiveCharacterGallery({
  characters,
  onToggleViewMode,
}: ImmersiveCharacterGalleryProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 检查减弱动效偏好
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) return

      const track = trackRef.current
      if (!track) return

      // 主时间线驱动 500vh 钉扎视口
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => {
            setScrollProgress(Math.round(self.progress * 100))
          },
        },
      })

      // 0% -> 15%: 洞天岩壁从 1.12 平稳推进至 1.0
      tl.fromTo(
        '#gallery-cave-layer',
        { scale: 1.12, opacity: 1 },
        { scale: 1.0, opacity: 1, duration: 1.5, ease: 'none' },
        0
      )

      // 15% -> 24%: 左侧文案渐显
      tl.fromTo(
        '.intro-narrative',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
        1.5
      )

      // 20% -> 31%: 右侧三张琉璃卡片交错进场
      tl.fromTo(
        '.hero-stagger-card',
        { opacity: 0, x: 80 },
        { opacity: 1, x: 0, duration: 1.1, stagger: 0.25, ease: 'power2.out' },
        2.0
      )

      // 32% -> 58%:
      // - 阶段一文案与卡片淡出
      // - 洞口以 50% 44% 为中心急剧放大穿透 (scale: 3.2x) 并淡出
      // - 天空微弱放大 1.06x 制造前后景深
      tl.to(
        ['.intro-narrative', '#gallery-hero-deck'],
        { opacity: 0, y: -24, duration: 1.2, ease: 'power2.in' },
        3.2
      )

      tl.to(
        '#gallery-cave-layer',
        {
          scale: 3.2,
          opacity: 0,
          duration: 2.6,
          ease: 'power1.inOut',
          transformOrigin: '50% 44%',
        },
        3.2
      )

      tl.to(
        '.layer-sky',
        { scale: 1.06, duration: 2.6, ease: 'none' },
        3.2
      )

      // 58% -> 68%: 纯净呼吸区（保持凌霄仙阙与远景云海）

      // 68% -> 80%: 云海中央标题淡入
      tl.fromTo(
        '.sea-headline-block',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' },
        6.8
      )

      // 73% -> 88%: 彩色神魔仙玉卡片带由下至上浮现
      tl.fromTo(
        '#gallery-strip-wrapper',
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' },
        7.3
      )

      // 88% -> 100%: 仙玉卡片带横向巡游漫游
      tl.to(
        '#gallery-strip-track',
        { x: -180, duration: 1.2, ease: 'none' },
        8.8
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // 自动重新演示平滑滚动
  const handleReplayDemo = () => {
    const track = trackRef.current
    if (!track) return

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })

    setTimeout(() => {
      const targetScroll = track.offsetTop + track.offsetHeight - window.innerHeight
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      })
    }, 450)
  }

  const handleSelectCharacter = (id: string) => {
    navigate(`/characters/${id}`)
  }

  return (
    <div className="immersive-gallery-wrapper" ref={containerRef}>
      {/* 500vh 滚动高度舞台 */}
      <div className="gallery-scroll-track" ref={trackRef}>
        {/* 固定在视口中的 100dvh 视口 */}
        <div className="gallery-sticky-viewport">
          {/* 1. 背景与分层视差元素 */}
          <SkyLayer />
          <PortalBuildingLayer />
          <CaveFrameLayer />
          <FrontCloudsLayer />

          {/* 2. 顶栏导航与模式切换 */}
          <header className="gallery-header">
            <div className="gallery-nav-left">
              <button
                type="button"
                className="gallery-back-btn"
                onClick={() => navigate('/')}
                aria-label="返回万卷浮生主页"
                title="返回主页"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                className="gallery-brand-mark"
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Sparkles size={18} className="gallery-star-icon" />
                <span>万卷浮生</span>
              </button>

              <button
                type="button"
                className="gallery-nav-link"
                onClick={() => navigate('/library')}
              >
                <BookOpen size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                典籍库
              </button>
              <button
                type="button"
                className="gallery-nav-link"
                style={{ color: '#fde047', fontWeight: 600 }}
              >
                <Users size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                角色库
              </button>
              <button
                type="button"
                className="gallery-nav-link"
                onClick={() => navigate('/items')}
              >
                <Shield size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                法宝阁
              </button>
            </div>

            <div className="gallery-nav-right">
              <button
                type="button"
                className="gallery-nav-link"
                onClick={() => navigate('/story')}
              >
                <Scroll size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                剧情主线
              </button>
              <button
                type="button"
                className="gallery-nav-link"
                onClick={() => navigate('/battle')}
              >
                <Swords size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                对战竞技
              </button>
              <button
                type="button"
                className="gallery-nav-link"
                onClick={() => navigate('/settings')}
              >
                <Settings size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                设置
              </button>

              {/* 切换至网格目录视图 */}
              <button
                type="button"
                className="gallery-toggle-btn"
                onClick={onToggleViewMode}
                title="切换为卷宗检索目录"
              >
                <LayoutGrid size={15} />
                <span>卷宗目录</span>
              </button>
            </div>
          </header>

          {/* 3. 第一阶段 UI (0% - 32% 洞天入卷) */}
          <div className="phase1-intro-container">
            <div className="intro-narrative">
              <span className="intro-kicker">FALL INTO THE SCROLLS · 洞天入胜</span>
              <h1 className="intro-headline">万卷入胜<br />观天地神魔</h1>
              <p className="intro-desc">
                自古籍石窟而入，俯仰千载神魔灵韵。从《西游记》、《封神演义》到《山海经》，
                向下滑动以穿透洞天晶界，领略万界诸神的凌霄列阵。
              </p>
              <div className="intro-actions">
                <div className="intro-scroll-hint">
                  <span className="scroll-hint-dot" />
                  <span>向下滚动 探索云海</span>
                </div>
              </div>
            </div>

            <HeroCharacterCards onSelectCharacter={handleSelectCharacter} />
          </div>

          {/* 4. 第二/三阶段 UI (68% - 100% 凌霄云海与诸神列阵) */}
          <div className="phase3-sea-container">
            <div className="sea-headline-block">
              <span className="sea-title-kicker">FORGE BEYOND THE SCROLLS · 破卷飞升</span>
              <h2 className="sea-title-main">万界争锋 · 诸神列阵</h2>
              <p className="sea-title-desc">
                不同维度的传奇角色跨越千载在此相会。点击任意仙玉卡牌，即可查阅其本源卷宗、专属神通道术或带入战场。
              </p>
            </div>

            <GalleryCardStrip
              characters={characters}
              onSelectCharacter={handleSelectCharacter}
            />
          </div>

          {/* 5. 底部信息与重放按钮 */}
          <footer className="gallery-bottom-bar">
            <button
              type="button"
              className="gallery-replay-btn"
              onClick={handleReplayDemo}
              title="平滑重放滚动演示"
            >
              <RotateCcw size={14} />
              <span>重放全卷演示</span>
            </button>

            <div className="gallery-progress-indicator">
              <span>展卷进度</span>
              <div className="gallery-progress-bar-wrap">
                <div
                  className="gallery-progress-bar-fill"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
              <span style={{ fontVariantNumeric: 'tabular-nums', width: '3ch' }}>
                {scrollProgress}%
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
