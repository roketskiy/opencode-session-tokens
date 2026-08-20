/** @jsxImportSource @opentui/solid */
import { createSignal } from "solid-js"
import { computeUsage, renderCompact, renderDetails, type Usage } from "./usage"
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"

/** 插件可用配置：tui.json 中 "plugin": [["opencode-session-tokens", { format: "details" }]] */
export interface SessionTokensOptions {
  /** compact: tokens 1.2M · cache 97% ；details: tokens 1.2M · in 1.1M · out 43.4K · cache 97% */
  format?: "compact" | "details"
}

export interface BarState extends Usage {
  sessionID: string
}

const tui: TuiPlugin = async (api, options) => {
  const opts = (options ?? {}) as SessionTokensOptions
  // 底部条内容信号：事件驱动更新，宿主 Solid 渲染时读取
  const [state, setState] = createSignal<BarState | undefined>(undefined)

  const apply = (sessionID: string, tokens: { input: number; output: number; reasoning: number; cache: { read: number; write: number } } | undefined) => {
    const usage = computeUsage(tokens)
    if (!usage) return
    setState({ sessionID, ...usage })
  }

  // 主通道：session 聚合数据更新（含 tokens）
  api.event.on("session.updated", (e) => {
    const info = e.properties.info
    apply(info.id ?? e.properties.sessionID, info.tokens)
  })

  // 兜底：一轮回复结束（idle）时直接读 session 快照，避免事件时序问题
  api.event.on("session.status", (e) => {
    if (e.properties.status.type !== "idle") return
    const info = api.state.session.get(e.properties.sessionID)
    if (info) apply(info.id ?? e.properties.sessionID, info.tokens)
  })

  api.slots.register({
    slots: {
      // 底部常驻一条： ▸ 12345678 · tokens 1.2M · cache 97%
      app_bottom(ctx) {
        const bar = state()
        // 短 id 取末尾 8 位：与 OpenCode 界面/分享短 id（如 7kfLmkPQ）一致
        const short = bar ? bar.sessionID.slice(-8) : "—"
        const text = bar
          ? opts.format === "details"
            ? renderDetails(bar)
            : renderCompact(bar)
          : "tokens —"
        return (
          <box
            flexDirection="row"
            justifyContent="flex-end"
            paddingRight={1}
            flexShrink={0}
            height={1}
          >
            <text fg={ctx.theme.current.textMuted} wrapMode="none" height={1}>
              <span style={{ fg: ctx.theme.current.accent }}>{short}</span>
              {" · "}
              {text}
            </text>
          </box>
        )
      },
    },
  })
}

export default { id: "opencode-session-tokens", tui } satisfies TuiPluginModule