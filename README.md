# 万卷浮生

《万卷浮生》是一款使用 Godot 4.7.2 与 GDScript 制作的 2D 横屏离线游戏。游戏以中国古典文学为内容底座，所有剧情、角色、法宝、战斗和存档都随安装包保存在本地。

当前版本为 `0.2.0-godot-alpha`，面向 Windows 10/11 与 Android。首期完整开放《西游记》约 30 分钟纵切，其余七卷展示书卷、人物与法宝资料。

## 首期内容

- 2.5D 藏经阁：山景、廊柱、灯笼与透视地台分层构图，立体书卷支持点击/触控选卷、选中抬升与轻微视差。
- 八卷藏经阁：《西游记》《三国演义》《封神演义》《红楼梦》《水浒传》《白蛇传》《史记》《聊斋志异》。
- 《西游记》12 个剧情节点、3 场 1v1 主动回合制战斗、2 个路线结局。
- 玩家固定控制孙悟空；选择只改变属性、技能组合和战斗条件，不改变原著关键事件。
- 普通攻击、最多 3 个技能、防御和每场一次的法宝行动；技能消耗 MP 并冷却 3 回合，战斗最多 12 回合。
- 本地图鉴、单档自动存储、卷内重开、全部进度清除和音量/显示设置。
- 结局图鉴：从藏经阁或通关页回看已见结局；未解锁剧情隐藏，重开本卷后保留收藏。

## 工程结构

```text
project.godot                 Godot 工程入口
scenes/                       主场景与测试场景
scenes/library/               藏经阁与立体书卷子场景
scripts/autoload/             ContentRegistry、GameState、SaveService
scripts/resources/            自定义 Resource 数据模型
scripts/battle/               本地回合制战斗引擎
scripts/data/                 八卷静态内容
scripts/ui/                   Control 界面
assets/art/                   迁移后的书卷、人物、法宝与背景素材
tests/                        无插件 headless 验收
docs/GDD.md                   游戏设计与首期边界
```

## 本地运行

安装 Godot 4.7.2 后，在仓库根目录执行：

```powershell
godot --editor --path .
```

或直接运行：

```powershell
godot --path .
```

工程使用 Compatibility renderer、`1280×720` 设计基准、`canvas_items + expand` 拉伸策略和横屏布局。鼠标点击会模拟触控，Android 使用触控和系统返回键。

## 测试

```powershell
godot --headless --path . tests/test_runner.tscn
```

测试覆盖：

- 8 卷、22 个人物、23 件法宝的稳定 ID 与资源引用；
- 《西游记》12 个节点的可达性、3 场战斗和 2 个结局；
- 普通攻击、MP、3 回合冷却、防御、一次性法宝与 12 回合上限；
- `schema_version: 1` 存档往返、损坏降级、卷内重开和清除全部进度。

素材迁移校验清单位于 `assets/art/manifest.sha256`。

## 导出

安装对应的 Godot 4.7.2 导出模板后执行：

```powershell
godot --headless --path . --export-release "Windows Desktop"
godot --headless --path . --export-debug "Android Debug"
```

默认产物：

- `builds/windows/万卷浮生-v0.2.0-godot-alpha.exe`
- `builds/android/万卷浮生-v0.2.0-godot-alpha-debug.apk`

Android 导出使用包名 `com.fengjiehzi.wanjuanfusheng`，版本名 `0.2.0-godot-alpha`，仅输出 arm64 Debug APK。项目不申请 `INTERNET` 权限，也不包含账号、云存档或联网玩法。

## 存档

- 游戏进度：`user://save_v1.json`
- 设置：`user://settings.cfg`
- 每次剧情选择、战斗胜利和结局到达后自动保存；Android 进入后台时补存。
- 战败回到战前检查点，不写入失败消耗或惩罚。

## 贡献

提交内容前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。详细玩法边界见 [docs/GDD.md](docs/GDD.md)。

## 许可

代码按 [MIT License](LICENSE) 授权。美术素材的来源与生成记录见 `assets/art/` 内对应说明。
