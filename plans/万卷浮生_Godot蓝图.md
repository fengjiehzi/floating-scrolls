# 万卷浮生 · Godot 4 桌面应用开发蓝图

> **项目代号**：万卷浮生
> **目标**：基于 [万卷浮生_完整策划案_v3.md](../万卷浮生_完整策划案_v3.md) 和 [万卷浮生_技术文档.md](../万卷浮生_技术文档.md)，使用 Godot 4 引擎开发完整桌面应用
> **范围**：Windows 桌面应用（x86_64），涵盖策划案规定的全部 8 大核心模块
> **约束**：完全重构现有项目，无需保留原有 Web 实现；仅支持 Windows
> **最后更新**：2026-06-24

---

## 📋 执行摘要

| 维度 | 决策 |
|------|------|
| 引擎 | Godot 4.3+ (GDScript / GDExtension C++) |
| 目标平台 | Windows x86_64 |
| 架构 | 场景树 + 资源系统 + SQLite (Godot内置) |
| AI 集成 | HTTP + OpenAI-compatible API |
| 存档 | Godot Resource 系统 + JSON |
| 打包 | Godot Export Templates → .exe |
| 预计总步骤 | 12 步 |

---

## 📦 步骤清单

| # | 步骤 | 依赖 | 并行候选 | 预计规模 |
|---|------|------|----------|----------|
| 1 | **Godot 项目初始化与架构设计** | — | — | 中 |
| 2 | **本地书库系统** | 1 | — | 大 |
| 3 | **AI 服务配置模块** | 1 | 2 | 小 |
| 4 | **世界书管理系统** | 2 | — | 大 |
| 5 | **角色养成系统（前端 UI）** | 4 | — | 大 |
| 6 | **战斗推演引擎（核心）** | 4, 5 | — | 大 |
| 7 | **战斗 UI 与叙事系统** | 6 | — | 大 |
| 8 | **存档系统** | 1 | 2, 3, 4 | 中 |
| 9 | **导出与分享功能** | 6, 7 | — | 小 |
| 10 | **开源部署与打包配置** | 1~9 | — | 中 |
| 11 | **UI 美化与响应式适配** | 2~9 | — | 中 |
| 12 | **集成测试与最终打包** | 1~11 | — | 中 |

---

## 步骤详情

### 步骤 1：Godot 项目初始化与架构设计

**文件路径**：`e:\万卷浮生\万卷浮生_Godot\`

**上下文简报**：
- 创建 Godot 4 项目，使用 2D + 2D 渲染模式（支持 UI 动画和纹理）
- 项目结构遵循 Godot 约定：`res://scenes/`、`res://scripts/`、`res://resources/`、`res://assets/`
- 全局自动加载（Autoload）用于：GameState（全局状态）、SaveManager（存档管理）、AIService（AI 调用）、NovelParser（小说解析）
- 数据库使用 Godato 内置 SQLite 插件或 json 资源文件存储角色/世界书数据
- 使用 Godot 的 Resource 系统存储角色卡、世界书、存档槽位
- UI 主题使用 Godot 内置 Theme 定制器，采用古风配色（参考策划案 UI 规范）

**任务列表**：
- [ ] 创建 Godot 项目，配置 export_presets.cfg（Windows x86_64）
- [ ] 设计全局 Autoload 节点：GameState、SaveManager、AIService、NovelParser
- [ ] 创建基础场景树：Main（主容器）→ TitleScreen（标题页）→ MainGame（主游戏）→ various scenes
- [ ] 创建基础 UI 主题（themes/main_theme.tres），定义古风配色、字体、控件样式
- [ ] 配置项目设置：窗口尺寸（1280x720 最小）、输入法兼容、导出模板路径
- [ ] 创建 README.md（Godot 部分）

**验证命令**：
```bash
# 检查项目可打开
ls e:/万卷浮生/万卷浮生_Godot/project.godot

# 检查 export_presets.cfg 存在
ls e:/万卷浮生/万卷浮生_Godot/export_presets.cfg
```

**退出标准**：
- Godot 编辑器可正常打开项目
- 基础场景（标题页）可运行
- 全局 Autoload 节点已注册

