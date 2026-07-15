import { ref, watch } from 'vue'

// ── Types ────────────────────────────────────────────────────────────────

export type CardSizePreset = 'small' | 'medium' | 'large'

/** 卡片预览的分页策略。 */
export type SplitMode = 'noSplit' | 'xiaohongshu' | 'hrSplit'

/** 卡片主题标识符 — 任何已注册的主题 ID 字符串。 */
export type CardThemeId = string

export interface AppSettings {
  cardSize: CardSizePreset
  bodyFontSize: number
  exportFormat: 'PNG' | 'JPG' | 'PDF'
  splitMode: SplitMode
  /** 卡片主题 ID（Canvas 主题） */
  cardTheme: CardThemeId
  /** 高亮样式 */
  highlightStyle: 'underline' | 'border' | 'highlight'
  /** 页脚左侧文本 */
  footerLeft: string
  /** 页脚右侧显示模式 */
  footerRightMode: 'blank' | 'page' | 'date'
  /** 是否启用页脚 */
  footerEnabled: boolean
  /** 卡片圆角模式 */
  cardCornerMode: 'rounded' | 'square'
  /** 正文字体模式 */
  bodyFontMode: 'wenkai' | 'yahei' | 'simsun' | 'kaiti' | 'dengxian' | 'fangsong'
  /** 子标题样式 */
  subheadingStyle: 'large' | 'accent'
}

const STORAGE_PREFIX = 'md2card:'

// ── Singleton reactive state ────────────────────────────────────────────

const cardSize = ref<CardSizePreset>(
  (localStorage.getItem(STORAGE_PREFIX + 'cardSize') as CardSizePreset) || 'medium',
)
const bodyFontSize = ref<number>(
  Number(localStorage.getItem(STORAGE_PREFIX + 'bodyFontSize')) || 30,
)
const exportFormat = ref<'PNG' | 'JPG' | 'PDF'>(
  (localStorage.getItem(STORAGE_PREFIX + 'exportFormat') as 'PNG' | 'JPG' | 'PDF') || 'PNG',
)
const splitMode = ref<SplitMode>(
  (localStorage.getItem(STORAGE_PREFIX + 'splitMode') as SplitMode) || 'xiaohongshu',
)

// 基于 Canvas 卡片主题的新设置项
const cardTheme = ref<CardThemeId>(
  (localStorage.getItem(STORAGE_PREFIX + 'cardTheme') as CardThemeId) || 'moss-paper',
)
const highlightStyle = ref<'underline' | 'border' | 'highlight'>(
  (localStorage.getItem(STORAGE_PREFIX + 'highlightStyle') as 'underline' | 'border' | 'highlight') || 'underline',
)
const footerLeft = ref<string>(
  localStorage.getItem(STORAGE_PREFIX + 'footerLeft') || '',
)
const footerRightMode = ref<'blank' | 'page' | 'date'>(
  (localStorage.getItem(STORAGE_PREFIX + 'footerRightMode') as 'blank' | 'page' | 'date') || 'page',
)
const footerEnabled = ref<boolean>(
  localStorage.getItem(STORAGE_PREFIX + 'footerEnabled') !== 'false',
)
const cardCornerMode = ref<'rounded' | 'square'>(
  (localStorage.getItem(STORAGE_PREFIX + 'cardCornerMode') as 'rounded' | 'square') || 'square',
)
const subheadingStyle = ref<'large' | 'accent'>(
  (localStorage.getItem(STORAGE_PREFIX + 'subheadingStyle') as 'large' | 'accent') || 'large',
)
const bodyFontMode = ref<'wenkai' | 'yahei' | 'simsun' | 'kaiti' | 'dengxian' | 'fangsong'>(
  (localStorage.getItem(STORAGE_PREFIX + 'bodyFontMode') as 'wenkai' | 'yahei' | 'simsun' | 'kaiti' | 'dengxian' | 'fangsong') || 'wenkai',
)

// ── Heading style overrides ────────────────────────────────────────────

function loadHeadingSize(key: string): number | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + key)
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

const headingH1Size = ref<number | null>(loadHeadingSize('headingH1Size'))
const headingH2Size = ref<number | null>(loadHeadingSize('headingH2Size'))
const headingH3Size = ref<number | null>(loadHeadingSize('headingH3Size'))
const headingH4Size = ref<number | null>(loadHeadingSize('headingH4Size'))
const headingH5Size = ref<number | null>(loadHeadingSize('headingH5Size'))
const headingH6Size = ref<number | null>(loadHeadingSize('headingH6Size'))
const headingH1Align = ref<'left' | 'center' | 'right'>(
  (localStorage.getItem(STORAGE_PREFIX + 'headingH1Align') as 'left' | 'center' | 'right') || 'left',
)

