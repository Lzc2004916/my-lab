// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 类型定义
// ═══════════════════════════════════════════════════════════════════════════

// ── Gradient config ─────────────────────────────────────────────────────

/** 渐变选择器和渲染器使用的渐变配置。 */
export interface GradientConfig {
  enabled: boolean
  color1: string
  color2: string
  /** 渐变角度（度，CSS 约定：0 = 下→上）。默认 135。 */
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
  /** 主页背景 */
  page: string
  /** 次要页面色调（渐变终点） */
  pageAlt: string
  /** 主文本颜色 */
  text: string
  /** 弱化/次要文本 */
  muted: string
  /** 强调色 / 品牌色 */
  accent: string
  /** 柔和强调色（用于底色） */
  accentSoft: string
  /** 边框 / 分隔线颜色 */
  border: string
  /** 阴影颜色 */
  shadow: string
  /** 发光 / 高亮底色 */
  glow: string
}

export interface ThemeSurface {
  /** 颗粒粒子不透明度（0-1） */
  grainAlpha: number
  /** 暗角边缘加深（0-1） */
  vignetteAlpha: number
  /** 氛围底色强度（0-1） */
  washStrength: number
  /** 内框描边透明度（0-1） */
  innerFrameAlpha: number
  /** 内框内缩距离（px） */
  innerFrameInset: number
  /** 标题强调色混合比例（0-1） */
  titleAccentMix: number
  /** 页脚水平分隔线不透明度（0-1） */
  footerLineAlpha: number
  /** 页脚文本不透明度（0-1） */
  footerTextAlpha: number
  /** CSS box-shadow for preview card */
  previewShadow: string
}

export interface ThemeComponents {
  /** 引用框背景填充不透明度 */
  quoteFillAlpha: number
  /** 引用框边框描边不透明度 */
  quoteStrokeAlpha: number
  /** 引用强调条不透明度 */
  quoteBarAlpha: number
  /** 引用框圆角半径 */
  quoteRadius: number
  /** 默认引用块视觉处理 */
  quoteTreatment: QuoteTreatment
  /** 默认高亮视觉处理 */
  highlightTreatment: HighlightTreatment
  /** 软下划线高亮不透明度 */
  highlightUnderlineAlpha: number
  /** 标记风格高亮不透明度 */
  highlightMarkerAlpha: number
  /** 虚线规则高亮不透明度 */
  highlightDashAlpha: number
}

// ── Heading typography (per-theme, per-level) ─────────────────────────────

/**
 * 每个标题级别的独立排版配置。
 * 所有字段均为可选 — 未指定时回退到全局默认值。
 */
export interface HeadingTypography {
  /** 标题级别缩放因子（相对于 bodySize）。默认回退到 HEADING_SIZE_RATIOS。 */
  h1Scale?: number
  h2Scale?: number
  h3Scale?: number
  h4Scale?: number
  h5Scale?: number
  h6Scale?: number

  /** 行高倍率。默认回退到级别相关的默认值（H1:1.25, H2:1.35, H3:1.45, 其他:1.55）。 */
  h1LineHeight?: number
  h2LineHeight?: number
  h3LineHeight?: number
  h4LineHeight?: number
  h5LineHeight?: number
  h6LineHeight?: number

  /** 段前间距（px）。 */
  h1MarginTop?: number
  h2MarginTop?: number
  h3MarginTop?: number

  /** 段后间距（px）。 */
  h1MarginBottom?: number
  h2MarginBottom?: number
  h3MarginBottom?: number

  /** 字体字重。默认回退到 SUBHEADING_TEXT_WEIGHT（600）。 */
  h1FontWeight?: number
  h2FontWeight?: number
  h3FontWeight?: number

  /** 颜色覆盖（使用主题调色板颜色）。 */
  h1Color?: string
  h2Color?: string
  h3Color?: string
  h4Color?: string
  h5Color?: string
  h6Color?: string

  /** 文本阴影颜色（CSS 颜色值）。null = 无阴影。应用为 "2px 2px 4px <color>"。 */
  h1Shadow?: string
  h2Shadow?: string
  h3Shadow?: string
  h4Shadow?: string
  h5Shadow?: string
  h6Shadow?: string

  /** 文本描边颜色（CSS 颜色值，用于 -webkit-text-stroke）。null = 无描边。 */
  h1Stroke?: string
  h2Stroke?: string
  h3Stroke?: string
  h4Stroke?: string
  h5Stroke?: string
  h6Stroke?: string

