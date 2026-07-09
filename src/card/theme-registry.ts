// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — dynamic theme registry
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

/** Initialize the registry with built-in themes. */
function init(): void {
  for (const theme of THEMES) {
    registry.set(theme.id, theme)
  }
}

// Auto-init on module load
init()

// ── Public API ───────────────────────────────────────────────────────────

/** Register a new theme (or override an existing one). */
export function registerTheme(theme: ThemeDefinition): void {
  registry.set(theme.id, theme)
  emitChange()
}

/** Remove a theme by ID. Cannot remove built-in themes by default. */
export function unregisterTheme(id: string): boolean {
  const deleted = registry.delete(id)
  if (deleted) emitChange()
  return deleted
}

/** Get a theme by ID. Falls back to the default theme. */
export function getTheme(id: string): ThemeDefinition {
  return registry.get(id) ?? registry.get('moss-paper') ?? THEMES[0]
}

/** Get all registered themes as a sorted list. */
export function getAllThemes(): ThemeDefinition[] {
  return Array.from(registry.values())
}

/** Check whether a theme ID is registered. */
export function hasTheme(id: string): boolean {
  return registry.has(id)
}

/** Get the number of registered themes. */
export function getThemeCount(): number {
  return registry.size
}

/**
 * Subscribe to registry changes (register/unregister).
 * Returns an unsubscribe function.
 */
export function onRegistryChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Reset the registry to only built-in themes. */
export function resetRegistry(): void {
  registry.clear()
  init()
  emitChange()
}
