/**
 * Shared card size presets used across CardPreview, EditorView, and
 * the auto-split measurement engine.
 *
 * Extracted into a single module so every consumer agrees on dimensions
 * without duplicating the presets array.
 */

export interface SizePreset {
  name: string
  width: number
  height: number
}

/** Canonical card size presets (order is stable — do not reorder). */
export const SIZE_PRESETS: readonly SizePreset[] = [
  { name: '小红书', width: 440, height: 586 },
  { name: '正方形', width: 500, height: 500 },
  { name: '海报',   width: 440, height: 782 },
  { name: 'A4',    width: 595, height: 842 },
] as const

/** Map the settings preset key → index into SIZE_PRESETS. */
export const DEFAULT_SIZE_MAP: Record<string, number> = {
  small:  0, // 小红书 440×586
  medium: 1, // 正方形 500×500
  large:  3, // A4 595×842
}

/**
 * Resolve a settings-level preset key (`"small" | "medium" | "large"`)
 * to a concrete {name, width, height} tuple.
 */
export function resolveCardSize(preset: string): SizePreset {
  const idx = DEFAULT_SIZE_MAP[preset] ?? 1
  return { ...SIZE_PRESETS[idx] }
}

/** Card content area padding in rem (mirrors the 2rem in style.css). */
export const CARD_PADDING_REM = 2
