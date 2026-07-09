# 原生JS引擎与React组件桥接契约

## 1. 架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      React 组件层                          │
│  ┌─────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │ Battle  │  │ Character   │  │      UI组件          │    │
│  │  View   │  │    Card     │  │ (Modal/Toast/Loading)│    │
│  └────┬────┘  └──────┬──────┘  └──────────┬──────────┘    │
│       │              │                     │                │
│       └──────────────┼─────────────────────┘                │
│                      ▼                                     │
│            ┌─────────────────┐                             │
│            │   Zustand Store │ ← 状态同步                  │
│            └────────┬────────┘                             │
│                     │                                      │
│                     ▼                                      │
│            ┌─────────────────┐                             │
│            │   Event Bus     │ ← 事件通信                  │
│            └────────┬────────┘                             │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    原生JS引擎层                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ BattleEngine │  │ StoryEngine  │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 通信模式

#### 模式一：事件总线（实时事件）

用于处理需要实时响应的事件，如战斗伤害、技能释放、状态变化等。

**原生JS引擎 → React组件**：
```javascript
eventBus.emit('battle:damage', {
  attacker: characterId,
  target: targetId,
  damage: 150,
  skillName: '如意金箍棒',
  isCritical: true
});

useEffect(() => {
  const handler = eventBus.on('battle:damage', (data) => {
    showDamageNumber(data);
  });
  return () => handler.off();
}, []);
```

**React组件 → 原生JS引擎**：
```javascript
eventBus.emit('battle:skill', {
  characterId: characterId,
  skillIndex: 0
});

eventBus.on('battle:skill', (data) => {
  executeSkill(data.characterId, data.skillIndex);
});
```

#### 模式二：状态同步（数据同步）

用于处理需要持久化或跨组件共享的数据。

**原生JS引擎 → Zustand**：
```javascript
gameStore.setBattleState({
  round: 5,
  playerHealth: 75,
  enemyHealth: 30,
  isPlayerTurn: true
});

const { battleState } = useGameStore();
```

**React组件 → Zustand → 原生JS引擎**：
```javascript
gameStore.updateAIConfig(newConfig);

const gameStore = create((set, get) => ({
  aiConfig: {},
  updateAIConfig: (config) => {
    set({ aiConfig: config });
    storyEngine.setAIConfig(config);
  }
}));
```

## 2. 事件定义

### 2.1 战斗事件

| 事件名 | 触发时机 | 数据结构 |
|-------|---------|---------|
| `battle:start` | 战斗开始 | `{ player, enemy }` |
| `battle:round` | 回合开始 | `{ round, isPlayerTurn }` |
| `battle:damage` | 造成伤害 | `{ attacker, target, damage, skillName, isCritical }` |
| `battle:heal` | 恢复生命 | `{ target, amount }` |
| `battle:skill` | 释放技能 | `{ characterId, skillIndex }` |
| `battle:buff` | 施加增益 | `{ target, buffName, duration }` |
| `battle:debuff` | 施加减益 | `{ target, debuffName, duration }` |
| `battle:end` | 战斗结束 | `{ winner, loser }` |

### 2.2 剧情事件

| 事件名 | 触发时机 | 数据结构 |
|-------|---------|---------|
| `story:start` | 剧情开始 | `{ sessionId }` |
| `story:text` | 剧情文本生成 | `{ text, character }` |
| `story:choice` | 出现选项 | `{ choices }` |
| `story:end` | 剧情结束 | `{ sessionId }` |
| `story:delete` | 剧情删除 | `{ sessionId }` |

### 2.3 UI事件

| 事件名 | 触发时机 | 数据结构 |
|-------|---------|---------|
| `ui:toast` | 显示消息 | `{ message, type }` |
| `ui:modal` | 显示弹窗 | `{ content, title }` |
| `ui:loading` | 加载状态 | `{ isLoading, message }` |

## 3. 状态定义

### 3.1 Zustand Store 结构

```javascript
const gameStore = create((set, get) => ({
  characters: [],
  books: [],
  battle: {
    isActive: false,
    round: 0,
    player: null,
    enemy: null,
    playerHealth: 100,
    enemyHealth: 100,
    logs: []
  },
  aiConfig: {
    apiKey: '',
    provider: '',
    model: ''
  },
  currentView: 'welcome',
  addCharacter: (character) => set(...),
  removeCharacter: (id) => set(...),
  updateBattleState: (state) => set(...),
  updateAIConfig: (config) => set(...)
}));
```

## 4. 具体场景示例

### 4.1 场景：战斗伤害显示

1. **用户点击技能按钮**：React `SkillButton` 组件触发 `eventBus.emit('battle:skill', { characterId, skillIndex })`

2. **战斗引擎处理**：`battle-engine.js` 订阅事件，计算伤害，发布 `eventBus.emit('battle:damage', { attacker, target, damage, skillName, isCritical })`

3. **React组件响应**：`BattleView` 组件订阅事件，显示伤害数字飘动动画

4. **状态同步**：`battle-engine.js` 更新 `gameStore.setBattleState({ playerHealth, enemyHealth })`

5. **UI更新**：`CharacterCard` 组件读取状态，更新血条显示

### 4.2 场景：AI配置更新

1. **用户修改配置**：React 设置页面更新 `gameStore.updateAIConfig(newConfig)`

2. **状态同步**：Zustand 更新状态，中间件同步到 `storyEngine.setAIConfig(config)`

3. **立即生效**：后续剧情生成使用新配置

## 5. 实现步骤

1. 实现事件总线工具类
2. 定义Zustand Store结构
3. 封装原生JS引擎的事件发布和状态同步方法
4. 在React组件中实现事件订阅和状态读取
5. 编写单元测试验证通信机制
