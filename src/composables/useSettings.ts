import { ref, watch } from 'vue'

// ── Types ────────────────────────────────────────────────────────────────

export type CardSizePreset = 'small' | 'medium' | 'large'

/** Page-splitting strategy for the card preview. */
export type SplitMode = 'noSplit' | 'xiaohongshu' | 'hrSplit'

/** Card theme identifier — any registered theme ID string. */
export type CardThemeId = string

export interface AppSettings {
  cardSize: CardSizePreset
  bodyFontSize: number
  exportFormat: 'PNG' | 'JPG' | 'PDF'
  splitMode: SplitMode
  /** Card theme ID (Canvas-based themes) */
  cardTheme: CardThemeId
  /** Highlight style */
  highlightStyle: 'underline' | 'border' | 'highlight'
  /** Footer left text */
  footerLeft: string
  /** Footer right display mode */
  footerRightMode: 'blank' | 'page' | 'date'
  /** Whether footer is enabled */
  footerEnabled: boolean
  /** Card corner mode */
  cardCornerMode: 'rounded' | 'square'
  /** Body font mode */
  bodyFontMode: 'wenkai' | 'yahei' | 'simsun' | 'kaiti' | 'dengxian' | 'fangsong'
  /** Subheading style */
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

// New settings for Canvas-based card themes
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
  }
}