---

### 步骤 2：本地书库系统

**前置依赖**：步骤 1

**上下文简报**：
- 本地书库是用户导入、存储、管理小说的核心模块（对应策划案「模块 1：小说解析引擎」的输入端）
- 支持文件格式：txt（主要）、epub（需第三方库或预转换）
- 书库结构：用户文件夹 → 按作品分类 → 章节列表
- 小说元数据存储：标题、作者、分类（四大名著/封神/水浒/红楼/聊斋/其他）、字数、导入时间、解析状态
- 书籍检索：按标题/作者/分类搜索
- 书籍阅读：内置文本阅读器，支持章节跳转、进度保存、字体大小调节
- 导入方式：拖拽文件到书库窗口，或通过文件对话框选择

**任务列表**：
- [ ] 书库主场景 `scenes/library/library.tscn`：网格/列表视图切换，书架展示
- [ ] 书籍项场景 `scenes/library/book_item.tscn`：封面（占位图）、标题、作者、分类标签、进度百分比
- [ ] 书库管理逻辑 `scripts/library/library_manager.gd`：导入/删除/分类/搜索/排序
- [ ] 阅读器场景 `scenes/library/reader.tscn`：章节列表、阅读区域（RichTextLabel）、进度条、字体调节
- [ ] 文件导入对话框 `scenes/library/import_dialog.tscn`：拖放区域、文件选择、分类选择
- [ ] 书库元数据存储：使用 JSON 文件 `user://library/library.json`（不含小说正文，只存元数据）
- [ ] 小说正文存储：`user://library/novels/{novel_id}/chapters/` 目录，每章一个 txt

**验证命令**：
```bash
# 模拟导入
echo "第一章测试内容" > /tmp/test.txt
# 手动验证：启动游戏，拖入 test.txt，确认出现在书库中
```

**退出标准**：
- 用户可拖拽导入 txt 文件
- 书库中显示书籍列表（标题、作者、进度）
- 可打开阅读器查看章节内容
- 关闭/重开后阅读进度保留

---

### 步骤 3：AI 服务配置模块

**前置依赖**：步骤 1

**上下文简告**：
- 集中管理所有 AI 服务配置（策划案技术方案中的「多模型可切换」设计）
- 支持 API 类型：OpenAI-compatible（支持智谱 GLM / OpenAI / Claude via reverse proxy）
- 配置项：API Endpoint、API Key、Model Name、Max Tokens、Temperature
- 支持本地模型路径（OLLAMA 等）
- 提供「连接测试」按钮验证配置有效性
- 配置持久化到 `user://config/ai_config.json`
- 支持多套配置切换（个人/团队/本地）

**任务列表**：
- [ ] AI 配置场景 `scenes/settings/ai_config.tscn`：表单 UI、连接测试按钮
- [ ] AI 配置管理脚本 `scripts/settings/ai_config_manager.gd`：CRUD 配置、加密存储 Key、验证连接
- [ ] AIService Autoload `scripts/autoload/ai_service.gd`：统一 AI 调用接口、超时/重试/降级
- [ ] API 调用脚本 `scripts/ai/openai_compatible.gd`：HTTP 请求封装，支持 stream/non-stream
- [ ] 配置导入/导出功能：可导出 ai_config.json 模板给其他用户

**验证命令**：
```bash
# 配置正确时
# 启动游戏 → 设置 → AI配置 → 填入 Key → 点击"测试连接" → 显示"连接成功"
```

**退出标准**：
- 可配置 API Endpoint、Key、Model
- 连接测试显示成功/失败反馈
- 配置保存后重启应用仍保留

---

### 步骤 4：世界书管理系统

**前置依赖**：步骤 2

**上下文简报**：
- 世界书是小说解析的核心输出（策划案「模块 3：世界书系统」）
- 世界书结构：世界观设定、时代背景、势力/阵营、关键事件、用户创造的新剧情
- 核心创新：世界书会被玩家行为**实时改变**（如角色在某剧情中选择 A → 世界书记录该选择并影响后续）
- 世界书编辑器：可视化编辑各字段
- 世界书解析：对接 NovelParser，生成世界书 JSON → 存入 `user://worldbooks/{id}.json`
- 展示界面：左侧目录树（世界观/势力/事件/用户剧情）、右侧详情面板

