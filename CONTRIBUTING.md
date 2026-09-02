# Contributing to Floating Scrolls

感谢你参与 Floating Scrolls / 万卷浮生。项目希望把经典文学转化为可验证、可扩展的 AI-native interactive fiction 与 multiplayer game：LLM 负责角色和叙事生成，结构化状态负责可持续的游戏流程，WebSocket 负责跨作品实时互动。

## 项目结构

- `万卷浮生_Web应用/`：当前可完整运行的 Express + SQLite + WebSocket 应用及原生前端。
- `frontend/`：React + Vite + TypeScript 迁移版；并非所有完整应用功能都已迁移。
- `docs/`：策划、设计、技术文档与 ADR。

请让改动聚焦在一个明确问题上。大规模重构、替换技术栈或改变核心玩法前，请先创建 Issue 讨论。

## 开发环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0（仓库提交 `package-lock.json`，请使用 npm）
- SQLite 由 `better-sqlite3` 在本地自动创建，不需要单独安装数据库服务
- 不需要 Redis
- 使用 AI 功能时才需要相应模型服务商的 API Key
- 开发 React 客户端时需要同时启动后端和 Vite 两个进程；完整原生客户端只需一个 Node 进程

## 本地开发

完整应用：

```bash
cd 万卷浮生_Web应用
npm ci
cp .env.example .env
npm run dev
```

将 `.env` 中的 `JWT_SECRET` 替换为本地随机值，然后访问 <http://localhost:8888>。Windows PowerShell 可用 `Copy-Item .env.example .env`。

React 迁移版：

```bash
cd frontend
npm ci
npm run dev
```

默认 Vite 开发代理会把 `/api` 转发到 `http://127.0.0.1:8888`。

## Environment Variables

复制示例文件，不要修改或提交真实密钥：

- 服务端：`万卷浮生_Web应用/.env.example`
- React 客户端：`frontend/.env.example`

服务端实际读取以下变量：

| 变量 | 说明 |
| --- | --- |
| `JWT_SECRET` | JWT 签名；生产环境必须设置 |
| `HOST`, `PORT` | 服务监听地址与端口 |
| `DB_PATH` | SQLite 文件路径 |
| `CORS_ORIGIN` | 允许跨域的前端 Origin，可用逗号分隔多个值 |
| `AI_PROVIDER`, `AI_MODEL` | 默认模型服务商与模型 |
| `DEEPSEEK_API_KEY`, `ZHIPU_API_KEY`, `KIMI_API_KEY`, `QWEN_API_KEY` | 对应模型服务商凭据 |
| `MINIMAX_API_KEY`, `DOUBAO_API_KEY`, `STEPFUN_API_KEY`, `SILICONFLOW_API_KEY` | 对应模型服务商凭据 |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `MIMO_API_KEY` | 对应模型服务商凭据 |
| `BAIDU_API_KEY`, `TENCENT_API_KEY`, `OLLAMA_API_KEY` | 对应模型服务商凭据；本地 Ollama 通常无需 Key |
| `VITE_API_BASE_URL` | React 客户端独立部署时的 API 基址 |

不要在 Issue、日志、截图、测试数据或 PR 描述中粘贴真实 Secret。若凭据曾进入 Git 历史，请先在服务商处轮换。

## Branch / Commit

建议从最新 `main` 创建短生命周期分支：

- `feat/*`：新功能
- `fix/*`：缺陷修复
- `docs/*`：文档
- `chore/*`：维护与工具链

Commit 推荐使用 Conventional Commits：`feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`、`ci:`。

## Code Style

- `frontend/` 使用 TypeScript 与 ESLint，提交前运行 `npm run lint` 和 `npm run build`。
- 服务端当前使用 CommonJS、4 空格缩进和分号；请匹配现有风格。
- 不做与当前 Issue 无关的格式化或重构。
- UI 改动应同时检查桌面与移动视口，并尊重现有 `frontend/design.md` 设计系统。

## Testing

当前尚无完整自动化单元测试套件。每次贡献至少应运行：

```bash
cd frontend
npm run lint
npm run build
```

服务端改动还应运行 `node --check` 检查相关 JavaScript 文件，并启动 `npm start` 验证首页、相关 API 和 WebSocket 初始化。请在 PR 中准确记录已执行命令和结果；欢迎贡献服务端单元测试、WebSocket 集成测试与浏览器端到端测试。

## Pull Requests

PR 请至少包含：

- 改动目的与范围；
- 关联 Issue（如有）；
- 实际测试命令与结果；
- UI 改动的桌面和移动端截图；
- 已确认没有提交密钥、Cookie、私有数据或未授权素材；
- 已确认改动聚焦，不夹带无关重构。

## Issues

欢迎创建：

- Bug report；
- Feature request；
- 新的公版小说或角色支持；
- AI model integration；
- Battle balance issue；
- Multiplayer / WebSocket issue。

报告问题时请提供复现步骤、预期行为、实际行为、运行环境和必要日志，并移除所有敏感信息。

## AI-generated Contributions

允许使用 AI 辅助开发，但贡献者必须理解并对提交内容负责。请自行验证代码，不要提交未经检查的大量生成代码，也不要提交来源不明、未经授权的数据、文本或美术素材。

## License

向本项目提交贡献，即表示你同意按项目的 [MIT License](LICENSE) 授权该贡献。
