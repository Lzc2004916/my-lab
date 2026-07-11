// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — type definitions
// ═══════════════════════════════════════════════════════════════════════════

// ── Gradient config ─────────────────────────────────────────────────────

/** Gradient configuration used by the gradient picker and renderer. */
export interface GradientConfig {
  enabled: boolean
  color1: string
  color2: string
  /** Gradient angle in degrees (CSS convention: 0 = bottom→top). Default 135. */
  angle: number
}

// ── Theme mode ────────────────────────────────────────────────────────────

export type ThemeMode = 'paper' | 'sage' | 'vintage' | 'obsidian' | 'archive' | 'swiss' | 'cyber' | 'glass' | 'brutal' | 'luxe' | 'frost'

// ── Subheading style ──────────────────────────────────────────────────────

export type SubheadingStyle = 'large' | 'accent'

// ── Highlight style / treatment ───────────────────────────────────────────

export type HighlightStyle = 'underline' | 'border' | 'highlight'

export type HighlightTreatment =
  | 'softUnderline'
  | 'swissRule'
  | 'boldAccent'

// ── Quote treatment ───────────────────────────────────────────────────────

export type QuoteTreatment = 'paper' | 'callout' | 'code'

// ── Card corner mode ──────────────────────────────────────────────────────

export type CardCornerMode = 'rounded' | 'square'

// ── Footer right mode ─────────────────────────────────────────────────────

export type FooterRightMode = 'blank' | 'page' | 'date'

// ── Theme definition ──────────────────────────────────────────────────────

export interface ThemePalette {
  /** Main page background */
  page: string
  /** Secondary page tint (gradient stop) */
  pageAlt: string
  /** Primary text color */
  text: string
  /** Muted/secondary text */
  muted: string
  /** Accent / brand color */
  accent: string
  /** Soft accent for washes */
  accentSoft: string
  /** Border / divider color */
  border: string
  /** Shadow color */
  shadow: string
  /** Glow / highlight wash */
  glow: string
}

export interface ThemeSurface {
  /** Grain particle opacity (0-1) */
  grainAlpha: number
  /** Vignette edge darkening (0-1) */
  vignetteAlpha: number
  /** Atmosphere wash intensity (0-1) */
  washStrength: number
  /** Inner frame stroke opacity (0-1) */
  innerFrameAlpha: number
  /** Inner frame inset distance (px) */
  innerFrameInset: number
  /** Title accent color mix ratio (0-1) */
  titleAccentMix: number
  /** Footer horizontal rule opacity (0-1) */
  footerLineAlpha: number
  /** Footer text opacity (0-1) */
  footerTextAlpha: number
  /** CSS box-shadow for preview card */
  previewShadow: string
}

export interface ThemeComponents {
  /** Quote box background fill opacity */
  quoteFillAlpha: number
  /** Quote box border stroke opacity */
  quoteStrokeAlpha: number
  /** Quote accent bar opacity */
  quoteBarAlpha: number
  /** Quote box corner radius */
  quoteRadius: number
  /** Default quote visual treatment */
  quoteTreatment: QuoteTreatment
  /** Default highlight visual treatment */
  highlightTreatment: HighlightTreatment
  /** Soft-underline highlight opacity */
  highlightUnderlineAlpha: number
  /** Marker-style highlight opacity */
  highlightMarkerAlpha: number
  /** Dashed-rule highlight opacity */
  highlightDashAlpha: number
}

export interface ThemeEditor {
  /** Default body font size (px) */
  bodySize: number
  /** Default line-height multiplier */
  lineHeight: number
  /** Default body font mode — theme's typographic identity for body text */
  bodyFontMode?: BodyFontMode
  /** Default subheading visual treatment */
  subheadingStyle?: SubheadingStyle
  /** Default highlight style */
  highlightStyle: HighlightStyle
}

// ── Decor ornament system ──────────────────────────────────────────────────

export type DecorKind = 'none' | 'cornerBracket' | 'topRule' | 'watermark' | 'geometricPattern' | 'leafMotif' | 'circuitTrace' | 'goldFoil' | 'auroraGlow' | 'fanBurst'

export interface ThemeDecor {
  /** Which ornament to render */
  kind: DecorKind
  /** Opacity multiplier (0-1) */
  opacity: number
  /** Optional override color (uses theme accent if empty) */
  color?: string
  /** Scale factor (1 = default) */
  scale?: number
}