**任务列表**：
- [ ] 世界书列表场景 `scenes/worldbook/worldbook_list.tscn`：已有世界书卡片列表
- [ ] 世界书编辑器场景 `scenes/worldbook/worldbook_editor.tscn`：目录树 + 详情编辑面板
- [ ] 解析进度场景 `scenes/worldbook/parsing_progress.tscn`：显示解析进度条、状态日志
- [ ] 世界书数据结构 `scripts/resources/worldbook.gd`：extends Resource，包含所有字段
- [ ] 世界书管理器 `scripts/worldbook/worldbook_manager.gd`：CRUD、JSON 序列化/反序列化
- [ ] NovelParser Autoload `scripts/autoload/novel_parser.gd`：调用 AI 双轮提取流程
- [ ] 势力/事件编辑子面板 `scenes/worldbook/faction_editor.tscn`、`event_editor.tscn`
- [ ] 用户剧情记录面板 `scenes/worldbook/user_drama_panel.tscn`：展示玩家创造的内容

**验证命令**：
```bash
# 手动验证流程：
# 1. 书库中选中一本书 → 点击"生成世界书"
# 2. 等待解析完成（AI 调用）
# 3. 打开世界书编辑器，确认各字段有内容
# 4. 修改某个字段（如添加一条用户剧情）→ 保存 → 重启 → 确认保留
```

**退出标准**：
- 可从书库中的书籍生成世界书（调用 AI）
- 世界书编辑器可增删改查所有字段
- 用户剧情选择实时写入世界书 JSON
- 存档/读取世界书正常

---

### 步骤 5：角色养成系统（前端 UI）

**前置依赖**：步骤 4

**上下文简报**：
- 角色卡是战斗系统的核心输入（策划案「模块 4：角色养成系统」）
- 角色卡展示：卡牌形态，SVG 矢量头像 + 渐变背景 + 等级/星级标识
- 7 维属性可视化：雷达图或条形图（power/speed/intelligence/defense/special_ability/hp/mp）
- 技能列表：技能名、类型、倍率、MP 消耗、描述、原作引用
- 形态系统：角色拥有多个形态（如孙悟空的基础/齐天大圣/斗战胜佛），形态提供属性加成
- 养成进度：等级、经验条、下一级所需经验
- 养成路线：攻击/防御/均衡三条路线，通过剧情选择解锁
- 对应策划案数据结构：第一轮角色卡（文本结构）+ 第二轮可对战卡牌（含数值）

**任务列表**：
- [ ] 角色卡组件 `scenes/character/card_component.tscn`：卡牌外观（渐变背景/头像/SVG装饰/等级标签）
- [ ] 角色详情场景 `scenes/character/character_detail.tscn`：雷达图/条形图 + 技能列表 + 形态切换 + 养成进度
- [ ] 角色列表/图鉴场景 `scenes/character/character_gallery.tscn`：网格展示所有已生成角色
- [ ] 角色生成进度场景 `scenes/character/character_generating.tscn`：显示 AI 生成角色的两轮进度
- [ ] 雷达图控件 `scripts/ui/radar_chart.gd`：7 维属性可视化
- [ ] 养成系统脚本 `scripts/character/growth_system.gd`：等级经验计算、形态解锁逻辑
- [ ] 角色管理器 `scripts/character/character_manager.gd`：角色 CRUD、导入/导出 JSON
- [ ] 角色 Resource 定义 `scripts/resources/character.gd`：extends Resource，完整字段

**验证命令**：
```bash
# 手动验证：
# 1. 从书库打开已解析的小说 → 查看提取出的角色列表
# 2. 点击角色进入详情 → 确认属性/技能/形态显示正确
# 3. 模拟获得经验 → 确认等级提升
# 4. 切换形态 → 确认属性变化
```

