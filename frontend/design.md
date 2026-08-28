# Design — 万卷浮生 React

这是 React 重构线的锁定设计系统。页面可以改变内容布局，但必须共享同一套色彩、字体、控件与动效语言。

## Genre

Atmospheric game UI：东方志怪、墨夜、绢纸、朱砂与克制鎏金。参考 MotionSites 的游戏 HUD、藏品焦点和奇幻入口结构，不复制其品牌、素材或像素布局。

## Macrostructure family

- Welcome：Portal Split。左侧叙事与主入口，右侧卷轴/藏品焦点，不做全屏居中 Hero。
- App pages：Edge Workbench。桌面侧轨、移动端底部坞站，内容区域保持低遮挡。
- Story：Long Reading。正文优先，选择与记录作为次级层。
- Battle：Arena HUD。对战信息贴边，中央保留视觉呼吸区，技能作为底部操作层。

## Theme

- 墨夜底色：`--color-paper`、`--color-paper-2`
- 绢纸文字：`--color-ink`、`--color-ink-2`
- 鎏金主强调：`--color-accent`
- 朱砂危险/战斗：`--color-danger`
- 青玉成功/AI：`--color-jade`
- 强调色每个视口占比不超过约 8%，不使用渐变文字。

## Typography

- Display：`Noto Serif SC` / `Source Han Serif SC` / `STSong`，upright。
- Body：`Noto Sans SC` / `PingFang SC` / `Microsoft YaHei`。
- Labels：同 Body，字距轻微增加；数字使用 `tabular-nums`。

## Spacing and shape

- 4px 基础间距。
- 容器以切角、细线和留白区分，不堆叠玻璃卡片。
- 交互目标最小 44×44px；桌面侧轨、移动底栏均保留明确焦点态。

## Motion

- 页面只做一次 420ms 的入场编排。
- hover 只改变边线、墨色或位移 1–2px，不做通用缩放。
- 战斗伤害、回合切换和奖励可以使用更强动效。
- `prefers-reduced-motion` 下改为不超过 120ms 的透明度变化。

## Shared interaction voice

- Primary：鎏金实底、墨色文字、切角矩形。
- Secondary：透明底、细金线或墨色规则线。
- Focus：即时双层焦点环，不参与动画。
- Success：界面内静默反馈；错误和异步完成才使用 Toast。

## Per-page allowances

- Welcome 可使用低成本 CSS 纹理和现有游戏素材。
- Library / Character / Settings 不使用环境装饰，功能和内容本身承担视觉。
- Battle 可使用朱砂、闪光和瞬时位移动效，但不得遮挡技能和生命信息。
