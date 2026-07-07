// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — barrel export
// ═══════════════════════════════════════════════════════════════════════════

// Types
export type {
  ThemeDefinition,
  ThemePalette,
  ThemeSurface,
  ThemeComponents,
  ThemeEditor,
  ThemeMode,
  CardPage,
  TypographySettings,
  TitleAlignment,
  TitleCustomization,
  InlineToken,
  InlineLine,
  ParagraphBlock,
  TextRange,
  PosterMetrics,
  QuoteBoxMetrics,
  RenderOptions,
  LayoutOptions,
  TitleFontMode,
  SubheadingStyle,
  HighlightStyle,
  HighlightTreatment,
  QuoteTreatment,
  CardCornerMode,
  FooterRightMode,
} from './types'

export { DEFAULT_TITLE_CUSTOM } from './types'

export {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  CONTENT_LEFT,
  CONTENT_RIGHT,
  CONTENT_WIDTH,
  CANVAS_SCALE,
} from './types'

// Themes
export { THEMES, DEFAULT_THEME_ID, getTheme } from './themes'

// Engine
export { renderAllPages, canvasToPreviewUrl, canvasToExportUrl } from './engine'
export type { EngineOptions } from './engine'

// Layout
export { layoutPages, getParagraphBlock } from './layout'

// Renderer
export { renderCard } from './renderer'

// Measure
export {
  splitTextForWrapping,
  getBodyTokenWidth,
  wrapInlineTokensByWidth,
  parseInlineMarkdown,
  measureTitleText,
  fitTitleLines,
  parseTitleMarkup,
  getPosterMetrics,
  getParagraphVisualHeight,
  getQuoteBoxMetrics,
  measureParagraphBlock,
  getParagraphMaxLines,
  getGapBetweenBlocks,
} from './measure'

// Component — use the one in src/components/CardPreview.vue
// (imports from this module)
