# 万卷浮生前端 UI 设计案

> 版本：v1.0
> 定位：东方志怪 × 古籍阅读 × 角色卡牌 × 回合制战斗
> 视觉主题：**墨夜藏卷**

## 1. 设计目标

“万卷浮生”是一款基于中国古典名著角色的 AI 卡牌对战游戏。前端界面需要同时承载四种体验：

1. 让玩家像打开古籍一样进入游戏世界。
2. 让角色与法宝像藏品一样被收藏和查看。
3. 让剧情阅读具有沉浸感和可探索性。
4. 让战斗页具备清晰、紧凑、可操作的竞技 HUD。

整体不采用普通 SaaS 仪表盘风格，也不把所有页面强行做成同一种布局，而是使用统一的色彩、字体、边框、按钮和动效语言，针对不同界面使用不同的信息结构。

## 2. 技术约束

- React + TypeScript + Vite
- Tailwind CSS
- GSAP
- lucide-react
- Zustand
- React Router

## 3. 页面路由

| 路由 | 页面 | 主要职责 |
| --- | --- | --- |
| `/` | 欢迎页 | 世界观入口、开始游戏、导航 |
| `/library` | 书库首页 | 小说、章节和内容入口 |
| `/characters` | 角色库 | 角色浏览、筛选、收藏 |
| `/characters/:id` | 角色详情 | 属性、技能、形态、装备 |
| `/items` | 法宝库 | 法宝浏览、稀有度和装备 |
| `/story` | 剧情阅读 | 正文、分支、线索和关系 |
| `/battle` | 战斗页面 | 回合制战斗 HUD |
| `/battle/result` | 战斗结算 | 战报、奖励、成长和分享 |
| `/settings` | 设置与 AI 配置 | 外观、模型、数据和偏好 |

## 4. 视觉设计系统

### 4.1 色彩 Token

```css
:root {
  --ink-night: #0b0a09;
  --ink-deep: #15110e;
  --paper-light: #f3e7cf;
  --paper-muted: #c9bda8;
  --gold-main: #c9a962;
  --gold-bright: #e4c879;
  --vermillion: #b93a2e;
  --jade: #6d9d87;
  --wood-dark: #3a261a;
  --line-gold: rgba(201, 169, 98, 0.38);
  --line-paper: rgba(243, 231, 207, 0.18);
}
```

使用原则：

- 墨黑：页面、侧栏和战斗背景。
- 绢纸色：阅读区、角色说明和卡牌文字。
- 鎏金：主要按钮、稀有度、重要数据和焦点态。
- 朱砂：攻击、危险、失败和战斗反馈。
- 青玉：AI 状态、成功、恢复和剧情线索。
- 不使用紫色渐变和大面积玻璃拟态。

### 4.2 字体

- 标题：`Noto Serif SC`、`Source Han Serif SC` 或系统宋体。
- 正文：`Noto Sans SC`、`Microsoft YaHei` 或系统黑体。
- 数值：使用等宽数字或 `tabular-nums`。
- 标题不全部加粗，以字号、字重和留白建立层级。

### 4.3 形状和材质

- 面板：切角矩形、细边框、低透明度纸纹。
- 卡牌：轻微圆角，避免普通 SaaS 卡片的强圆角。
- 主要按钮：鎏金底色、墨色文字。
- 次要按钮：透明底、金色边线。
- 战斗按钮：朱砂底色、绢纸文字。
- 页面纹理只做背景层，不影响正文和数据可读性。

## 5. 应用框架

### 5.1 桌面端

```text
┌──────────────┬─────────────────────────┐
│              │ 顶部页面标题 / 状态      │
│   左侧导航   ├─────────────────────────┤
│              │                         │
│              │      页面内容区域        │
│              │                         │
└──────────────┴─────────────────────────┘
```

- 左侧导航宽度：232px。
- 内容最大宽度：1440px。
- 页面内容左右留白：32px–48px。
- 战斗页面隐藏普通导航，改用全屏 HUD。