// ── Heading color overrides ──────────────────────────────────────────

function loadHeadingColor(key: string): string | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + key)
  return raw && raw.length > 0 ? raw : null
}

const headingH1Color = ref<string | null>(loadHeadingColor('headingH1Color'))
const headingH2Color = ref<string | null>(loadHeadingColor('headingH2Color'))
const headingH3Color = ref<string | null>(loadHeadingColor('headingH3Color'))
const headingH4Color = ref<string | null>(loadHeadingColor('headingH4Color'))
const headingH5Color = ref<string | null>(loadHeadingColor('headingH5Color'))
const headingH6Color = ref<string | null>(loadHeadingColor('headingH6Color'))

// ── Heading stroke overrides ──────────────────────────────────────────

const headingH1Stroke = ref<string | null>(loadHeadingColor('headingH1Stroke'))
const headingH2Stroke = ref<string | null>(loadHeadingColor('headingH2Stroke'))
const headingH3Stroke = ref<string | null>(loadHeadingColor('headingH3Stroke'))
const headingH4Stroke = ref<string | null>(loadHeadingColor('headingH4Stroke'))
const headingH5Stroke = ref<string | null>(loadHeadingColor('headingH5Stroke'))
const headingH6Stroke = ref<string | null>(loadHeadingColor('headingH6Stroke'))

// ── Heading stroke width overrides ────────────────────────────────────

function loadHeadingStrokeWidth(key: string): number | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + key)
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

const headingH1StrokeWidth = ref<number | null>(loadHeadingStrokeWidth('headingH1StrokeWidth'))
const headingH2StrokeWidth = ref<number | null>(loadHeadingStrokeWidth('headingH2StrokeWidth'))
const headingH3StrokeWidth = ref<number | null>(loadHeadingStrokeWidth('headingH3StrokeWidth'))
const headingH4StrokeWidth = ref<number | null>(loadHeadingStrokeWidth('headingH4StrokeWidth'))
const headingH5StrokeWidth = ref<number | null>(loadHeadingStrokeWidth('headingH5StrokeWidth'))
const headingH6StrokeWidth = ref<number | null>(loadHeadingStrokeWidth('headingH6StrokeWidth'))

// ── Auto-persist ────────────────────────────────────────────────────────

watch(cardSize, (v) => localStorage.setItem(STORAGE_PREFIX + 'cardSize', v))
watch(bodyFontSize, (v) => localStorage.setItem(STORAGE_PREFIX + 'bodyFontSize', String(v)))
watch(exportFormat, (v) => localStorage.setItem(STORAGE_PREFIX + 'exportFormat', v))
watch(splitMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'splitMode', v))
watch(cardTheme, (v) => localStorage.setItem(STORAGE_PREFIX + 'cardTheme', v))
watch(highlightStyle, (v) => localStorage.setItem(STORAGE_PREFIX + 'highlightStyle', v))
watch(footerLeft, (v) => localStorage.setItem(STORAGE_PREFIX + 'footerLeft', v))
watch(footerRightMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'footerRightMode', v))
watch(footerEnabled, (v) => localStorage.setItem(STORAGE_PREFIX + 'footerEnabled', String(v)))
watch(cardCornerMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'cardCornerMode', v))
watch(subheadingStyle, (v) => localStorage.setItem(STORAGE_PREFIX + 'subheadingStyle', v))
watch(bodyFontMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'bodyFontMode', v))

