# 万卷浮生 - AI 角色卡对战游戏

## 项目简介

「万卷浮生」是一款基于古典名著角色的 AI 卡牌对战游戏。玩家可以从四大名著及古典神话中选择角色，通过策略对战与其他玩家一决高下。

### 核心特色

- 🎭 **25+ 角色**：涵盖西游记、三国演义、水浒传、红楼梦、封神演义等经典名著角色
- 🎒 **31 件法宝**：金箍棒、青龙偃月刀、芭蕉扇等传奇道具
- ⚔️ **实时对战**：WebSocket 实时通信，支持双人 PVP 对战
- 📊 **战绩系统**：完整的战绩记录与排行榜
- 🎨 **精美卡牌**：精心设计的角色卡与道具卡图片

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

```bash
# 进入项目目录
cd 万卷浮生_Web应用

# 安装依赖
npm install

# 启动服务器
npm start
# 或 node server.js
```

### 访问应用

打开浏览器访问：`http://localhost:3000`

### 游戏流程

1. **注册账号** → 创建玩家角色
2. **登录游戏** → 进入主界面
3. **角色选择** → 从角色库中选择出战角色
4. **在线匹配** → 等待对手或邀请好友
5. **开始对战** → 策略对战，击败对手
6. **查看战绩** → 查看对战记录与排行榜

## 功能模块

### 1. 用户系统

- **注册**：创建新账号，密码使用 bcrypt 加密存储
- **登录**：账号密码登录，返回 JWT 令牌
- **个人信息**：查看/修改个人资料
- **战绩统计**：查看对战记录与胜率

### 2. 角色系统

#### 角色列表

| 出处 | 角色 |
|------|------|
| 西游记 | 孙悟空、唐僧、猪八戒 |
| 三国演义 | 关羽、刘备、曹操、诸葛亮 |
| 水浒传 | 武松、林冲、宋江、鲁智深 |
| 红楼梦 | 林黛玉、贾宝玉、薛宝钗 |
| 封神演义 | 姜子牙、哪吒、妲己 |
| 神话传说 | 二郎神、白素贞、后羿、项羽、貂蝉 |

#### 角色属性

- **生命值**：角色基础血量
- **攻击力**：角色基础攻击伤害
- **防御力**：减少受到的伤害
- **速度**：决定出手顺序
- **技能**：每个角色拥有独特技能

### 3. 法宝系统

#### 道具分类

| 类型 | 说明 |
|------|------|
| 兵器 | 增加攻击力，如金箍棒、青龙偃月刀 |
| 法宝 | 提供特殊效果，如芭蕉扇、乾坤圈 |
| 消耗品 | 一次性使用，恢复生命或增强属性 |

#### 稀有度

- ⭐⭐⭐⭐⭐ **传说**：最强道具，稀有度最高
- ⭐⭐⭐⭐ **史诗**：强力道具，属性优秀
- ⭐⭐⭐ **稀有**：较好道具，实用价值高
- ⭐⭐ **普通**：基础道具，易于获取

### 4. 战斗系统

#### 战斗规则

- **回合制**：双方轮流行动
- **行动选择**：攻击、防御、使用技能、使用道具
- **胜负判定**：一方生命值归零则判负

#### 技能系统

每个角色拥有独特技能，技能有冷却回合限制：

- **主动技能**：造成额外伤害或特殊效果
- **被动技能**：战斗中持续生效

### 5. 匹配系统

- **快速匹配**：自动匹配在线玩家
- **好友对战**：邀请指定好友对战
- **机器人对战**：与 AI 机器人练习

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/me` | 获取当前用户信息 |

### 角色接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/characters` | 获取全部角色列表 |
| GET | `/api/characters/:id` | 获取角色详情 |
| POST | `/api/me/characters` | 选择角色 |