export interface ThemeDefinition {
  id: string
  name: string
  mood: string
  preset: string
  description: string
  tags: string[]
  mode: ThemeMode
  palette: ThemePalette
  surface: ThemeSurface
  components: ThemeComponents
  editor: ThemeEditor
  /** Theme category for grouping in the selector UI */
  category?: 'light' | 'dark' | 'artistic' | 'professional'
  /** Decorative ornament configuration */
  decor?: ThemeDecor
  /** Built-in gradient colors — syncs to the gradient picker */
  gradient?: {
    enabled: boolean
    color1: string
    color2: string
    /** Gradient angle in degrees (CSS convention, 135 = top-left → bottom-right). */
    angle?: number
  }
}

// ── Card page ─────────────────────────────────────────────────────────────

export interface CardPage {
  id: string
  kind: 'cover' | 'body'
  title: string
  blocks: Block[]
}

// ── Typography settings ───────────────────────────────────────────────────

export interface TypographySettings {
  bodySize: number
  lineHeight: number
  bodyFontMode: BodyFontMode
  subheadingStyle: SubheadingStyle
}

// ── Inline token (parsed from markdown) ───────────────────────────────────

export interface InlineToken {
  text: string
  bold: boolean
  italic: boolean
  mark: boolean
  underline: boolean
}

// ── Inline line (one wrapped line of tokens) ──────────────────────────────

export interface InlineLine {
  tokens: InlineToken[]
}

// ── Paragraph block (classified markdown block) ───────────────────────────

export interface ParagraphBlock {
  kind: 'body' | 'quote' | 'subheading' | 'divider'
  raw: string
}

// ── Heading level ──────────────────────────────────────────────────────

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

// ── Block discriminated union ──────────────────────────────────────────

export interface TextBlock {
  kind: 'body' | 'quote' | 'subheading' | 'divider'
  raw: string
  headingLevel?: HeadingLevel  // set for 'subheading'
}

export interface CodeBlock {
  kind: 'code'
  language: string       // '' if unspecified, e.g. 'javascript', 'python'
  code: string           // raw source without fences
  lineCount?: number
}

export interface TableDisplayBlock {
  kind: 'table'
  headers: string[]
  alignments: ('left' | 'center' | 'right')[]
  rows: string[][]
  colWidths?: number[]
  rowHeights?: number[]
  totalWidth?: number
}

export interface ColumnContainerBlock {
  kind: 'columnContainer'
  leftBlocks: Block[]
  rightBlocks: Block[]
  totalHeight?: number
}

export type Block =
  | TextBlock
  | CodeBlock
  | TableDisplayBlock
  | ColumnContainerBlock

// ── Text range ───────────────────────────────────────────────────

export interface TextRange {
  start: number
  end: number
}

// ── Poster metrics (computed layout values for one page) ──────────────────

export interface PosterMetrics {
  bodySize: number
  bodyLineHeight: number
  bodyParagraphGap: number
  bodyFontFamily: string
  separatorY: number
  bodyTopY: number
  bodyBottomY: number
  bodyWidth: number
}

// ── Quote box metrics (computed layout for quote blocks) ──────────────────

export interface QuoteBoxMetrics {
  textInset: number
  textWidth: number
  paddingTop: number
  paddingBottom: number
  boxOffsetX: number
  boxWidthOffset: number
  barOffsetX: number
  barTopInset: number
  barBottomInset: number
  barWidth: number
  barRadius: number
}

// ── Render options (passed to renderCard) ─────────────────────────────────

export interface RenderOptions {
  page: CardPage
  theme: ThemeDefinition
  settings: TypographySettings
  highlightStyle: HighlightStyle
  pageIndex: number
  totalPages: number
  footerLeft: string
  footerRightMode: FooterRightMode
  footerEnabled: boolean
  cardCornerMode: CardCornerMode
  /** Optional background gradient override */
  gradientConfig?: GradientConfig
}

// ── Layout options (passed to layoutPages) ────────────────────────────────

export interface LayoutOptions {
  source: string
  settings: TypographySettings
  theme: ThemeDefinition
  footerEnabled: boolean
}

// ── Render constants ──────────────────────────────────────────────────────

/** Logical page width in px (3:4 aspect ratio) */
export const PAGE_WIDTH = 720

/** Logical page height in px */
export const PAGE_HEIGHT = 960

/**
 * Left margin for content area.
 * Pushed to 56px (7.8% per side) so text runs close to the card edge
 * before wrapping — maximizes usable width while keeping a slim gutter.
 */