// Heading style overrides — persist to localStorage
watch(headingH1Size, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH1Size', v === null ? '' : String(v)))
watch(headingH2Size, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH2Size', v === null ? '' : String(v)))
watch(headingH3Size, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH3Size', v === null ? '' : String(v)))
watch(headingH4Size, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH4Size', v === null ? '' : String(v)))
watch(headingH5Size, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH5Size', v === null ? '' : String(v)))
watch(headingH6Size, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH6Size', v === null ? '' : String(v)))
watch(headingH1Align, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH1Align', v))

// Heading color — persist to localStorage
watch(headingH1Color, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH1Color', v ?? ''))
watch(headingH2Color, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH2Color', v ?? ''))
watch(headingH3Color, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH3Color', v ?? ''))
watch(headingH4Color, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH4Color', v ?? ''))
watch(headingH5Color, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH5Color', v ?? ''))
watch(headingH6Color, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH6Color', v ?? ''))

// Heading stroke — persist to localStorage
watch(headingH1Stroke, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH1Stroke', v ?? ''))
watch(headingH2Stroke, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH2Stroke', v ?? ''))
watch(headingH3Stroke, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH3Stroke', v ?? ''))
watch(headingH4Stroke, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH4Stroke', v ?? ''))
watch(headingH5Stroke, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH5Stroke', v ?? ''))
watch(headingH6Stroke, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH6Stroke', v ?? ''))

// Heading stroke width — persist to localStorage
watch(headingH1StrokeWidth, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH1StrokeWidth', v === null ? '' : String(v)))
watch(headingH2StrokeWidth, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH2StrokeWidth', v === null ? '' : String(v)))
watch(headingH3StrokeWidth, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH3StrokeWidth', v === null ? '' : String(v)))
watch(headingH4StrokeWidth, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH4StrokeWidth', v === null ? '' : String(v)))
watch(headingH5StrokeWidth, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH5StrokeWidth', v === null ? '' : String(v)))
watch(headingH6StrokeWidth, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH6StrokeWidth', v === null ? '' : String(v)))

// ── Composable ───────────────────────────────────────────────────────────

export function useSettings(): {
  cardSize: typeof cardSize
  bodyFontSize: typeof bodyFontSize
  exportFormat: typeof exportFormat
  splitMode: typeof splitMode
  cardTheme: typeof cardTheme
  highlightStyle: typeof highlightStyle
  footerLeft: typeof footerLeft
  footerRightMode: typeof footerRightMode
  footerEnabled: typeof footerEnabled
  cardCornerMode: typeof cardCornerMode
  subheadingStyle: typeof subheadingStyle
  bodyFontMode: typeof bodyFontMode
  headingH1Size: typeof headingH1Size
  headingH2Size: typeof headingH2Size
  headingH3Size: typeof headingH3Size
  headingH4Size: typeof headingH4Size
  headingH5Size: typeof headingH5Size
  headingH6Size: typeof headingH6Size
  headingH1Align: typeof headingH1Align
  headingH1Color: typeof headingH1Color
  headingH2Color: typeof headingH2Color
  headingH3Color: typeof headingH3Color
  headingH4Color: typeof headingH4Color
  headingH5Color: typeof headingH5Color
  headingH6Color: typeof headingH6Color
  headingH1Stroke: typeof headingH1Stroke
  headingH2Stroke: typeof headingH2Stroke
  headingH3Stroke: typeof headingH3Stroke
  headingH4Stroke: typeof headingH4Stroke
  headingH5Stroke: typeof headingH5Stroke
  headingH6Stroke: typeof headingH6Stroke
  headingH1StrokeWidth: typeof headingH1StrokeWidth
  headingH2StrokeWidth: typeof headingH2StrokeWidth
  headingH3StrokeWidth: typeof headingH3StrokeWidth
  headingH4StrokeWidth: typeof headingH4StrokeWidth
  headingH5StrokeWidth: typeof headingH5StrokeWidth
  headingH6StrokeWidth: typeof headingH6StrokeWidth
  /** 清除所有用户自定义的标题颜色（主题切换时调用）。 */
  clearHeadingColors: () => void
} {
  function clearHeadingColors(): void {
    headingH1Color.value = null
    headingH2Color.value = null
    headingH3Color.value = null
    headingH4Color.value = null
    headingH5Color.value = null
    headingH6Color.value = null
  }

  return {
    cardSize,
    bodyFontSize,
    exportFormat,
    splitMode,
    cardTheme,
    highlightStyle,
    footerLeft,
    footerRightMode,
    footerEnabled,
    cardCornerMode,
    subheadingStyle,
    bodyFontMode,
    headingH1Size,
    headingH2Size,
    headingH3Size,
    headingH4Size,
    headingH5Size,
    headingH6Size,
    headingH1Align,
    headingH1Color,
    headingH2Color,
    headingH3Color,
    headingH4Color,
    headingH5Color,
    headingH6Color,
    headingH1Stroke,
    headingH2Stroke,
    headingH3Stroke,
    headingH4Stroke,
    headingH5Stroke,
    headingH6Stroke,
    headingH1StrokeWidth,
    headingH2StrokeWidth,
    headingH3StrokeWidth,
    headingH4StrokeWidth,
    headingH5StrokeWidth,
    headingH6StrokeWidth,
    clearHeadingColors,
  }
}