  /** 文本描边宽度（px）。默认：1.5。 */
  h1StrokeWidth?: number
  h2StrokeWidth?: number
  h3StrokeWidth?: number
  h4StrokeWidth?: number
  h5StrokeWidth?: number
  h6StrokeWidth?: number
}

/** 封面页（首张拆分卡片）特殊标题配置 — "大字报"效果。 */
export interface CoverHeadingConfig {
  /** 封面页 H1 缩放因子覆盖。默认：4.0× bodySize（非封面为 3.2×）。 */
  h1Scale?: number
  /** 封面页 H1 行高覆盖。 */
  h1LineHeight?: number
  /** 封面页标题是否居中。默认：false。 */
  centered?: boolean
  /** 封面页标题距内容区域顶部的额外偏移（px）。 */
  topOffset?: number
}

// ── List style config ────────────────────────────────────────────────────

/** 每个主题的列表样式配置。 */
export interface ListStyleConfig {
  /** 无序列表的项目符号字符。 */
  bulletChar: string
  /** 项目符号大小倍率（相对于 bodySize）。默认 0.85。 */
  bulletSizeRatio: number
  /** 每级缩进（px）。默认 28。 */
  indentPerLevel: number
  /** 列表项之间的额外间距（px）。默认 8。 */
  itemGap: number
  /** 有序列表编号是否使用圆角边框背景。默认 false。 */
  orderedMarkerBox?: boolean
  /** 有序列表编号是否保留后缀点号（如 "1." → "1"）。默认 true。 */
  orderedNumberDot?: boolean
}

/** 默认列表样式 — 当主题未显式配置时使用。 */
export const DEFAULT_LIST_STYLE: ListStyleConfig = {
  bulletChar: '•', // •
  bulletSizeRatio: 0.85,
  indentPerLevel: 28,
  itemGap: 8,
  orderedMarkerBox: false,
}

export interface ThemeEditor {
  /** 默认正文字体大小（px） */
  bodySize: number
  /** 默认行高倍率 */
  lineHeight: number
  /** 默认正文字体模式 — 主题的正文字体标识 */
  bodyFontMode?: BodyFontMode
  /** 默认正文文本字重（100-900，默认 400） */
  bodyFontWeight?: number
  /** 默认子标题视觉处理 */
  subheadingStyle?: SubheadingStyle
  /** 默认高亮样式 */
  highlightStyle: HighlightStyle
  /** 每个主题独立的标题排版配置 */
  heading?: HeadingTypography
  /** 每个主题独立的列表样式配置 */
  list?: ListStyleConfig
}

// ── Decor ornament system ──────────────────────────────────────────────────

export type DecorKind = 'none' | 'cornerBracket' | 'topRule' | 'watermark' | 'geometricPattern' | 'leafMotif' | 'circuitTrace' | 'goldFoil' | 'auroraGlow' | 'fanBurst' | 'macosWindow' | 'desertSun' | 'sakuraPetal' | 'coralBranch' | 'crystalFacet' | 'sketchHatch' | 'matchaRing' | 'sealStamp' | 'iosNotesNav'

