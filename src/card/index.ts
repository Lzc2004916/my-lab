// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 统一导出
// ═══════════════════════════════════════════════════════════════════════════

// 类型
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
  GradientConfig,
  InlineToken,
  InlineLine,
  ParagraphBlock,
  TextBlock,
  CodeBlock,
  TableDisplayBlock,
  ColumnContainerBlock,
  Block,
  HeadingLevel,
  TextRange,
  PosterMetrics,
  QuoteBoxMetrics,
  RenderOptions,
  LayoutOptions,
  BodyFontMode,
  SubheadingStyle,
  HighlightStyle,
  HighlightTreatment,
  QuoteTreatment,
  CardCornerMode,
  FooterRightMode,
} from './types'

export { BODY_FONT_MODES, DEFAULT_BODY_FONT_MODE, getBodyFontFamily } from './types'

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

// 颜色工具
export { hexToRgba, hexToRgb, mixHexColors, gradientAngleToPoints } from './color-utils'

// 设计令牌
export { extractTokens, applyTokensToElement, tokensToJSON, tokensFromJSON, TOKEN_CSS_VAR_MAP } from './design-tokens'
export type { CardDesignTokens } from './design-tokens'

// 主题
export { THEMES, DEFAULT_THEME_ID, getTheme } from './themes'

// 动态主题注册表
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

// 主题 JSON 配置
export {
  validateThemeConfig,
  loadThemeFromJSON,
  loadThemesFromJSON,
  themeToJSON,
} from './theme-config'
export type { ValidationResult, ThemeConfigJSON } from './theme-config'

// 引擎
export { renderAllPages, renderAllPagesAsync, canvasToPreviewUrl, canvasToExportUrl } from './engine'
export type { EngineOptions } from './engine'

// 布局
export { layoutPages, getParagraphBlock, parseInputBlocks } from './layout'

// 渲染器
export { renderCard } from './renderer'

// 块渲染器
export { drawCodeBlock, measureCodeBlock, tokenizeCode } from './code-renderer'
export { drawTableBlock, measureTableBlock } from './table-renderer'

// 测量
export {
  splitTextForWrapping,
  getBodyTokenWidth,
  wrapInlineTokensByWidth,
  parseInlineMarkdown,
  getPosterMetrics,
  getParagraphVisualHeight,
  getQuoteBoxMetrics,
  measureParagraphBlock,
  getParagraphMaxLines,
  getGapBetweenBlocks,
} from './measure'

// 组件 — 使用 src/components/CardPreview.vue 中的组件
// （从此模块导入）