**退出标准**：
- 角色卡 UI 展示 14 个预置角色（可直接从 characters-data.js 迁移）
- 属性雷达图正确显示 7 维数值
- 技能列表显示完整（名称/类型/倍率/MP/描述）
- 形态切换实时更新属性
- 等级提升触发属性变化

---

### 步骤 6：战斗推演引擎（核心）

**前置依赖**：步骤 4, 5

**上下文简报**：
- 这是产品的核心引擎（策划案「模块 6：战斗推演引擎」）
- 基于现有 `battle-engine.js` 的逻辑完全重写为 GDScript
- 12 回合自动战斗（最大 12 回合）
- 伤害计算公式（已验证）：
  - `base = 属性 × 1.2 + special_ability × 0.3`
  - `damage = base × skillMult × critMult × defReduction × gradeMult × dimensionMult`
  - 神话 vs 凡人：3.0x 倍率（神话方）
  - 秒杀判定：伤害 > 目标 HP × 60%
- AI 技能选择：基于当前 HP/MP/技能列表智能选择
- Buff/Debuff 系统：attack_up/down、defense_up/down、speed_up/down、crit_up、silence、invincible
- 战斗结果数据结构：完整战斗日志（每回合动作）、胜负判定、战斗回合数

**任务列表**：
- [ ] 战斗引擎核心脚本 `scripts/battle/battle_engine.gd`：
  - `execute_battle(char1, char2, form1, form2) -> BattleResult`
  - `calculate_damage(attacker, defender, skill) -> DamageResult`
  - `select_skill(character, enemy) -> Skill`：AI 技能选择逻辑
  - `apply_buffs(character, buff_type)`
  - `get_dimension_mult(attacker, defender) -> float`
  - `get_grade_mult(attacker, defender) -> float`
- [ ] 战斗数据结构 `scripts/resources/battle_result.gd`、`round_action.gd`、`skill_result.gd`
- [ ] 战斗事件信号系统：便于 UI 订阅回合结束、伤害结算等事件
- [ ] 战斗模拟器测试工具（调试用）：直接传入两个角色，不走 UI 跑完整战斗
- [ ] 战斗平衡性验证：S vs C / S vs S / 神话 vs 凡人 各跑 10 次，验证结果符合预期

**验证命令**：
```gdscript
# 在 Godot 编辑器控制台或测试场景中
var char1 = load("res://resources/characters/sun_wukong.tres")
var char2 = load("res://resources/characters/lin_daiyu.tres")
var result = BattleEngine.execute_battle(char1, char2, 0, 0)
print(result.winner)  # 期望：char1（S vs B，预期 char1 胜率极高）
print(result.total_rounds)
print(result.rounds[0].actions.size())
```

**退出标准**：
- 战斗引擎纯函数可独立运行（无 UI 依赖）
- 伤害计算结果与策划案公式一致
- 次元压制（神话 vs 凡人 3.0x）生效
- 秒杀判定正确触发
- 12 回合上限正确执行
- HP 归零判定胜负

---

### 步骤 7：战斗 UI 与叙事系统

**前置依赖**：步骤 6

**上下文简报**：
- 战斗 UI 是玩家观看战斗的核心界面（策划案「模块 7：叙事解释系统」）
- 左侧：角色 A 信息（头像、名称、HP 条、MP 条、Buff 图标、当前形态）
- 右侧：角色 B 信息（对称布局）
- 中央：战斗叙事区（滚动文字日志 + 回合高亮 + 关键动作放大展示）
- 底部：回合指示器（Round 1/12）、速度条（谁先手）、跳过/加速按钮
- 顶部：战前准备区（形态选择、技能配置、战术倾向选择）
- 叙事生成：战斗中实时生成描述文字，关键回合（暴击/秒杀/关键转折）高亮展示
- 战斗结束后：胜负结算界面 + 战斗总结叙事 + 经验获得

