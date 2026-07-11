// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 动态主题注册表
// ═══════════════════════════════════════════════════════════════════════════

import type { ThemeDefinition } from './types'
import { THEMES } from './themes'

// ── Event emitter (lightweight, no deps) ─────────────────────────────────

type Listener = () => void
const listeners = new Set<Listener>()

function emitChange(): void {
  listeners.forEach((fn) => fn())
}

// ── Registry state ───────────────────────────────────────────────────────

const registry = new Map<string, ThemeDefinition>()

/** 使用内置主题初始化注册表。 */
function init(): void {
  for (const theme of THEMES) {
    registry.set(theme.id, theme)
  }
}

// 模块加载时自动初始化
init()

// ── Public API ───────────────────────────────────────────────────────────

/** 注册新主题（或覆盖已有主题）。 */
export function registerTheme(theme: ThemeDefinition): void {
  registry.set(theme.id, theme)
  emitChange()
}

/** 按 ID 移除主题。默认不能移除内置主题。 */
export function unregisterTheme(id: string): boolean {
  const deleted = registry.delete(id)
  if (deleted) emitChange()
  return deleted
}

/** 按 ID 获取主题。如果未找到则回退到默认主题。 */
export function getTheme(id: string): ThemeDefinition {
  return registry.get(id) ?? registry.get('moss-paper') ?? THEMES[0]
}

/** 获取所有已注册主题的排序列表。 */
export function getAllThemes(): ThemeDefinition[] {
  return Array.from(registry.values())
}

/** 检查主题 ID 是否已注册。 */
export function hasTheme(id: string): boolean {
  return registry.has(id)
}

/** 获取已注册主题的数量。 */
export function getThemeCount(): number {
  return registry.size
}

/**
 * 订阅注册表变更（注册/注销）。
 * 返回一个取消订阅函数。
 */
export function onRegistryChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** 将注册表重置为仅包含内置主题。 */
export function resetRegistry(): void {
  registry.clear()
  init()
  emitChange()
}