### 5.2 移动端

- 左侧导航变为底部导航栏。
- 底部导航高度：64px，并保留安全区。
- 主要操作固定在底部安全区上方。
- 卡牌改为横向滑动或两列布局。
- 战斗页面不允许横向溢出。

### 5.3 公共组件

```text
AppShell
SideNavigation
BottomNavigation
PageHeader
PaperPanel
InkButton
GoldButton
VermillionButton
CharacterCard
ItemCard
RarityBadge
StatBar
SkillButton
StoryChoice
BattleHud
Toast
Modal
LoadingState
EmptyState
```

## 6. 首页 / 欢迎页

参考方案：[3D Collectible Hero](https://motionsites.ai/?prompt=3d-collectible-hero)

### 6.1 页面定位

让用户感觉自己正在打开一本神秘古籍。

### 6.2 页面结构

```text
左侧：
万卷浮生
让玩家进入小说，养成角色，改写命运

[开始游戏]
[进入书库]
[查看角色]

右侧：
动态书卷 / 宝塔 / 当前收藏角色
漂浮的卡牌、墨迹和金色粒子

底部：
角色库  法宝库  剧情  对战
```

### 6.3 关键交互

- 首次进入：书卷缓慢展开。
- 主视觉轻微旋转或上下浮动。
- 鼠标移动时，藏品产生 1–2px 视差。
- 点击“开始游戏”后出现墨迹扩散转场。
- 移动端取消复杂 3D，只保留书卷和卡牌层叠。

### 6.4 追加 Prompt

```text
Adapt this design into the welcome page of “万卷浮生”, an oriental fantasy AI character card battle game based on Chinese classical literature.

Do not use a generic SaaS landing page. The page should feel like opening an ancient animated manuscript.

Use a dark ink-night background, warm paper typography, restrained antique gold accents, vermillion red for battle-related actions, and jade green for AI-related states.

Create a split layout:
- left side: product title, short poetic description, primary action “开始游戏”, secondary action “进入书库”
- right side: a floating ancient scroll, pagoda silhouette, or collectible character card
- bottom area: four entrances for characters, items, story, and battle

Use subtle parallax and floating motion only. Avoid excessive gradients, neon colors, glassmorphism, and oversized marketing typography.

The design must work inside an existing React + TypeScript + Vite frontend and use reusable components.
```

## 7. 角色库 / 法宝库

参考方案：[Animated Cards](https://motionsites.ai/sections?prompt=animated-cards)

### 7.1 页面定位

角色和法宝是游戏的核心收藏内容，因此这里采用动态藏品卡牌结构。

### 7.2 页面结构

```text
页面标题：角色库

[全部] [西游记] [三国] [水浒] [红楼] [封神] [神话]

[搜索角色] [按战力排序] [按稀有度排序]

[孙悟空卡] [关羽卡] [哪吒卡] [林黛玉卡]
```

### 7.3 角色卡内容

- 角色立绘。
- 姓名和出处。
- 稀有度。
- 战力。
- 生命、攻击、防御等核心属性。
- 已收藏、未解锁或出战状态。
- 当前形态。

### 7.4 卡牌动效

- 悬停：卡牌轻微倾斜。
- 点击：展开详情侧栏。
- 稀有度：金色或朱砂光线扫过。
- 未解锁：纸张遮罩和锁形图标。
- 移动端：只保留边框亮起，不做 3D 旋转。

### 7.5 追加 Prompt

```text
Transform the design into a Chinese classical literature character and item collection library.

The main content is a responsive grid of collectible cards, not a SaaS feature-card layout.

Each character card must include:
- portrait image
- Chinese character name
- source work
- rarity badge
- combat power
- health, attack, defense, and speed
- locked or collected state

Use four rarity treatments:
- legendary: antique gold
- epic: muted purple
- rare: jade blue
- common: gray paper

Use dark ink panels, paper-colored text, thin gold borders, and restrained vermillion accents.

Cards should have a subtle hover tilt and a small border-light animation, but no excessive scaling or flashy neon effects.

Add filters for source work, rarity, combat power, and search. The layout must support desktop four-column cards, tablet three-column cards, and mobile two-column cards.
```

## 8. 角色详情页

### 8.1 页面结构

```text
┌─────────────────────────────────────────┐
│ 返回角色库        角色详情                │
├───────────────┬───────────────┬─────────┤
│   角色卡牌     │ 角色信息       │ 属性面板 │
├───────────────┴───────────────┴─────────┤
│ 形态  技能  法宝  背景故事  出战按钮       │
└─────────────────────────────────────────┘
```

左侧展示角色立绘、稀有度、等级和形态切换；中间展示姓名、称号、出处、背景和标签；右侧展示生命、攻击、防御、速度和技能效果；底部展示主动技能、被动技能、装备法宝和“选择出战”。

### 8.2 追加 Prompt

```text
Create a character detail screen for an oriental fantasy card battle game.

Use a three-column layout:
- left: large collectible character card with portrait, rarity, level, and form switcher
- center: character identity, title, source novel, short lore, and tags
- right: combat attributes with clear stat bars for health, attack, defense, and speed

The bottom section should contain skills, equipped items, and a primary “选择出战” action.

The visual style must feel like a museum display of a legendary literary character. Use paper textures sparingly, dark ink backgrounds, antique gold borders, and vermillion highlights only for combat actions.

Do not make the page look like a modern dashboard. Keep generous negative space and strong typographic hierarchy.
```

## 9. 剧情阅读页

参考方案：[Interactive Discovery](https://motionsites.ai/?prompt=interactive-discovery)

### 9.1 页面结构

```text
┌────────────┬─────────────────────┬────────────┐
│ 章节卷轴     │   绢纸阅读区域       │ 剧情信息    │
│ 第一章       │   剧情正文           │ 当前角色    │
│ 第二章       │                     │ 线索        │
│ 第三章       │                     │ 关系 / 任务 │
└────────────┴─────────────────────┴────────────┘
```

- 中央阅读区宽度：680px–760px。
- 正文优先，使用较大行高。
- 关键人物、物品和地点可点击查看。
- 选择分支使用金色、朱砂或青玉边框区分状态。
- 移动端将左右面板改为可展开抽屉。

### 9.2 追加 Prompt

```text
Turn this into an immersive story-reading interface for “万卷浮生”.

The center of the screen must prioritize readable Chinese narrative text inside a warm paper manuscript panel.

Add:
- a left chapter timeline styled as a vertical scroll
- a centered reading column with generous line height
- a right context panel showing current characters, clues, relationships, and active objectives
- interactive character and item terms inside the story
- branching choices displayed as manuscript-style buttons

Use paper ivory, ink black, muted gold, vermillion danger states, and jade AI suggestion states.

The reading experience should feel calm and literary. Avoid dense dashboards, excessive animation, card stacking, and modern SaaS visual language.

On mobile, collapse the left and right panels into expandable drawers while keeping the reading column full width.
```

## 10. 战斗页面

参考方案：[Tech-Forward](https://motionsites.ai/?prompt=tech-forward) + [Retro-Futurist](https://motionsites.ai/?prompt=retro-futurist)

### 10.1 页面结构

```text
┌─────────────────────────────────────────┐
│ 回合 03       战斗叙事       设置 / 退出  │
├────────────┬────────────────┬───────────┤
│ 我方角色    │    战斗区域     │ 敌方角色   │
│ 生命 / 状态 │ 伤害与技能动画   │ 生命 / 状态 │
│ 法宝       │                │ 法宝      │
├────────────┴────────────────┴───────────┤
│ 技能冷却   [攻击] [防御] [技能] [法宝]     │
└─────────────────────────────────────────┘
```

### 10.2 战斗信息

- 顶部：当前回合、行动方、战斗模式、自动战斗、战斗速度。
- 左侧：我方角色、生命条、状态、法宝和战力。
- 右侧：敌方角色、生命条、状态、法宝和战力。
- 中央：角色动作、技能特效、伤害数字和战斗叙事。
- 底部：攻击、防御、主动技能、法宝和结束回合。

### 10.3 动效

- 普通攻击：朱砂轨迹。
- 暴击：鎏金闪光。
- 防御：青灰护盾。
- 技能释放：墨迹扩散。
- 角色死亡：暗色淡出。
- 胜利：金色纸屑和卷轴展开。
- 失败：朱砂裂纹和低饱和处理。

### 10.4 追加 Prompt

```text
Convert this into a full-screen turn-based battle HUD for an oriental fantasy character card game.

Do not create a generic futuristic game interface. Preserve the information architecture of a modern battle HUD, but restyle it with Chinese classical literature aesthetics.

Layout:
- top bar: round number, active side, battle mode, speed, and exit
- left side: player character portrait, health, status effects, combat power, and equipped item
- right side: enemy character portrait, health, status effects, combat power, and equipped item
- center: a large open arena area for character animation, skill effects, and battle narration
- bottom action tray: attack, defend, active skill, item, and end turn

Use ink black and deep brown backgrounds. Use vermillion for damage and danger, antique gold for critical hits and victories, and jade green for healing or AI suggestions.

Keep the center visually open. Never cover the battle animation with dense cards.

Use clear cooldown states, disabled states, loading states, and reduced-motion fallbacks.
```

## 11. 战斗结算页

### 11.1 页面结构

```text
                 胜利 / 失败

        孙悟空击败了二郎神

┌──────────────┬──────────────┐
│ 战斗统计       │ 关键回合       │
│ 造成伤害       │ 第 3 回合      │
│ 承受伤害       │ 使用技能       │
│ 治疗量         │ 扭转战局       │
└──────────────┴──────────────┘

[再次挑战] [返回大厅] [生成战报图]
```

### 11.2 追加 Prompt

```text
Create a battle result page styled as an illustrated ancient battle report.

Show:
- victory or defeat state
- winner and defeated character
- total damage, damage received, healing, and turns
- key battle moments in a vertical timeline
- rewards, experience, item drops, and character growth
- actions for rematch, return to lobby, and generate shareable report

Use a manuscript layout with paper panels, ink typography, vermillion defeat accents, and antique gold victory accents.

The result should feel rewarding and readable, not like a financial analytics dashboard.
```

## 12. 设置与 AI 配置页

### 12.1 页面结构

```text
设置

[外观设置]
主题：墨夜 / 绢纸 / 自动
动效：开启 / 关闭
字体大小：小 / 中 / 大

[AI 设置]
模型选择
API 地址
API Key
剧情生成偏好
战斗叙事风格

[数据设置]
导出数据
清除缓存
恢复默认设置
```

### 12.2 追加 Prompt

```text
Create a settings and AI configuration workbench for a local-first Chinese literary game.

Organize the page into clear sections:
- appearance and theme
- motion preferences
- AI model and API configuration
- story generation preferences
- battle narration preferences
- local data import and export

Use a restrained workbench aesthetic with ink panels, paper labels, gold focus rings, and clear validation messages.

Sensitive API key fields must be masked. Include empty, invalid, saving, saved, and error states.

Do not use a generic SaaS admin dashboard style. Keep the interface compact, calm, and suitable for a desktop game tool.
```

## 13. 响应式规范

### 桌面端

- `>= 1280px`：完整三栏布局。
- `1024px–1279px`：减少侧栏宽度，卡牌三列。
- `768px–1023px`：侧栏收缩为图标导航。
- `<768px`：移动端底部导航。

### 移动端

- 首页左右分栏改为上下布局。
- 角色详情改为纵向排列。
- 剧情页左右栏变为抽屉。
- 战斗页保留顶部 HUD 和底部操作区。
- 主要按钮最小触控面积为 44×44px。
- 所有弹窗改为底部抽屉。

### 响应式追加 Prompt

```text
Make the entire interface responsive.

Desktop:
- persistent left navigation
- multi-column character and item grids
- three-column character detail page
- full battle HUD with side character panels

Tablet:
- collapsible navigation
- reduced panel spacing
- three-column or two-column cards depending on width

Mobile:
- bottom navigation
- two-column collection cards
- stacked character detail layout
- story side panels become drawers
- battle controls remain fixed at the bottom
- all touch targets must be at least 44 by 44 pixels

Preserve the ink, paper, gold, vermillion, and jade visual system at every breakpoint.
```

## 14. 动效规范

```text
页面进入：420ms 淡入 + 轻微上移
卡牌悬停：180ms 边框高亮 + 1px 位移
弹窗打开：260ms 由下向上
侧栏展开：320ms
卷轴展开：500ms
技能释放：600ms–900ms
战斗结算：800ms
```

必须支持减少动效：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 120ms !important;
    transition-duration: 120ms !important;
  }
}
```

避免使用：

- 无限循环的强烈缩放。
- 大面积霓虹光。
- 频繁的 3D 旋转。
- 遮挡正文和战斗数据的粒子。
- 所有按钮统一弹跳。

## 15. 状态设计

每个页面至少需要定义以下状态：

- 初始加载。
- 加载失败。
- 空数据。
- 搜索无结果。
- 禁用操作。
- 保存中。
- 保存成功。
- 保存失败。
- 未解锁内容。
- 网络断开。
- AI 生成中。
- AI 生成失败。

状态提示优先使用页面内联反馈；只有异步完成、错误或需要用户立即注意的内容才使用 Toast。

## 16. 推荐实施顺序

1. 完成公共色彩、字体、间距和 `AppShell`。
2. 完成首页和公共导航。
3. 完成角色卡、法宝卡和角色详情。
4. 完成剧情阅读页。
5. 完成战斗 HUD。
6. 完成战斗结算和分享战报。
7. 补齐移动端、加载态、空状态和错误状态。

## 17. 设计验收标准

- 首页能够清楚表达“进入书中世界”的产品定位。
- 角色库中，角色卡、稀有度和战力信息一眼可读。
- 角色详情页不依赖弹窗即可查看核心属性和技能。
- 剧情页正文始终是视觉中心。
- 战斗页中央区域不会被 HUD 遮挡。
- 移动端可以完成角色选择、剧情选择和战斗操作。
- 所有主要操作拥有 hover、focus、disabled 和 loading 状态。
- 动效不会影响阅读、数据识别和战斗操作。

## 18. 最终设计结论

“万卷浮生”采用以下页面风格组合：

| 页面 | 主要方案 | 视觉重点 |
| --- | --- | --- |
| 首页大厅 | 3D Collectible Hero | 书卷、宝塔、藏品入口 |
| 角色/法宝库 | Animated Cards | 动态卡牌、收藏感 |
| 剧情阅读 | Interactive Discovery | 探索、卷轴、沉浸阅读 |
| 战斗界面 | Tech-Forward + Retro-Futurist | HUD、技能、战斗信息 |
| 结算页面 | 藏品展示风格 | 战报、奖励、成长 |

最终体验目标：

> **像打开一本古籍一样进入世界，像翻阅藏品一样收集角色，像观看一场志怪演义一样完成战斗。**

## 19. MotionSites 参考入口

- [MotionSites 官网](https://motionsites.ai/)
- [3D Collectible Hero](https://motionsites.ai/?prompt=3d-collectible-hero)
- [Animated Cards](https://motionsites.ai/sections?prompt=animated-cards)
- [Tech-Forward](https://motionsites.ai/?prompt=tech-forward)
- [Retro-Futurist](https://motionsites.ai/?prompt=retro-futurist)
- [Interactive Discovery](https://motionsites.ai/?prompt=interactive-discovery)

以上官方页面用于复制原始参考 Prompt；本文件中的追加 Prompt 是针对“万卷浮生”项目重新编写的定制内容，不等同于 MotionSites 原始 Prompt。