### 道具接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/items` | 获取全部道具列表 |
| GET | `/api/items/:id` | 获取道具详情 |
| GET | `/api/me/items` | 获取我的道具 |
| POST | `/api/me/items` | 添加道具 |
| PUT | `/api/me/items/:id/equip` | 装备/卸下道具 |

### 对战接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/battles` | 获取对战记录 |
| GET | `/api/leaderboard` | 获取排行榜 |

## 技术架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 实时通信 | WebSocket (ws) |
| 认证 | JWT + bcrypt |
| 前端 | 原生 HTML/JavaScript |
| 样式 | Tailwind CSS + 自定义 CSS |

### 项目结构

```
万卷浮生_Web应用/
├── server.js                 # Express 服务器入口
├── db.js                     # 数据库初始化与操作
├── auth.js                   # JWT 认证中间件
├── battle-engine.js          # 战斗引擎核心逻辑
├── ws-server.js              # WebSocket 对战服务器
├── characters-data.js        # 角色数据（25+ 角色）
├── items-data.js             # 道具数据（31 件法宝）
├── package.json              # 项目依赖配置
├── .env.example              # 环境变量示例
└── public/                   # 前端静态资源
    ├── index.html            # 单页应用主页面
    ├── css/
    │   ├── style.css         # 主样式文件
    │   ├── themes.css        # 主题样式
    │   ├── animations.css    # 动画效果
    │   └── game-toast.css    # 游戏提示
    ├── js/
    │   ├── app.js            # 主应用逻辑
    │   ├── auth.js           # 登录注册逻辑
    │   ├── lobby.js          # 大厅逻辑
    │   ├── battle.js         # 对战逻辑
    │   ├── characters.js     # 角色库渲染
    │   ├── items.js          # 道具系统渲染
    │   └── game-toast.js     # 提示组件
    └── images/
        ├── arena/characters/ # 竞技场角色卡
        ├── classics/         # 名著角色卡与道具卡
        │   ├── characters/   # 角色图片
        │   ├── items/        # 道具图片
        │   └── card-sheets/  # 卡面背景
        └── items/            # 旧版道具图标
```

### 数据库结构

```sql
-- 用户表
users (id, username, password_hash, avatar, created_at)

-- 角色表
characters (id, name, source, rarity, type, image, description, stats_json, skills_json)

-- 道具表
items (id, name, source, rarity, type, image, description, stats_bonus_json, skill_bonus, source_basis)

-- 用户角色关联表
user_characters (user_id, character_id, selected_at)

-- 用户道具关联表
user_items (user_id, item_id, equipped, obtained_at)

-- 对战记录表
battles (id, player1_id, player2_id, winner_id, rounds, created_at)
```

## 开发指南

### 环境变量

复制 `.env.example` 为 `.env`，配置如下：

```env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### 添加新角色

1. 在 `characters-data.js` 中添加角色数据
2. 将角色图片放入 `public/images/classics/characters/` 目录
3. 重启服务器，数据库自动初始化新角色

### 添加新道具

1. 在 `items-data.js` 中添加道具数据
2. 将道具图片放入 `public/images/classics/items/` 目录
3. 重启服务器，数据库自动初始化新道具

## 验证清单

- [x] npm install 能成功安装依赖
- [x] node server.js 能启动服务器，监听 3000 端口
- [x] 数据库文件 data.db 自动创建，表结构正确
- [x] 25 个角色自动初始化到 characters 表
- [x] 31 件道具自动初始化到 items 表
- [x] 注册/登录 API 正常工作，返回 JWT
- [x] 受保护路由无 token 时返回 401
- [x] WebSocket 连接需有效 token
- [x] 两个浏览器窗口注册两个账号，都能进入大厅看到对方在线
- [x] 双方选择角色后匹配成功，能开始对战
- [x] 战斗回合实时推送给双方
- [x] 战斗结束后战绩保存到数据库
- [x] 角色卡与道具卡正常显示
- [x] 响应式布局正常

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
