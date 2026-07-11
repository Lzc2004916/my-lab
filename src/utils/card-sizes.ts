/**
 * 共享卡片尺寸预设，用于 CardPreview、EditorView 和自动拆分测量引擎。
 *
 * 提取到单个模块中，确保所有消费者对尺寸一致，无需重复预设数组。
 */

export interface SizePreset {
  name: string
  width: number
  height: number
}

/** 规范卡片尺寸预设（顺序固定 — 不要重新排序）。 */
export const SIZE_PRESETS: readonly SizePreset[] = [
  { name: '小红书', width: 440, height: 586 },
  { name: '正方形', width: 500, height: 500 },
  { name: '海报',   width: 440, height: 782 },
  { name: 'A4',    width: 595, height: 842 },
] as const

/** 将设置预设键 → 映射到 SIZE_PRESETS 的索引。 */
export const DEFAULT_SIZE_MAP: Record<string, number> = {
  small:  0, // 小红书 440×586
  medium: 1, // 正方形 500×500
  large:  3, // A4 595×842
}

/**
 * 将设置级预设键（`"small" | "medium" | "large"`）解析为具体的 {name, width, height} 元组。
 */
export function resolveCardSize(preset: string): SizePreset {
  const idx = DEFAULT_SIZE_MAP[preset] ?? 1
  return { ...SIZE_PRESETS[idx] }
}

/** 卡片内容区域的内边距（单位 rem，与 style.css 中的 2rem 一致）。 */
export const CARD_PADDING_REM = 2