**任务列表**：
- [ ] 战前准备场景 `scenes/battle/pre_battle.tscn`：角色选择 → 形态选择 → 确认出战
- [ ] 战斗主场景 `scenes/battle/battle_scene.tscn`：双角色面板 + 中央叙事区 + 底部控制栏
- [ ] 角色血条组件 `scenes/battle/hp_bar_component.tscn`：HP/MaxHP 显示、受伤动画
- [ ] 技能图标组件 `scenes/battle/skill_icon.tscn`：技能释放时闪烁
- [ ] 叙事文本区 `scenes/battle/narration_panel.tscn`：RichTextLabel 滚动显示战斗叙事
- [ ] 胜负结算场景 `scenes/battle/battle_result.tscn`：winner 展示 + 战斗摘要 + 经验获得
- [ ] 叙事引擎 `scripts/battle/narration_generator.gd`：根据战斗事件生成自然语言描述
- [ ] 战斗控制器 `scripts/battle/battle_controller.gd`：管理战斗流程（回合循环/事件广播）
- [ ] 战斗过渡动画：`scenes/battle/transitions/`（回合切换/伤害特效/秒杀特写）

**验证命令**：
```bash
# 手动验证：
# 1. 选择孙悟空 vs 林黛玉 → 确认战前准备 UI 正常
# 2. 点击"开始战斗" → 确认回合推进、叙事文字滚动
# 3. 确认 HP 条实时减少
# 4. 确认秒杀时触发特殊叙事和特效
# 5. 战斗结束 → 显示胜负结算
```

**退出标准**：
- 战前准备流程完整（选角色 → 选形态 → 确认）
- 战斗回合自动推进（1.5s/回合，可加速）
- 叙事文字实时滚动，关键回合高亮
- HP/MP 条动画正确
- 秒杀触发视觉特效 + 特殊叙事
- 战斗结束后显示结算并发放经验

---

### 步骤 8：存档系统

**前置依赖**：步骤 1

**上下文简报**：
- 存档是持久化所有玩家数据的核心模块
- 多档位支持：至少 10 个存档槽位
- 自动存档：关键操作后自动保存（书库变更、角色生成、战斗结束、剧情选择）
- 存档内容：用户配置、AI 配置、书库元数据、世界书、角色卡、角色养成进度、战斗记录
- 存档管理 UI：存档列表（缩略图/游玩时长/存档时间）→ 读取/保存/删除/重命名
- 存档文件格式：JSON（`user://saves/slot_{n}/save_data.json`）
- 存档版本迁移：存档结构变更时自动迁移

**任务列表**：
- [ ] 存档管理器 Autoload `scripts/autoload/save_manager.gd`：
  - `save(slot_id)`、`load(slot_id)`、`delete(slot_id)`
  - `auto_save()`、`get_save_slots()`、`has_save(slot_id)`
  - 存档结构定义（dict 字段列表）
- [ ] 存档槽位 Resource `scripts/resources/save_slot.gd`：存档元数据（缩略图路径/游玩时长/存档时间/游戏版本）
- [ ] 存档列表场景 `scenes/save/load_screen.tscn`：槽位网格 + 读取/保存按钮
- [ ] 存档管理场景 `scenes/save/save_management.tscn`：新建/覆盖确认对话框
- [ ] 自动存档触发器 `scripts/save/auto_save_trigger.gd`：监听关键信号自动存档
- [ ] 存档迁移脚本 `scripts/save/save_migration.gd`：版本不兼容时迁移数据
- [ ] 存档导出/导入功能：压缩包（ZIP）导出存档，方便备份

**验证命令**：
```bash
# 手动验证：
# 1. 新游戏 → 存档槽位1
# 2. 玩一段时间（导入书、生成角色、战斗）
# 3. 关闭游戏 → 重开 → 从存档槽位1读取 → 确认所有进度保留
# 4. 测试自动存档：战斗中关闭 → 重开 → 战斗结果已记录
```

**退出标准**：
- 至少支持 10 个存档槽位
- 可保存/读取/删除存档
- 自动存档在关键节点触发
- 存档包含所有必要数据（书库/世界书/角色/养成/战斗记录）
- 存档版本变更时平滑迁移

---

### 步骤 9：导出与分享功能

**前置依赖**：步骤 6, 7

