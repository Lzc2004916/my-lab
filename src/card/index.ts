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
  ThemeDecor,
  DecorKind,
  CardPage,
  TypographySettings,
  TitleAlignment,
  TitleCustomization,
  GradientConfig,
  InlineToken,
  InlineLine,
  ParagraphBlock,
  TextBlock,
  CodeBlock,
  MathDisplayBlock,
  MermaidDisplayBlock,
  TableDisplayBlock,
  ColumnContainerBlock,
  Block,
  HeadingLevel,
  TextRange,
  PosterMetrics,
  QuoteBoxMetrics,
  RenderOptions,
  LayoutOptions,
  TitleFontMode,
  BodyFontMode,
  SubheadingStyle,
  HighlightStyle,
  HighlightTreatment,
  QuoteTreatment,
  CardCornerMode,
  FooterRightMode,
} from './types'

export { DEFAULT_TITLE_CUSTOM, BODY_FONT_MODES, DEFAULT_BODY_FONT_MODE, getBodyFontFamily } from './types'

export {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  CONTENT_LEFT,
  CONTENT_RIGHT,
  CONTENT_WIDTH,
  CANVAS_SCALE,
  CODE_FONT_FAMILY,
  CODE_FONT_SIZE_RATIO,
  CODE_BG_ALPHA,
  HEADING_SIZE_RATIOS,
  COLUMN_GAP,
} from './types'

// Color utilities
export { hexToRgba, hexToRgb, mixHexColors, gradientAngleToPoints } from './color-utils'

// Design tokens
export { extractTokens, applyTokensToElement, tokensToJSON, tokensFromJSON, TOKEN_CSS_VAR_MAP } from './design-tokens'
export type { CardDesignTokens } from './design-tokens'

// Themes
export { THEMES, DEFAULT_THEME_ID, getTheme } from './themes'

// Dynamic theme registry
export {
  registerTheme,
  unregisterTheme,
  getTheme as getThemeFromRegistry,
  getAllThemes,
  hasTheme,
  getThemeCount,
  onRegistryChange,
  resetRegistry,
} from './theme-registry'

// Theme JSON config
export {
  validateThemeConfig,
  loadThemeFromJSON,
  loadThemesFromJSON,
  themeToJSON,
} from './theme-config'
export type { ValidationResult, ThemeConfigJSON } from './theme-config'

// Engine
export { renderAllPages, renderAllPagesAsync, canvasToPreviewUrl, canvasToExportUrl } from './engine'
export type { EngineOptions } from './engine'

// Layout
export { layoutPages, getParagraphBlock } from './layout'

// Renderer
export { renderCard } from './renderer'

// Block renderers
export { drawCodeBlock, measureCodeBlock, tokenizeCode } from './code-renderer'
export { drawTableBlock, measureTableBlock } from './table-renderer'
export { drawMathBlock, measureMathBlock } from './math-renderer'
export { drawMermaidBlock, renderMermaid } from './mermaid'

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
