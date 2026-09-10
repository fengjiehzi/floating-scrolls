# 参与《万卷浮生》开发

本仓库只维护 Godot 4.7.2 + GDScript 的离线游戏。提交应聚焦一个明确问题，不引入 Web 运行时、服务器、账号、云存档、动态内容生成或联网权限。

## 开发环境

- Godot 4.7.2 与对应导出模板；
- Windows 导出不需要额外工具链；
- Android 导出使用 OpenJDK 17、Android SDK 35 工具链与 Godot 官方要求的 NDK/CMake；
- 项目必须使用 Compatibility renderer 并保持横屏。

## 内容模型

运行时内容只通过以下 Godot 自定义 `Resource` 表达：

- `BookDefinition`
- `CharacterDefinition`
- `ItemDefinition`
- `StoryGraph`
- `BattleDefinition`

所有引用使用稳定英文 ID。新增或修改内容时必须保证：

- ID 不重复；
- 剧情节点可从起点到达；
- 图片路径存在；
- 人物、法宝、剧情与战斗不跨书卷错误引用；
- 未完成战斗数据的人物只能作为未解锁图鉴资料。

## 改动原则

- 只修改当前任务需要的文件，不顺手重构相邻模块。
- 不为单次需求增加抽象层或配置系统。
- 场景通过信号与 `ContentRegistry`、`GameState`、`SaveService` 交互，不新增全局服务。
- UI 使用 `Control`，触控目标不小于 `48×48`，不能依赖悬停才能操作。
- 新素材必须放入 `assets/art/`，使用稳定英文文件名，并更新 `manifest.sha256`。

## 提交前验证

```powershell
godot --headless --path . tests/test_runner.tscn
godot --headless --path . --export-release "Windows Desktop"
godot --headless --path . --export-debug "Android Debug"
```

UI 改动还需检查 `1280×720`、`1920×1080` 和 `2400×1080` 横屏，确认安全区、返回键、触控和文字没有裁切。

Android APK 必须确认：

- 包名为 `com.fengjiehzi.wanjuanfusheng`；
- 版本名为 `0.2.0-godot-alpha`；
- 横屏启动；
- 不申请 `INTERNET` 权限；
- 断网状态可以从藏经阁完成任一结局。

## Pull Request

PR 请包含改动目的、实际测试命令与结果；涉及 UI 时附横屏截图。不要提交 `.godot/`、`.tools/`、`builds/`、本地存档、导出签名或来源不明的素材。