**上下文简报**：
- 导出分享是产品传播的核心功能（策划案「模块 7：叙事解释系统」的输出端）
- 战报分享图：生成可分享的静态图片（1080x1920），包含对战双方角色卡、胜负结果、关键回合叙事摘要
- 角色卡导出：导出单角色 JSON（含完整数据），便于社区分享或导入
- 世界书导出：导出世界书 JSON，供其他用户使用
- 分享到剪贴板：战报图片一键复制到剪贴板
- 保存到本地：战报/角色/世界书保存为文件

**任务列表**：
- [ ] 战报分享图生成器 `scripts/export/battle_report_generator.gd`：
  - 使用 Godot 的 Image 生成静态图片
  - 布局：顶部标题 → 双方角色卡并列 → 胜负结果 → 关键回合摘要 → 底部水印
- [ ] 分享按钮 UI `scenes/export/share_buttons.tscn`：复制到剪贴板/保存文件/分享菜单
- [ ] 角色卡导出 `scripts/export/character_exporter.gd`：导出 JSON、生成预览图
- [ ] 世界书导出 `scripts/export/worldbook_exporter.gd`：导出 JSON
- [ ] 导出设置界面 `scenes/export/export_dialog.tscn`：选择导出内容、格式、质量
- [ ] 分享平台支持（可选）：截图 + 系统分享对话框（Windows Share UI）

**验证命令**：
```bash
# 手动验证：
# 1. 完成一场战斗 → 点击"分享战报"
# 2. 选择"复制到剪贴板" → 粘贴到画图/微信 → 确认为完整战报图
# 3. 点击"导出角色" → 选择孙悟空 → 确认为有效 JSON
```

**退出标准**：
- 战报图片生成完整（角色信息 + 战斗结果 + 叙事摘要）
- 复制到剪贴板功能正常
- 角色/世界书 JSON 导出可被正确导入

---

### 步骤 10：开源部署与打包配置

**前置依赖**：步骤 1~9（全部完成）

**上下文简报**：
- 开源部署是策划案明确的产品定位（决策 9：可部署产品）
- 导出为 Windows .exe 可执行文件
- 导出配置：Windows Desktop（x86_64）、压缩包或单文件模式
- 导出预设：debug / release 两个 preset
- Godot 项目导出配置（export_presets.cfg）
- README.md 更新：Windows 安装/运行说明、常见问题、贡献指南
- 可选：Godot Asset Library 打包

**任务列表**：
- [ ] 配置 `export_presets.cfg`：Windows x86_64 /_debug /release 预设
- [ ] 设置应用图标 `assets/icon.png`、`assets/icon.ico`
- [ ] 配置 `project.godot` 中的应用元数据（name/version/description）
- [ ] 更新 `README.md`：Windows 安装指南、快速开始、AI 配置说明、常见问题
- [ ] 创建 `CONTRIBUTING.md`：代码规范、提 PR 流程、测试要求
- [ ] 打包测试：在干净 Windows 环境（无 Godot）运行导出的 .exe，确认正常启动
- [ ] 可选：GitHub Actions 自动构建 + Release 发布

**验证命令**：
```bash
# 在有 Godot 4 的环境
cd e:/万卷浮生/万卷浮生_Godot
godot --headless --export-release "Windows Desktop" ../releases/wanjuan_fusheng.exe

# 验证输出
ls -lh ../releases/wanjuan_fusheng.exe
```

**退出标准**：
- .exe 可正常导出
- 在干净 Windows 环境运行无报错
- README 包含完整安装和运行说明

---

### 步骤 11：UI 美化与响应式适配

**前置依赖**：步骤 2~9

**上下文简报**：
- 提升整体 UI 品质，达到专业级用户体验标准（策划案 UI/UX 规范）
- 古风主题深化：参考 Web 版的 paper/parchment 纹理、墨迹边框、印章元素
- 玻璃态效果：毛玻璃背景（Godot 的 `BackBufferCopy` 或 Shader 实现）
- 动态背景：云雾/水波/书页翻动等微妙动效（使用 Godot Tween）
- 交互反馈：按钮 hover/press 动画、页面切换过渡
- 字体选择：标题使用书法风格字体（Noto Serif SC / Source Han Serif CN）
- 响应式适配：最小分辨率 1280x720，支持 1920x1080 / 2560x1440 等主流桌面分辨率

