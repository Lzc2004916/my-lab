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
  Number(localStorage.getItem(STORAGE_PREFIX + 'bodyFontSize')) || 16,
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
const headingH1VerticalCenter = ref<boolean>(
  localStorage.getItem(STORAGE_PREFIX + 'headingH1VerticalCenter') === 'true',
)

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
watch(headingH1VerticalCenter, (v) => localStorage.setItem(STORAGE_PREFIX + 'headingH1VerticalCenter', String(v)))

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
  headingH1VerticalCenter: typeof headingH1VerticalCenter
} {
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
    headingH1VerticalCenter,
  }
}