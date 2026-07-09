import { ref, watch } from 'vue'
import type { TitleAlignment } from '@/card'

// ── Types ────────────────────────────────────────────────────────────────

export type CardSizePreset = 'small' | 'medium' | 'large'

/** Page-splitting strategy for the card preview. */
export type SplitMode = 'noSplit' | 'xiaohongshu' | 'hrSplit'

/** Card theme identifier — any registered theme ID string. */
export type CardThemeId = string

export interface AppSettings {
  cardSize: CardSizePreset
  bodyFontSize: number
  titleFontSize: number
  exportFormat: 'PNG' | 'JPG' | 'PDF'
  splitMode: SplitMode
  /** Card theme ID (Canvas-based themes) */
  cardTheme: CardThemeId
  /** Highlight style */
  highlightStyle: 'underline' | 'marker' | 'border'
  /** Footer left text */
  footerLeft: string
  /** Footer right display mode */
  footerRightMode: 'blank' | 'page' | 'date'
  /** Whether footer is enabled */
  footerEnabled: boolean
  /** Card corner mode */
  cardCornerMode: 'rounded' | 'square'
  /** Card title font mode */
  titleFontMode: 'serif' | 'kai' | 'sans' | 'puhuiti' | 'retroSerif'
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
const titleFontSize = ref<number>(
  Number(localStorage.getItem(STORAGE_PREFIX + 'titleFontSize')) || 24,
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
const highlightStyle = ref<'underline' | 'marker' | 'border'>(
  (localStorage.getItem(STORAGE_PREFIX + 'highlightStyle') as 'underline' | 'marker' | 'border') || 'underline',
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
const titleFontMode = ref<'serif' | 'kai' | 'sans' | 'puhuiti' | 'retroSerif'>(
  (localStorage.getItem(STORAGE_PREFIX + 'titleFontMode') as 'serif' | 'kai' | 'sans' | 'puhuiti' | 'retroSerif') || 'serif',
)
const subheadingStyle = ref<'large' | 'accent'>(
  (localStorage.getItem(STORAGE_PREFIX + 'subheadingStyle') as 'large' | 'accent') || 'large',
)

// Title customization
const titleColor = ref<string>(
  localStorage.getItem(STORAGE_PREFIX + 'titleColor') || '',
)
const titleAlignment = ref<TitleAlignment>(
  (localStorage.getItem(STORAGE_PREFIX + 'titleAlignment') as TitleAlignment) || 'left',
)
const titleCustomWeight = ref<number>(
  Number(localStorage.getItem(STORAGE_PREFIX + 'titleCustomWeight')) || 0,
)
const titleCustomSpacing = ref<number>(
  Number(localStorage.getItem(STORAGE_PREFIX + 'titleCustomSpacing')) || 0,
)

// ── Auto-persist ────────────────────────────────────────────────────────

watch(cardSize, (v) => localStorage.setItem(STORAGE_PREFIX + 'cardSize', v))
watch(bodyFontSize, (v) => localStorage.setItem(STORAGE_PREFIX + 'bodyFontSize', String(v)))
watch(titleFontSize, (v) => localStorage.setItem(STORAGE_PREFIX + 'titleFontSize', String(v)))
watch(exportFormat, (v) => localStorage.setItem(STORAGE_PREFIX + 'exportFormat', v))
watch(splitMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'splitMode', v))
watch(cardTheme, (v) => localStorage.setItem(STORAGE_PREFIX + 'cardTheme', v))
watch(highlightStyle, (v) => localStorage.setItem(STORAGE_PREFIX + 'highlightStyle', v))
watch(footerLeft, (v) => localStorage.setItem(STORAGE_PREFIX + 'footerLeft', v))
watch(footerRightMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'footerRightMode', v))
watch(footerEnabled, (v) => localStorage.setItem(STORAGE_PREFIX + 'footerEnabled', String(v)))
watch(cardCornerMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'cardCornerMode', v))
watch(titleFontMode, (v) => localStorage.setItem(STORAGE_PREFIX + 'titleFontMode', v))
watch(subheadingStyle, (v) => localStorage.setItem(STORAGE_PREFIX + 'subheadingStyle', v))
watch(titleColor, (v) => localStorage.setItem(STORAGE_PREFIX + 'titleColor', v))
watch(titleAlignment, (v) => localStorage.setItem(STORAGE_PREFIX + 'titleAlignment', v))
watch(titleCustomWeight, (v) => localStorage.setItem(STORAGE_PREFIX + 'titleCustomWeight', String(v)))
watch(titleCustomSpacing, (v) => localStorage.setItem(STORAGE_PREFIX + 'titleCustomSpacing', String(v)))

// ── Composable ───────────────────────────────────────────────────────────

export function useSettings(): {
  cardSize: typeof cardSize
  bodyFontSize: typeof bodyFontSize
  titleFontSize: typeof titleFontSize
  exportFormat: typeof exportFormat
  splitMode: typeof splitMode
  cardTheme: typeof cardTheme
  highlightStyle: typeof highlightStyle
  footerLeft: typeof footerLeft
  footerRightMode: typeof footerRightMode
  footerEnabled: typeof footerEnabled
  cardCornerMode: typeof cardCornerMode
  titleFontMode: typeof titleFontMode
  subheadingStyle: typeof subheadingStyle
  titleColor: typeof titleColor
  titleAlignment: typeof titleAlignment
  titleCustomWeight: typeof titleCustomWeight
  titleCustomSpacing: typeof titleCustomSpacing
} {
  return {
    cardSize,
    bodyFontSize,
    titleFontSize,
    exportFormat,
    splitMode,
    cardTheme,
    highlightStyle,
    footerLeft,
    footerRightMode,
    footerEnabled,
    cardCornerMode,
    titleFontMode,
    subheadingStyle,
    titleColor,
    titleAlignment,
    titleCustomWeight,
    titleCustomSpacing,
  }
}
