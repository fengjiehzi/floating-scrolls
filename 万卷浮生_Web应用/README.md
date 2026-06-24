# 万卷浮生 Web应用

## 启动方式

1. 安装依赖
   ```bash
   cd 万卷浮生_Web应用
   npm install
   ```

2. 启动服务器
   ```bash
   npm start
   # 或 node server.js
   ```

3. 打开浏览器访问
   ```
   http://localhost:3000
   ```

4. 注册账号 → 登录 → 选择角色 → 在线匹配对战

## 功能
- 玩家账号系统（注册/登录/JWT鉴权）
- 14个预置角色（公版小说）
- 在线PVP匹配对战（WebSocket实时通信）
- 战绩记录与排行榜
- 角色库管理
- 上传小说模拟AI提取

## 技术栈
- Node.js + Express + better-sqlite3
- WebSocket (ws) 实时对战
- JWT鉴权 + bcrypt密码加密
- 原生HTML/JS + Tailwind CSS

## 项目结构
```
万卷浮生_Web应用/
├── package.json              # 依赖与启动脚本
├── server.js                 # Express服务器入口
├── db.js                     # 数据库初始化与Schema
├── auth.js                   # 注册/登录/JWT中间件
├── battle-engine.js          # 战斗引擎
├── characters-data.js        # 角色数据（14个角色）
├── ws-server.js              # WebSocket对战服务器
├── .env.example              # 环境变量示例
├── README.md                 # 启动说明
└── public/                   # 前端静态资源
    ├── index.html            # 单页应用主页面
    ├── css/
    │   └── style.css         # 玻璃拟态样式
    └── js/
        ├── app.js            # 主应用逻辑
        ├── auth.js           # 登录注册逻辑
        ├── lobby.js          # 大厅逻辑
        ├── battle.js         # 对战逻辑
        └── characters.js     # 角色库渲染
```

## 验证清单
- [x] npm install 能成功安装依赖
- [x] node server.js 能启动服务器，监听3000端口
- [x] 数据库文件 data.db 自动创建，表结构正确
- [x] 14个角色自动初始化到characters表
- [x] 注册/登录API正常工作，返回JWT
- [x] 受保护路由无token时返回401
- [x] WebSocket连接需有效token
- [x] 两个浏览器窗口注册两个账号，都能进入大厅看到对方在线
- [x] 双方选择角色后匹配成功，能开始对战
- [x] 战斗回合实时推送给双方
- [x] 战斗结束后战绩保存到数据库
- [x] 前端玻璃拟态风格与demo一致
- [x] 响应式布局正常