export const CONTENT_LEFT = 56

/**
 * Right boundary for content area.
 * Symmetric 56px margin: 720 − 56 = 664.
 */
export const CONTENT_RIGHT = 664

/** Usable content width (608px ≈ 84.4% of PAGE_WIDTH 720). */
export const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT

/** Device-pixel scale factor for retina output */
export const CANVAS_SCALE = 2

/**
 * Body area bottom Y when footer is enabled.
 * Pushed to 886 — only 6 px above the footer rule (892).
 * Every last paragraph on a page runs right up to this boundary
 * before the layout engine splits it to the next page.
 */
export const BODY_BOTTOM_WITH_FOOTER = 886

/**
 * Body area bottom Y when footer is disabled.
 * Pushed to 940 — 20 px above PAGE_HEIGHT (960), leaving
 * minimal bottom breathing room so text fills the card fully.
 */
export const BODY_BOTTOM_WITHOUT_FOOTER = 940

/** Footer horizontal rule Y position */
export const FOOTER_LINE_Y = 892

/** Footer text baseline Y */
export const FOOTER_TEXT_Y = 918

/** Footer line left edge X (aligns with CONTENT_LEFT). */
export const FOOTER_LINE_LEFT = 56

/** Footer line right edge X (aligns with CONTENT_RIGHT). */
export const FOOTER_LINE_RIGHT = 664

// ── Font weight constants ─────────────────────────────────────────────────

export const BODY_TEXT_WEIGHT = 400
export const BODY_BOLD_WEIGHT = 600
export const QUOTE_TEXT_WEIGHT = 400
export const SUBHEADING_TEXT_WEIGHT = 600

// ── Font family constants ─────────────────────────────────────────────────

export const BODY_FONT_FAMILY =
  '"LXGW WenKai","Noto Serif SC","Songti SC","SimSun",serif'

// ── Body font modes ─────────────────────────────────────────────────────

export type BodyFontMode = 'wenkai' | 'yahei' | 'simsun' | 'kaiti' | 'dengxian' | 'fangsong'

export const BODY_FONT_MODES: Record<BodyFontMode, { family: string; label: string }> = {
  wenkai:   { family: '"LXGW WenKai","KaiTi","STKaiti",serif',                       label: '霞鹜文楷' },
  yahei:    { family: '"Microsoft YaHei","PingFang SC","Helvetica Neue",sans-serif', label: '微软雅黑' },
  simsun:   { family: '"SimSun","Songti SC","Noto Serif SC",serif',                  label: '宋体' },
  kaiti:    { family: '"KaiTi","STKaiti","LXGW WenKai",serif',                       label: '楷体' },
  dengxian: { family: '"DengXian","PingFang SC","Microsoft YaHei",sans-serif',       label: '等线' },
  fangsong: { family: '"FangSong","STFangsong","Noto Serif SC",serif',               label: '仿宋' },
}

export const DEFAULT_BODY_FONT_MODE: BodyFontMode = 'wenkai'

/** Resolve a body font mode to its CSS font-family string. */
export function getBodyFontFamily(mode: BodyFontMode): string {
  return BODY_FONT_MODES[mode]?.family ?? BODY_FONT_MODES[DEFAULT_BODY_FONT_MODE].family
}

export const FOOTER_FONT_FAMILY =
  '"LXGW WenKai","Noto Serif SC","PingFang SC","Microsoft YaHei",sans-serif'

// ── Leading punctuation (should not appear at line start) ─────────────────

export const LEADING_PUNCTUATION = new Set([
  '，', '。', '！', '？', '；', '：', '」', '』', '）', '》', '、',
  ',', '.', '!', '?', ';', ':', ')', ']', '}',
])

// ── Code block constants ──────────────────────────────────────────────

export const CODE_FONT_FAMILY =
  '"JetBrains Mono","Cascadia Code","SF Mono","Fira Code","Consolas",monospace'

/** Code font size relative to bodySize */
export const CODE_FONT_SIZE_RATIO = 0.92

/** Code block background fill alpha */
export const CODE_BG_ALPHA = 0.06

// ── Heading size ratios (relative to bodySize) ────────────────────────

export const HEADING_SIZE_RATIOS: Record<number, number> = {
  1: 3.20,
  2: 1.65,
  3: 1.35,
  4: 1.15,
  5: 1.04,
  6: 0.98,
}

// ── Column layout ─────────────────────────────────────────────────────

/** Gap between left and right columns in px */
export const COLUMN_GAP = 20