**任务列表**：
- [ ] 主 UI 主题文件 `themes/main_theme.tres`：统一所有控件样式（按钮/输入框/滑动条/复选框）
- [ ] 古风装饰纹理：`assets/textures/paper.png`、`assets/textures/ink_border.png`、`assets/textures/stamp.png`
- [ ] 毛玻璃 Shader `shaders/frosted_glass.gdshader`：用于面板背景
- [ ] 背景动画系统 `scripts/ui/background_manager.gd`：多套背景动画（云雾/书卷/星空）
- [ ] 页面过渡动画 `scenes/ui/transitions/page_transition.tscn`：fade / slide / scale
- [ ] 全局按钮样式覆盖：hover/pressed/disabled 状态动画
- [ ] 字体资源配置 `assets/fonts/`：Noto Serif SC（正文）/ Ma Shan Zheng（书法标题）
- [ ] 响应式布局测试：在 1280x720 / 1920x1080 / 2560x1440 下测试所有主要场景

**验证命令**：
```bash
# 在 Godot 编辑器中
# 1. 打开每个主要场景
# 2. 切换不同分辨率（项目设置 → Display → Window → Test Width/Height）
# 3. 确认无元素溢出、无严重布局错乱
# 4. 启动游戏 → 确认古风主题正常渲染 → 确认动画流畅
```

**退出标准**：
- 古风主题统一应用于所有场景
- 毛玻璃/动效正常运行（60fps）
- 交互反馈动画存在且流畅
- 1280x720 最小分辨率下无严重布局问题

---

### 步骤 12：集成测试与最终打包

**前置依赖**：步骤 1~11（全部完成）

**上下文简报**：
- 完整集成测试，验证所有模块协同工作
- 端到端测试用例：导入书 → 解析世界书 → 生成角色 → 养成 → 战斗 → 战报分享 → 存档
- 冒烟测试：核心功能（导入书、战斗、存档）必须通过
- 性能测试：大量角色加载、长时间战斗存档
- 最终 .exe 打包与发布

**任务列表**：
- [ ] 编写集成测试用例 `tests/integration/`：
  - `test_book_import.gd`：导入书 → 验证书库出现
  - `test_worldbook_generation.gd`：书 → 世界书 → 验证字段非空
  - `test_character_generation.gd`：书 → 角色卡 → 验证属性非空
  - `test_battle_flow.gd`：两角色 → 战斗 → 验证结果
  - `test_save_load.gd`：存档 → 读取 → 验证数据一致
- [ ] 运行冒烟测试（手动或 Godot 内置测试框架）
- [ ] 性能基准测试：加载 100 个角色 / 存档 50MB / 战斗 12 回合
- [ ] 最终导出 .exe：`releases/wanjuan_fusheng_v1.0_windows_x86_64.exe`
- [ ] 生成发布说明 `CHANGELOG.md`：`releases/CHANGELOG_v1.0.md`

**验证命令**：
```bash
# 端到端手动测试清单（见技术文档第 21 章 21.3）
# 1. 注册/登录 (跳过，桌面版无账号系统，本地存储)
# 2. 导入 txt 小说 → 生成世界书 → 生成角色
# 3. 角色详情 → 属性展示 → 形态切换
# 4. 战斗准备 → 战斗 → 结算 → 经验发放
# 5. 存档 → 退出 → 重开 → 读取 → 进度保留
# 6. 战报分享 → 图片生成 → 复制成功

# 最终打包
cd e:/万卷浮生/万卷浮生_Godot
godot --headless --export-release "Windows Desktop" ../releases/wanjuan_fusheng_v1.0.exe
ls -lh ../releases/wanjuan_fusheng_v1.0.exe
```

**退出标准**：
- 所有集成测试用例通过
- .exe 可正常导出且在干净环境运行
- README 包含完整使用说明

---

## 🔀 并行分析

以下步骤可安全并行执行（无共享文件/输出依赖）：