export interface ThemeDecor {
  /** 渲染哪种装饰 */
  kind: DecorKind
  /** 不透明度倍率（0-1） */
  opacity: number
  /** 可选覆盖颜色（如果为空则使用主题强调色） */
  color?: string
  /** 缩放因子（1 = 默认） */
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
  /** 主题分类，用于选择器 UI 分组 */
  category?: 'light' | 'dark' | 'artistic' | 'professional'
  /** 装饰配置 */
  decor?: ThemeDecor
  /** 封面页（首张拆分卡片）H1 大字报效果配置。 */
  coverHeading?: CoverHeadingConfig
  /** 内置渐变颜色 — 同步到渐变选择器 */
  gradient?: {
    enabled: boolean
    color1: string
    color2: string
    /** 渐变角度（度，CSS 约定，135 = 左上 → 右下）。 */
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
  /** 正文字重 (100–900)，默认 undefined 表示使用主题默认值或 400。 */
  bodyFontWeight?: number
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

// ── List blocks ────────────────────────────────────────────────────────────

export type ListKind = 'orderedList' | 'unorderedList'

export interface ListItem {
  /** 列表项文本内容（保留内联 markdown 标记）。 */
  text: string
  /** 嵌套层级（0 = 顶层）。 */
  indent: number
}

export interface ListBlock {
  kind: ListKind
  items: ListItem[]
  /** 有序列表的起始编号（默认 1）。 */
  start?: number
}

export type Block =
  | TextBlock
  | CodeBlock
  | TableDisplayBlock
  | ColumnContainerBlock
  | ListBlock

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
  /** 可选背景渐变覆盖 */
  gradientConfig?: GradientConfig
  /** 用户自定义标题样式覆盖 */
  headingOverrides?: HeadingStyleOverrides | null
  /** 自定义高亮颜色（null = 使用主题强调色） */
  highlightColor?: string | null
}

// ── Layout options (passed to layoutPages) ────────────────────────────────

export interface LayoutOptions {
  source: string
  settings: TypographySettings
  theme: ThemeDefinition
  footerEnabled: boolean
  /** 用户自定义标题样式覆盖 */
  headingOverrides?: HeadingStyleOverrides | null
}

// ── Render constants ──────────────────────────────────────────────────────

/** 逻辑页面宽度（px，3:4 宽高比） */
export const PAGE_WIDTH = 720

/** 逻辑页面高度（px） */
export const PAGE_HEIGHT = 960

/**
 * 内容区域的左边距。
 * 推到 56px（每侧 7.8%），使文本在换行前紧贴卡片边缘 —
 * 最大化可用宽度，同时保留窄边距。
 */
export const CONTENT_LEFT = 40

/**
 * 内容区域的右边界。
 * 对称 40px 边距：720 − 40 = 680。
 */
export const CONTENT_RIGHT = 680

/** 可用内容宽度（640px ≈ PAGE_WIDTH 720 的 88.9%）。 */
export const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT

/** Retina 输出的设备像素缩放因子 */
export const CANVAS_SCALE = 2

/**
 * 启用页脚时正文区域底部 Y。
 * 推到 886 — 仅高于页脚分隔线（892）6px。
 * 每页的最后一个段落一直延伸到此边界
 * 以最大化内容密度。 layout engine splits it to the next page.
 */
export const BODY_BOTTOM_WITH_FOOTER = 886

/**
 * 禁用页脚时正文区域底部 Y。
 * 推到 940 — 高于 PAGE_HEIGHT（960）20px，
 * 保留最小底部呼吸空间，使文本完全填充卡片。
 */
export const BODY_BOTTOM_WITHOUT_FOOTER = 940

/** 页脚水平分隔线 Y 位置 */
export const FOOTER_LINE_Y = 892

/** 页脚文本基线 Y */
export const FOOTER_TEXT_Y = 918

/** 页脚线左边缘 X（与 CONTENT_LEFT 对齐）。 */
export const FOOTER_LINE_LEFT = 56

/** 页脚线右边缘 X（与 CONTENT_RIGHT 对齐）。 */
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

export type BodyFontMode =
  | 'wenkai' | 'yahei' | 'simsun' | 'kaiti' | 'dengxian' | 'fangsong'
  | 'simhei' | 'youyuan' | 'notosans' | 'notoserif'

export const BODY_FONT_MODES: Record<BodyFontMode, { family: string; label: string }> = {
  wenkai:    { family: '"LXGW WenKai","KaiTi","STKaiti",serif',                       label: '霞鹜文楷' },
  yahei:     { family: '"Microsoft YaHei","PingFang SC","Helvetica Neue",sans-serif', label: '微软雅黑' },
  simsun:    { family: '"SimSun","Songti SC","Noto Serif SC",serif',                  label: '宋体' },
  kaiti:     { family: '"KaiTi","STKaiti","LXGW WenKai",serif',                       label: '楷体' },
  dengxian:  { family: '"DengXian","PingFang SC","Microsoft YaHei",sans-serif',       label: '等线' },
  fangsong:  { family: '"FangSong","STFangsong","Noto Serif SC",serif',               label: '仿宋' },
  simhei:    { family: '"SimHei","PingFang SC","Microsoft YaHei",sans-serif',         label: '黑体' },
  youyuan:   { family: '"YouYuan","PingFang SC","Microsoft YaHei",sans-serif',        label: '幼圆' },
  notosans:  { family: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',   label: '思源黑体' },
  notoserif: { family: '"Noto Serif SC","Songti SC","SimSun",serif',                  label: '思源宋体' },
}

export const DEFAULT_BODY_FONT_MODE: BodyFontMode = 'wenkai'

/** 将正文字体模式解析为 CSS font-family 字符串。 */
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

/** 代码字体大小相对于 bodySize */
export const CODE_FONT_SIZE_RATIO = 0.92

/** 代码块背景填充透明度 */
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

/** 默认标题行高倍率（按级别）。 */
export const DEFAULT_HEADING_LINE_HEIGHTS: Record<number, number> = {
  1: 1.25,
  2: 1.35,
  3: 1.45,
  4: 1.55,
  5: 1.55,
  6: 1.55,
}

/** 默认标题段前间距（px）。 */
export const DEFAULT_HEADING_MARGIN_TOP: Record<number, number> = {
  1: 16,
  2: 12,
  3: 8,
  4: 6,
  5: 4,
  6: 4,
}

/** 默认标题段后间距（px）。 */
export const DEFAULT_HEADING_MARGIN_BOTTOM: Record<number, number> = {
  1: 8,
  2: 6,
  3: 4,
  4: 3,
  5: 2,
  6: 2,
}

/**
 * 动态计算标题底部外边距（标题→下级内容间距）。
 * H1 公式：fontSize × 0.45，字号 ≥ 60px 保底 30px。
 * 从 ~67px 起等比持续放大，100px→45px，120px→54px，不封顶。
 * H2-H6 公式：fontSize × 0.35，保底 14px。
 */
export function computeHeadingMarginBottom(fontSize: number, level: number): number {
  if (level === 1) {
    const margin = Math.round(fontSize * 0.45)
    return fontSize >= 60 ? Math.max(30, margin) : Math.max(14, margin)
  }
  return Math.max(14, Math.round(fontSize * 0.35))
}

/**
 * 动态计算标题顶部外边距（上级内容→标题间距）。
 * 公式：fontSize × 0.3，最小 16px。
 */
export function computeHeadingMarginTop(fontSize: number): number {
  return Math.max(16, Math.round(fontSize * 0.3))
}

/** 封面页 H1 默认放大因子（相对于 bodySize）。 */
export const DEFAULT_COVER_H1_SCALE = 4.0

// ── User heading style overrides ────────────────────────────────────────────

/**
 * 用户自定义的标题样式覆盖。
 * 所有字段均为可选 — null 表示使用主题默认值。
 */
export interface HeadingStyleOverrides {
  /** H1-H6 字体大小覆盖（px）。null = 使用主题默认值。 */
  h1Size: number | null
  h2Size: number | null
  h3Size: number | null
  h4Size: number | null
  h5Size: number | null
  h6Size: number | null
  /** H1 文本对齐方式。 */
  h1Align: 'left' | 'center' | 'right'
  /** H1-H6 字体颜色覆盖（CSS 颜色值）。null = 使用主题默认颜色。 */
  h1Color: string | null
  h2Color: string | null
  h3Color: string | null
  h4Color: string | null
  h5Color: string | null
  h6Color: string | null
  /** H1-H6 文本描边颜色覆盖（CSS 颜色值）。null = 无描边。 */
  h1Stroke: string | null
  h2Stroke: string | null
  h3Stroke: string | null
  h4Stroke: string | null
  h5Stroke: string | null
  h6Stroke: string | null
  /** H1-H6 文本描边宽度覆盖（px）。null = 使用默认 1.5px。 */
  h1StrokeWidth: number | null
  h2StrokeWidth: number | null
  h3StrokeWidth: number | null
  h4StrokeWidth: number | null
  h5StrokeWidth: number | null
  h6StrokeWidth: number | null
}

/** 默认标题覆盖值 — 全部使用主题默认。 */
export const DEFAULT_HEADING_OVERRIDES: HeadingStyleOverrides = {
  h1Size: null,
  h2Size: null,
  h3Size: null,
  h4Size: null,
  h5Size: null,
  h6Size: null,
  h1Align: 'left',
  h1Color: null,
  h2Color: null,
  h3Color: null,
  h4Color: null,
  h5Color: null,
  h6Color: null,
  h1Stroke: null,
  h2Stroke: null,
  h3Stroke: null,
  h4Stroke: null,
  h5Stroke: null,
  h6Stroke: null,
  h1StrokeWidth: null,
  h2StrokeWidth: null,
  h3StrokeWidth: null,
  h4StrokeWidth: null,
  h5StrokeWidth: null,
  h6StrokeWidth: null,
}

/** 预定义的 H1-H6 字体大小范围（px）。 */
export const HEADING_SIZE_RANGES: Record<number, { min: number; max: number; default: number }> = {
  1: { min: 16, max: 120, default: 32 },
  2: { min: 14, max: 60, default: 24 },
  3: { min: 12, max: 60, default: 20 },
  4: { min: 11, max: 60, default: 18 },
  5: { min: 10, max: 60, default: 16 },
  6: { min: 9,  max: 60, default: 15 },
}

/**
 * 解析指定级别的标题字体大小（px）。
 * 优先级：用户覆盖 → 主题 heading 配置 → HEADING_SIZE_RATIOS × bodySize。
 */
export function resolveHeadingSize(
  level: number,
  bodySize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme?: any,
  overrides?: HeadingStyleOverrides | null,
  isCover?: boolean,
): number {
  // 1. 用户覆盖优先
  if (overrides) {
    const key = `h${level}Size` as keyof HeadingStyleOverrides
    const val = overrides[key]
    if (typeof val === 'number' && val > 0) return val
  }
  // 2. 回退到主题默认比例计算
  const scale = resolveHeadingScale(level, theme, isCover && level === 1)
  return Math.round(bodySize * scale)
}

/**
 * 从主题配置中解析指定级别的标题缩放因子。
 * 优先级：主题 heading 覆盖 → HEADING_SIZE_RATIOS。
 */
export function resolveHeadingScale(level: number, theme?: { editor?: { heading?: { h1Scale?: number; h2Scale?: number; h3Scale?: number; h4Scale?: number; h5Scale?: number; h6Scale?: number } } }, isCover = false): number {
  const headingCfg = theme?.editor?.heading
  const key = `h${level}Scale` as keyof typeof headingCfg
  if (headingCfg && headingCfg[key] !== undefined) {
    return headingCfg[key] as number
  }
  if (level === 1 && isCover) return DEFAULT_COVER_H1_SCALE
  return HEADING_SIZE_RATIOS[level] ?? 1
}

/**
 * 从主题配置中解析指定级别的标题行高。
 * 优先级：主题 heading 覆盖 → DEFAULT_HEADING_LINE_HEIGHTS。
 */
export function resolveHeadingLineHeight(level: number, theme?: { editor?: { heading?: { h1LineHeight?: number; h2LineHeight?: number; h3LineHeight?: number; h4LineHeight?: number; h5LineHeight?: number; h6LineHeight?: number } } }, isCover = false): number {
  const headingCfg = theme?.editor?.heading
  const key = `h${level}LineHeight` as keyof typeof headingCfg
  if (headingCfg && headingCfg[key] !== undefined) {
    return headingCfg[key] as number
  }
  if (level === 1 && isCover) return 1.15 // 大字报用更紧凑的行高
  return DEFAULT_HEADING_LINE_HEIGHTS[level] ?? 1.55
}

/**
 * 从主题配置中解析指定级别的标题段前间距（px）。
 */
export function resolveHeadingMarginTop(level: number, theme?: { editor?: { heading?: { h1MarginTop?: number; h2MarginTop?: number; h3MarginTop?: number } } }): number {
  const headingCfg = theme?.editor?.heading
  const key = `h${level}MarginTop` as keyof typeof headingCfg
  if (headingCfg && headingCfg[key] !== undefined) {
    return headingCfg[key] as number
  }
  return DEFAULT_HEADING_MARGIN_TOP[level] ?? 4
}

/**
 * 从主题配置中解析指定级别的标题段后间距（px）。
 */
export function resolveHeadingMarginBottom(level: number, theme?: { editor?: { heading?: { h1MarginBottom?: number; h2MarginBottom?: number; h3MarginBottom?: number } } }): number {
  const headingCfg = theme?.editor?.heading
  const key = `h${level}MarginBottom` as keyof typeof headingCfg
  if (headingCfg && headingCfg[key] !== undefined) {
    return headingCfg[key] as number
  }
  return DEFAULT_HEADING_MARGIN_BOTTOM[level] ?? 2
}

/**
 * 从主题配置中解析指定级别的标题字重。
 */
export function resolveHeadingFontWeight(level: number, theme?: { editor?: { heading?: { h1FontWeight?: number; h2FontWeight?: number; h3FontWeight?: number } } }): number {
  const headingCfg = theme?.editor?.heading
  const key = `h${level}FontWeight` as keyof typeof headingCfg
  if (headingCfg && headingCfg[key] !== undefined) {
    return headingCfg[key] as number
  }
  return SUBHEADING_TEXT_WEIGHT
}

/**
 * 从用户覆盖和主题配置中解析指定级别的标题颜色。
 * 优先级：用户覆盖 > 主题 heading 颜色覆盖 → undefined（让调用方使用调色板颜色）。
 */
export function resolveHeadingColor(
  level: number,
  theme?: { editor?: { heading?: HeadingTypography } },
  overrides?: HeadingStyleOverrides | null,
): string | undefined {
  // 1. 用户覆盖优先
  if (overrides) {
    const overrideKey = `h${level}Color` as keyof HeadingStyleOverrides
    const val = overrides[overrideKey]
    if (typeof val === 'string' && val.length > 0) return val
  }
  // 2. 回退到主题 heading 配置
  const headingCfg = theme?.editor?.heading
  const cfgKey = `h${level}Color` as keyof HeadingTypography
  if (headingCfg && typeof headingCfg[cfgKey] === 'string' && (headingCfg[cfgKey] as string).length > 0) {
    return headingCfg[cfgKey] as string
  }
  return undefined
}

/**
 * 从用户覆盖和主题配置中解析指定级别的标题阴影颜色。
 * 优先级：用户覆盖 → 主题 heading 配置 → undefined（无阴影）。
 * @returns CSS 颜色值，或 undefined（无阴影）。
 */
export function resolveHeadingShadow(
  level: number,
  theme?: { editor?: { heading?: HeadingTypography } },
  overrides?: HeadingStyleOverrides | null,
): string | undefined {
  // 1. 用户覆盖优先
  if (overrides) {
    const key = `h${level}Shadow` as keyof HeadingStyleOverrides
    const val = overrides[key]
    if (typeof val === 'string' && val.length > 0) return val
  }
  // 2. 回退到主题 heading 配置
  const headingCfg = theme?.editor?.heading
  const cfgKey = `h${level}Shadow` as keyof HeadingTypography
  if (headingCfg && typeof headingCfg[cfgKey] === 'string' && (headingCfg[cfgKey] as string).length > 0) {
    return headingCfg[cfgKey] as string
  }
  return undefined
}

/**
 * 从用户覆盖和主题配置中解析指定级别的标题描边颜色。
 * 优先级：用户覆盖 → 主题 heading 配置 → undefined（无描边）。
 * @returns CSS 颜色值，或 undefined（无描边）。
 */
export function resolveHeadingStroke(
  level: number,
  theme?: { editor?: { heading?: HeadingTypography } },
  overrides?: HeadingStyleOverrides | null,
): string | undefined {
  // 1. 用户覆盖优先
  if (overrides) {
    const key = `h${level}Stroke` as keyof HeadingStyleOverrides
    const val = overrides[key]
    if (typeof val === 'string' && val.length > 0) return val
  }
  // 2. 回退到主题 heading 配置
  const headingCfg = theme?.editor?.heading
  const cfgKey = `h${level}Stroke` as keyof HeadingTypography
  if (headingCfg && typeof headingCfg[cfgKey] === 'string' && (headingCfg[cfgKey] as string).length > 0) {
    return headingCfg[cfgKey] as string
  }
  return undefined
}

/** 默认文本描边宽度（px），当设置了描边颜色但未指定宽度时使用。 */
export const DEFAULT_STROKE_WIDTH = 1

/**
 * 从用户覆盖和主题配置中解析指定级别的标题描边宽度（px）。
 * 优先级：用户覆盖 → 主题 heading 配置 → DEFAULT_STROKE_WIDTH。
 */
export function resolveHeadingStrokeWidth(
  level: number,
  theme?: { editor?: { heading?: HeadingTypography } },
  overrides?: HeadingStyleOverrides | null,
): number {
  // 1. 用户覆盖优先
  if (overrides) {
    const key = `h${level}StrokeWidth` as keyof HeadingStyleOverrides
    const val = overrides[key]
    if (typeof val === 'number' && val > 0) return val
  }
  // 2. 回退到主题 heading 配置
  const headingCfg = theme?.editor?.heading
  const cfgKey = `h${level}StrokeWidth` as keyof HeadingTypography
  if (headingCfg && typeof headingCfg[cfgKey] === 'number' && (headingCfg[cfgKey] as number) > 0) {
    return headingCfg[cfgKey] as number
  }
  return DEFAULT_STROKE_WIDTH
}

// ── Column layout ─────────────────────────────────────────────────────

/** 左右列之间的间距（px） */
export const COLUMN_GAP = 20