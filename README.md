# opencode-session-tokens

OpenCode 插件：在 TUI 底部常驻一条**当前会话的 token 用量统计**，含缓存命中率。

```
┌──────────────────────────────────────────────────────────┐
│  ▸ 12345678 · tokens 1.7M · cache 97%      ← 右下角常驻  │
└──────────────────────────────────────────────────────────┘
```

- 由 `session.updated` 事件驱动，实时更新（无需手动刷新）
- 回复轮次结束时（`session.status` idle）兜底读取 session 快照，避免事件时序遗漏
- 缓存命中率：`cache.read / (cache.read + cache.write)`，无缓存读写时不显示

## 安装

把插件 spec 加进任一层 `tui.json` 配置：

**全局**（所有项目生效）：

```jsonc
// C:\Users\<你的用户名>\.config\opencode\tui.json （Windows）
// ~/.config/opencode/tui.json （macOS / Linux）
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-tokens"]
}
```

**项目级**（仅当前项目）：

```jsonc
// <项目根>/.opencode/tui.json
{
  "plugin": ["opencode-session-tokens"]
}
```

保存后重启 `opencode`（TUI）即可生效。

### 本地开发（直接用源码）

```jsonc
// <项目根>/.opencode/tui.json
{
  "plugin": ["../src/tui.tsx"]
}
```

## 配置项

`"plugin": [["opencode-session-tokens", { "format": "details" }]]`

| 选项     | 类型                 | 默认       | 说明                                                   |
| -------- | -------------------- | ---------- | ------------------------------------------------------ |
| `format` | `"compact" \| "details"` | `"compact"` | `compact`：`tokens 1.7M · cache 97%`；`details`：`tokens 1.7M · in 1.1M · out 43.4K · cache 97%` |

## 工作原理

- 底部条通过 `api.slots.register` 的 `app_bottom` 插槽渲染，右对齐常驻。
- 插件监听 `session.updated`（携带 Session 聚合数据，含 `tokens`），更新内存中的信号量；渲染函数读取信号，宿主 Solid 实例响应式重绘（通过 `@opentui/solid` 的 runtime-plugin-support 重写 `solid-js` 导入，与宿主共享同一 Solid 实例）。
- 显示最近一次更新的会话；无数据时显示占位 `tokens —`。

## 开发

```bash
bun install     # 安装依赖
bun run typecheck   # tsc --noEmit
bun run build       # 产物到 dist/tui.js（solid-js / @opentui/* 保持外部导入）
bun run test        # 冒烟测试（含帧级断言，无原生渲染器环境自动跳过帧部分）
```

## License

MIT