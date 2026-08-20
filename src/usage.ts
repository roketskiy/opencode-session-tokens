/**
 * Token 用量统计的纯函数工具（无任何外部依赖）
 */

/** SDK Session.Info.tokens 的结构（宽松类型，便于防御式解析） */
export interface TokensLike {
  input?: number
  output?: number
  reasoning?: number
  cache?: { read?: number; write?: number }
}

export interface Usage {
  /** 总 token（对齐 provider totalTokens：输入+输出+推理+缓存读+缓存写） */
  total: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
  /** 缓存命中率百分比，0-100；无缓存读写时为 undefined */
  cacheHitPercent: number | undefined
}

/** 从 tokens 对象计算用量；结构不合法时返回 undefined */
export function computeUsage(tokens: TokensLike | null | undefined): Usage | undefined {
  if (!tokens) return undefined
  const input = num(tokens.input)
  const output = num(tokens.output)
  const reasoning = num(tokens.reasoning)
  const cacheRead = num(tokens.cache?.read)
  const cacheWrite = num(tokens.cache?.write)
  if (input === 0 && output === 0 && reasoning === 0 && cacheRead === 0 && cacheWrite === 0) return undefined
  // total 对齐 OpenCode 口径（provider usage.totalTokens = 拆分字段总和）：
  // 非缓存输入 + 输出 + 推理 + 缓存读 + 缓存写
  const total = input + output + reasoning + cacheRead + cacheWrite
  const div = cacheRead + cacheWrite
  return {
    total,
    input,
    output,
    reasoning,
    cacheRead,
    cacheWrite,
    cacheHitPercent: div > 0 ? Math.round((cacheRead / div) * 100) : undefined,
  }
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

/** 1234567 -> "1.2M"，43400 -> "43.4K"，912 -> "912" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${m >= 10 ? Math.round(m) : trim1(m)}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    return `${k >= 100 ? Math.round(k) : trim1(k)}K`
  }
  return `${Math.round(n)}`
}

function trim1(v: number): string {
  const s = v.toFixed(1)
  return s.endsWith(".0") ? s.slice(0, -2) : s
}

/** 紧凑模式一行：tokens 1.2M · cache 97% */
export function renderCompact(u: Usage): string {
  const parts = [`tokens ${formatCompact(u.total)}`]
  if (u.cacheHitPercent !== undefined) {
    parts.push(`cache ${u.cacheHitPercent}%`)
  }
  return parts.join(" · ")
}

/** 明细模式一行：tokens 1.2M · in 43.4K · out 12.3K · cache 97% */
export function renderDetails(u: Usage): string {
  const parts = [
    `tokens ${formatCompact(u.total)}`,
    `in ${formatCompact(u.input)}`,
    `out ${formatCompact(u.output)}`,
  ]
  if (u.cacheHitPercent !== undefined) {
    parts.push(`cache ${u.cacheHitPercent}%`)
  }
  return parts.join(" · ")
}