| 并行组 | 步骤 | 理由 |
|--------|------|------|
| **并行组 A** | 步骤 2 + 步骤 3 | 步骤 2 做书库，步骤 3 做 AI 配置，无交集 |
| **并行组 B** | 步骤 8 可与 2/3/4 并行 | 存档系统是独立模块，只依赖 Autoload（步骤 1 已建立） |
| **强串行** | 步骤 4 → 步骤 5 → 步骤 6 → 步骤 7 | 世界书→角色卡→战斗引擎→战斗UI，层层依赖 |

**推荐并行策略**：
- 第一轮：步骤 1（必须先完成）+ 步骤 2 + 步骤 3 + 步骤 8（并行）
- 第二轮：步骤 4（依赖步骤 2）
- 第三轮：步骤 5（依赖步骤 4）
- 第四轮：步骤 6（依赖步骤 4, 5）+ 步骤 9（依赖步骤 6, 7，但 7 还未完成，可先做导出逻辑）
- 第五轮：步骤 7（依赖步骤 6）
- 第六轮：步骤 10 + 步骤 11 + 步骤 12

---

## 📁 输出目录结构

```
e:\万卷浮生\
├── 万卷浮生_Godot\                    # Godot 项目
│   ├── project.godot
│   ├── export_presets.cfg
│   ├── scenes\                         # 场景
│   │   ├── library\                   # 书库相关场景
│   │   ├── worldbook\                 # 世界书相关场景
│   │   ├── character\                 # 角色相关场景
│   │   ├── battle\                    # 战斗相关场景
│   │   ├── save\                      # 存档相关场景
│   │   ├── export\                    # 导出相关场景
│   │   ├── settings\                  # 设置相关场景
│   │   └── ui\                        # 通用 UI 组件
│   ├── scripts\                        # GDScript 脚本
│   │   ├── autoload\                  # Autoload 节点
│   │   ├── resources\                 # Resource 资源定义
│   │   ├── library\                   # 书库系统
│   │   ├── worldbook\                 # 世界书系统
│   │   ├── character\                 # 角色系统
│   │   ├── battle\                    # 战斗系统
│   │   ├── save\                      # 存档系统
│   │   ├── export\                    # 导出系统
│   │   ├── ai\                        # AI 服务
│   │   └── ui\                        # UI 工具
│   ├── assets\                         # 美术资源
│   │   ├── textures\                  # 纹理
│   │   ├── fonts\                     # 字体
│   │   └── images\                    # 图片
│   ├── themes\                        # 主题文件
│   ├── shaders\                       # Shader 效果
│   ├── tests\                          # 测试脚本
│   └── README.md
├── releases\                           # 导出产物
│   └── wanjuan_fusheng_v1.0_windows_x86_64.exe
├── 万卷浮生_完整策划案_v3.md           # 已存在
├── 万卷浮生_技术文档.md                # 已存在
└── 万卷浮生_Web应用\                    # 已存在（参考）
```

---

## 🎯 核心原则

1. **纯函数战斗引擎**：战斗逻辑与 UI 完全解耦，引擎可独立测试
2. **Resource 系统**：所有游戏数据（角色/世界书/存档）使用 Godot Resource，确保类型安全和序列化
3. **Autoload 分层**：全局状态、AI、存档管理器作为 Autoload，避免跨场景传参
4. **数据先行**：先定义 Resource 类（GDScript `class_name`），再实现 UI 和逻辑
5. **无破坏重构**：不保留原有 Web 实现，从零构建 Godot 版，但数据结构和游戏逻辑保持一致

---

## ⚠️ 反模式清单

- ❌ 在 `_process()` 中做耗时计算（UI 卡顿）
- ❌ 硬编码数值（使用 Resource 或配置文件）
- ❌ 跨场景直接访问子节点（用信号/分组）
- ❌ 把战斗引擎写在场景里（必须是独立脚本）
- ❌ 忽视 Godot 4 的 2D 渲染管线（使用 3D 节点做 2D UI）
- ❌ 忽略 `project.godot` 中的 locale 设置（中文支持）
- ❌ 存档写入失败时不处理（用户数据可能丢失）
