# 万卷浮生 · Floating Scrolls

[![CI](https://github.com/fengjiehzi/floating-scrolls/actions/workflows/ci.yml/badge.svg)](https://github.com/fengjiehzi/floating-scrolls/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**An AI-native interactive fiction and multiplayer game where characters from classic literature come alive through LLM-powered narratives and real-time battles.**

万卷浮生是一款以古典文学为内容底座的互动叙事与跨作品对战 Web 游戏。它把小说文本、人物设定、分支剧情和战斗状态组织成可交互的游戏体验，让不同典籍中的角色在同一故事与竞技场中相遇。

> 当前版本定位为公开预览（Preview / Alpha），并非生产稳定版。

## ✨ Features

- **AI 互动叙事**：根据典籍内容生成角色、章节与选择分支；使用前需配置对应模型凭据。
- **角色与法宝系统**：仓库内置 23 名角色和 31 件法宝的数据、属性与美术资源。
- **实时多人对战原型**：Express HTTP 服务与 `ws` WebSocket 服务共享端口，支持匹配、机器人与战绩流程。
- **本地持久化**：使用 SQLite 保存用户、角色、剧情进度和对战数据，无需 Redis。
- **多模型接入**：包含 OpenAI、Anthropic、DeepSeek、通义千问等 OpenAI-compatible / native provider 配置。
- **双前端演进**：完整原生 JavaScript 客户端可运行；React 19 + Vite + TypeScript 客户端正在逐步迁移。

## 🎮 How It Works

```text
Classic Literature
        ↓
Character & World Extraction
        ↓
LLM-powered Interactive Narrative
        ↓
Structured Game State (SQLite)
        ↓
Real-time Multiplayer Battles (WebSocket)
```

## 🏗 Architecture

| 模块 | 技术与状态 |
| --- | --- |
| `万卷浮生_Web应用/` | 可直接运行的完整应用：Node.js、Express 4、SQLite、JWT、WebSocket、原生 HTML/CSS/JS |
| `frontend/` | React 19、Vite 6、TypeScript、Zustand、Tailwind CSS 4；部分体验仍使用本地演示数据 |
| `docs/` | 架构决策、产品规划、设计资料和部署说明 |

完整应用采用同源部署：Express 同时提供页面、REST API 与 WebSocket。GitHub Pages 只能托管静态文件，无法承载本项目的服务器、SQLite 与长连接，因此不适合作为完整 Live Demo。

## 🚀 Quick Start

### 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本
- 不需要 Redis 或外部数据库；SQLite 数据库会在本地自动创建
- 模型 API Key 仅在使用对应 AI 功能时需要

### 运行完整应用

```bash
cd 万卷浮生_Web应用
npm ci
cp .env.example .env
npm start
```

Windows PowerShell 可使用 `Copy-Item .env.example .env`。修改 `.env` 中的 `JWT_SECRET` 后，访问 <http://localhost:8888>。

### 运行 React 迁移版

保持完整应用运行，再打开另一个终端：

```bash
cd frontend
npm ci
npm run dev
```

Vite 会将 `/api` 代理到 `http://127.0.0.1:8888`。也可通过 `frontend/.env` 中的 `VITE_API_BASE_URL` 指向独立 API 地址。

## 🔑 Environment Variables

服务端完整示例见 [`万卷浮生_Web应用/.env.example`](万卷浮生_Web应用/.env.example)，React 示例见 [`frontend/.env.example`](frontend/.env.example)。

| 变量 | 用途 | 是否必需 |
| --- | --- | --- |
| `JWT_SECRET` | JWT 签名密钥 | 生产环境必需 |
| `HOST`, `PORT` | HTTP / WebSocket 监听地址与端口 | 可选 |
| `DB_PATH` | SQLite 文件路径 | 可选 |
| `CORS_ORIGIN` | 分离部署时允许的前端 Origin，逗号分隔 | 可选 |
| `AI_PROVIDER`, `AI_MODEL` | 默认模型服务商与模型 | 可选 |
| `*_API_KEY` | 所选模型服务商的凭据 | 对应 AI 功能必需 |
| `VITE_API_BASE_URL` | React 客户端的 REST API 基址 | 分离部署时必需 |

不要把真实凭据提交到 Git。生产密钥应由部署平台的 Secret / Environment Variables 功能注入。

## 🌐 Live Demo

Live demo deployment is being prepared.

当前推荐使用 Render 将完整 Node 应用部署为单一 Web Service，并为 SQLite 挂载持久磁盘。配置与逐步说明见 [Deployment Guide](docs/DEPLOYMENT.md)。

## 🗺 Roadmap

- [x] AI 驱动的互动剧情 API
- [x] 角色与法宝系统
- [x] WebSocket 实时多人对战原型
- [x] React/Vite 界面迁移原型
- [x] 基础 CI（安装、语法检查、lint、build、smoke test）
- [ ] 扩充公版典籍与可溯源数据集
- [ ] 完善战斗数值平衡
- [ ] 增加自动化叙事质量评估
- [ ] 支持社区角色包与内容贡献
- [ ] 建立更完整的单元测试和端到端测试

## 🤝 Contributing

欢迎提交 Bug、功能建议、新典籍/角色支持、模型集成、数值平衡与多人对战改进。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📚 Documentation

- [完整应用使用说明](万卷浮生_Web应用/使用说明.md)
- [技术文档](docs/technical/万卷浮生_技术文档.md)
- [架构决策记录](docs/adr/)
- [部署指南](docs/DEPLOYMENT.md)
- [版本历史](CHANGELOG.md)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

> 愿万卷浮生，与你共赴一场跨越千年的文字奇旅。
