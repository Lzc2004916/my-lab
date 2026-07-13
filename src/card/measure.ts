// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — Canvas 文本测量工具
// ═══════════════════════════════════════════════════════════════════════════

import type {
  InlineToken,
  InlineLine,
  ParagraphBlock,
  PosterMetrics,
  QuoteBoxMetrics,
  ThemeDefinition,
  SubheadingStyle,
  TypographySettings,
  CardPage,
} from './types'
import {
  BODY_TEXT_WEIGHT,
  BODY_BOLD_WEIGHT,
  BODY_FONT_FAMILY,
  LEADING_PUNCTUATION,
  CONTENT_WIDTH,
  BODY_BOTTOM_WITH_FOOTER,
  BODY_BOTTOM_WITHOUT_FOOTER,
  getBodyFontFamily,
  resolveHeadingLineHeight,
  resolveHeadingSize,
} from './types'
import type { HeadingStyleOverrides } from './types'

// ═══════════════════════════════════════════════════════════════════════════
// 底层文本测量
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 单例测量上下文 — 重用于所有文本测量。
 * 避免每次渲染创建/销毁数百个 canvas 元素。
 */
let _measureCtx: CanvasRenderingContext2D | null = null
let _measureCtxFont = ''

function getMeasureCtx(font: string): CanvasRenderingContext2D {
  if (_measureCtx && _measureCtxFont === font) {
    return _measureCtx
  }
  if (!_measureCtx) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to create measure canvas')
    _measureCtx = ctx
  }
  _measureCtx.font = font
  _measureCtxFont = font
  return _measureCtx
}

// ═══════════════════════════════════════════════════════════════════════════
// 内联 markdown 解析 + 换行缓存（基于 Map 的简单 LRU，通过上限控制）
// ═══════════════════════════════════════════════════════════════════════════

const MAX_CACHE_SIZE = 256

/** parseInlineMarkdown 结果的缓存。以原始文本字符串为键。 */
const _parseCache = new Map<string, InlineToken[]>()

/** wrapInlineTokensByWidth 结果的缓存。以复合键字符串为键。 */
const _wrapCache = new Map<string, InlineLine[]>()

/** 将文本分割为 CJK 字符、拉丁语段、空白和换行符。 */
export function splitTextForWrapping(text: string): string[] {
  return (
    text.match(/[A-Za-z0-9]+(?:[._'’&/+:-][A-Za-z0-9]+)*|[ \t]+|\n|./gu) ?? []
  )
}

/** 将内联 token 拆分为每个字符的换行单元。 */
function explodeInlineTokens(tokens: InlineToken[]): InlineToken[] {
  return tokens.flatMap((token) =>
    splitTextForWrapping(token.text).map((unit) => ({
      text: unit,
      bold: token.bold,
      italic: token.italic,
      mark: token.mark,
      underline: token.underline,
    })),
  )
}

/** 测量单个正文 token 的 canvas 宽度。 */
export function getBodyTokenWidth(token: InlineToken, fontSize: number, fontFamily?: string, bodyFontWeight?: number): number {
  if (token.text === '\n') return 0
  const baseWeight = bodyFontWeight ?? BODY_TEXT_WEIGHT
  const weight = token.bold ? BODY_BOLD_WEIGHT : baseWeight
  const family = fontFamily ?? BODY_FONT_FAMILY
  const font = `${weight} ${fontSize}px ${family}`
  return getMeasureCtx(font).measureText(token.text).width
}

function isWhitespaceToken(text: string): boolean {
  return /^[ \t]+$/.test(text)
}

function isLeadingPunctuation(text: string): boolean {
  return LEADING_PUNCTUATION.has(text)
}

/** 将超大的换行单元分割为单个字符。 */
function splitOversizedUnit(
  token: InlineToken,
  fontSize: number,
  maxWidth: number,
  fontFamily?: string,
  bodyFontWeight?: number,
): InlineToken[] {
  if (token.text.length <= 1 || getBodyTokenWidth(token, fontSize, fontFamily, bodyFontWeight) <= maxWidth)
    return [token]
  return Array.from(token.text).map((char) => ({ ...token, text: char }))
}

/**
 * 为换行缓存构建复合缓存键。
 * Token 标识对于 Map 直接键控过于复杂，因此从序列化的
 * token 文本 + 布局参数中派生一个紧凑的键。
 */
function wrapCacheKey(tokens: InlineToken[], fontSize: number, maxWidth: number, fontFamily?: string, bodyFontWeight?: number): string {
  // 使用首尾 token 文本 + 总数作为轻量指纹
  const first = tokens.length > 0 ? tokens[0]!.text : ''
  const last = tokens.length > 0 ? tokens[tokens.length - 1]!.text : ''
  return `${tokens.length}:${first}:${last}:${fontSize}:${Math.round(maxWidth)}:${fontFamily ?? ''}:${bodyFontWeight ?? BODY_TEXT_WEIGHT}`
}

/** 将内联 token 按 `maxWidth` 换行，返回行。 */
export function wrapInlineTokensByWidth(
  tokens: InlineToken[],
  fontSize: number,
  maxWidth: number,
	  fontFamily?: string,
	  bodyFontWeight?: number,
	): InlineLine[] {
  const key = wrapCacheKey(tokens, fontSize, maxWidth, fontFamily, bodyFontWeight)
  const cached = _wrapCache.get(key)
  if (cached) return cached

  const charTokens = explodeInlineTokens(tokens)
  const lines: InlineLine[] = []
  let currentLine: InlineToken[] = []
  let currentWidth = 0

  const pushLine = () => {
    if (currentLine.length > 0) {
      lines.push({ tokens: currentLine })
      currentLine = []
      currentWidth = 0
    }
  }

  for (const sourceToken of charTokens) {
    const splitTokens = splitOversizedUnit(sourceToken, fontSize, maxWidth, fontFamily, bodyFontWeight)
    for (const token of splitTokens) {
      if (token.text === '\n') {
        pushLine()
        continue
      }
      // 跳过新行开头的空白
      if (currentLine.length === 0 && isWhitespaceToken(token.text)) continue

      const tokenWidth = getBodyTokenWidth(token, fontSize, fontFamily, bodyFontWeight)

      if (currentLine.length > 0 && currentWidth + tokenWidth > maxWidth) {
        if (!isLeadingPunctuation(token.text)) {
          pushLine()
          if (isWhitespaceToken(token.text)) continue
        }
      }

      // 样式匹配时与前一个 token 合并
      const lastToken = currentLine[currentLine.length - 1]
      if (
        lastToken &&
        lastToken.bold === token.bold &&
        lastToken.italic === token.italic &&
        lastToken.mark === token.mark &&
        lastToken.underline === token.underline
      ) {
        lastToken.text += token.text
      } else {
        currentLine.push({ ...token })
      }
      currentWidth += tokenWidth
    }
  }

  pushLine()

  // 限制缓存大小
  if (_wrapCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _wrapCache.keys().next().value
    if (firstKey !== undefined) _wrapCache.delete(firstKey)
  }
  _wrapCache.set(key, lines)
  return lines
}

// ═══════════════════════════════════════════════════════════════════════════
// 内联 markdown 解析
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 解析内联 markdown — 提取 **bold**, *italic*, ==highlight==,
 * 和 ^underline^ 标记到 InlineToken[]。
 *
 * 结果按原始文本缓存 — 大多数块在渲染之间不会改变。
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  const cached = _parseCache.get(text)
  if (cached) return cached

  const tokens: InlineToken[] = []
  // 粗体 (**) 必须优先于斜体 (*) 匹配，避免将 ** 误解析为两个 *。
// 使用 lookbehind/lookahead 确保单个 * 不是 ** 的一部分。
  const pattern = /(\*\*[\s\S]+?\*\*|==[\s\S]+?==|\^[\s\S]+?\^|(?<!\*)\*[\s\S]+?\*(?!\*))/g
  const parts = text.split(pattern).filter(Boolean)

  for (const part of parts) {
    // 粗体：**...**
    const boldMatch = part.match(/^\*\*([\s\S]+)\*\*$/)
    if (boldMatch) {
      tokens.push({ text: boldMatch[1]!, bold: true, italic: false, mark: false, underline: false })
      continue
    }
    // 高亮：==...==
    const markMatch = part.match(/^==([\s\S]+)==$/)
    if (markMatch) {
      tokens.push({ text: markMatch[1]!, bold: false, italic: false, mark: true, underline: false })
      continue
    }
    // 下划线：^...^
    const underlineMatch = part.match(/^\^([\s\S]+)\^$/)
    if (underlineMatch) {
      tokens.push({ text: underlineMatch[1]!, bold: false, italic: false, mark: false, underline: true })
      continue
    }
    // 斜体：*...* (单个星号，不是 ** 的一部分)
    const italicMatch = part.match(/^\*([\s\S]+)\*$/)
    if (italicMatch) {
      tokens.push({ text: italicMatch[1]!, bold: false, italic: true, mark: false, underline: false })
      continue
    }
    tokens.push({ text: part, bold: false, italic: false, mark: false, underline: false })
  }

  // 限制缓存大小，避免大文档内存泄漏
  if (_parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _parseCache.keys().next().value
    if (firstKey !== undefined) _parseCache.delete(firstKey)
  }
  _parseCache.set(text, tokens)
  return tokens
}

// ═══════════════════════════════════════════════════════════════════════════
// 段落测量
// ═══════════════════════════════════════════════════════════════════════════

function getSubheadingFontSize(fontSize: number, headingLevel?: number, theme?: ThemeDefinition, isCover = false, headingOverrides?: HeadingStyleOverrides | null): number {
  // 使用 per-theme 标题缩放配置 — 用户覆盖优先
  if (headingLevel && headingLevel >= 1 && headingLevel <= 6) {
    return resolveHeadingSize(headingLevel, fontSize, theme, headingOverrides, isCover && headingLevel === 1)
  }
  // 回退：通用副标题尺寸（向后兼容）
  return Math.round(fontSize * 1.08)
}

/** 标题行高，以标题自身字体大小的比例表示。*/
function getHeadingLineHeightRatio(headingLevel?: number, theme?: ThemeDefinition, isCover = false): number {
  if (headingLevel && headingLevel >= 1 && headingLevel <= 6) {
    return resolveHeadingLineHeight(headingLevel, theme, isCover && headingLevel === 1)
  }
  return 1.55
}

function getSubheadingLineHeight(fontSize: number, lineHeight: number, style: SubheadingStyle, headingLevel?: number, theme?: ThemeDefinition, isCover = false): number {
  if (headingLevel && headingLevel >= 1 && headingLevel <= 6) {
    const headingFontSize = getSubheadingFontSize(fontSize, headingLevel, theme, isCover)
    return Math.round(headingFontSize * getHeadingLineHeightRatio(headingLevel, theme, isCover))
  }
  return style === 'large' ? lineHeight * 1.02 : lineHeight
}

function getDividerBlockHeight(fontSize: number): number {
  return Math.max(18, fontSize * 0.72)
}

/** 计算 N 行文本的视觉高度。 */
export function getParagraphVisualHeight(
  lineCount: number,
  fontSize: number,
  lineHeight: number,
): number {
  if (lineCount <= 0) return 0
  return fontSize + Math.max(0, lineCount - 1) * lineHeight
}

export function getQuoteBoxMetrics(
  theme: ThemeDefinition,
  fontSize: number,
  maxWidth: number,
): QuoteBoxMetrics {
  const treatment = theme.components.quoteTreatment

  if (treatment === 'callout') {
    const padding = Math.max(20, fontSize * 0.58)
    return {
      textInset: 42,
      textWidth: maxWidth - 72,
      paddingTop: padding,
      paddingBottom: padding,
      boxOffsetX: -14,
      boxWidthOffset: 14,
      barOffsetX: -8,
      barTopInset: 12,
      barBottomInset: 24,
      barWidth: 5,
      barRadius: 5,
    }
  }

  if (treatment === 'code') {
    const padding = Math.max(18, fontSize * 0.52)
    return {
      textInset: 40,
      textWidth: maxWidth - 68,
      paddingTop: padding,
      paddingBottom: padding,
      boxOffsetX: -12,
      boxWidthOffset: 12,
      barOffsetX: -7,
      barTopInset: 10,
      barBottomInset: 20,
      barWidth: 4,
      barRadius: 4,
    }
  }

  const padding = Math.max(22, fontSize * 0.62)
  return {
    textInset: theme.mode === 'swiss' ? 44 : 38,
    textWidth: maxWidth - 72,
    paddingTop: padding,
    paddingBottom: padding,
    boxOffsetX: -18,
    boxWidthOffset: 18,
    barOffsetX: -12,
    barTopInset: 14,
    barBottomInset: 28,
    barWidth: 5,
    barRadius: 5,
  }
}

/** 测量单个段落块 — 返回换行后的行和总高度。 */
export function measureParagraphBlock(
  block: ParagraphBlock,
  fontSize: number,
  lineHeight: number,
  maxWidth: number,
  theme: ThemeDefinition,
  subheadingStyle: SubheadingStyle,
  fontFamily?: string,
  isCover = false,
  headingOverrides?: HeadingStyleOverrides | null,
): { lines: InlineLine[]; height: number } {
  if (block.kind === 'divider') {
    return { lines: [], height: getDividerBlockHeight(fontSize) }
  }

  const headingLevel = (block as any).headingLevel as number | undefined
  const activeFontSize =
    block.kind === 'subheading'
      ? getSubheadingFontSize(fontSize, headingLevel, theme, isCover, headingOverrides)
      : fontSize
  const activeLineHeight =
    block.kind === 'subheading'
      ? getSubheadingLineHeight(fontSize, lineHeight, subheadingStyle, headingLevel, theme, isCover)
      : lineHeight
  const quoteMetrics =
    block.kind === 'quote'
      ? getQuoteBoxMetrics(theme, activeFontSize, maxWidth)
      : null
  const quoteWidth = quoteMetrics?.textWidth ?? maxWidth
	  const bodyWeight = theme.editor.bodyFontWeight
  const lines = wrapInlineTokensByWidth(
    parseInlineMarkdown(block.raw),
    activeFontSize,
    quoteWidth,
    fontFamily,
	    bodyWeight,
  )
  // 标题高度使用 lineHeight × 行数，而非 fontSize + (n-1)×lineHeight。
  // 后者在超大字号（>100px）下严重低估视觉高度：120px 标题丢失 30px leading，
  // 叠加仅 27px 的固定间距，导致标题与下文排版重叠。
  const textHeight =
    block.kind === 'subheading'
      ? lines.length * activeLineHeight
      : getParagraphVisualHeight(lines.length, activeFontSize, activeLineHeight)
  const quotePadTop = quoteMetrics?.paddingTop ?? 0
  const quotePadBottom = quoteMetrics?.paddingBottom ?? 0
  return {
    lines,
    height:
      block.kind === 'quote'
        ? quotePadTop + textHeight + quotePadBottom
        : textHeight,
  }
}

/** 计算在 availableHeight 内能容纳的最大行数。 */
export function getParagraphMaxLines(
  block: ParagraphBlock,
  availableHeight: number,
  fontSize: number,
  lineHeight: number,
  theme: ThemeDefinition,
  subheadingStyle: SubheadingStyle,
  isCover = false,
  headingOverrides?: HeadingStyleOverrides | null,
): number {
  if (block.kind === 'divider') {
    return availableHeight >= getDividerBlockHeight(fontSize) ? 1 : 0
  }

  const headingLevel = (block as any).headingLevel as number | undefined
  const activeFontSize =
    block.kind === 'subheading'
      ? getSubheadingFontSize(fontSize, headingLevel, theme, isCover, headingOverrides)
      : fontSize
  const activeLineHeight =
    block.kind === 'subheading'
      ? getSubheadingLineHeight(fontSize, lineHeight, subheadingStyle, headingLevel, theme, isCover)
      : lineHeight
  const quoteMetrics =
    block.kind === 'quote'
      ? getQuoteBoxMetrics(theme, activeFontSize, CONTENT_WIDTH)
      : null
  const padTop = quoteMetrics?.paddingTop ?? 0
  const padBottom = quoteMetrics?.paddingBottom ?? 0
  const textRoom = availableHeight - padTop - padBottom

  // 标题行高计算须与 measureParagraphBlock（lines × activeLineHeight）一致，
  // 否则布局引擎在分页切割时会误判标题能放入当前页。
  if (block.kind === 'subheading') {
    if (textRoom < activeLineHeight) return 0
    return Math.floor(textRoom / activeLineHeight)
  }

  if (textRoom < activeFontSize) return 0
  return 1 + Math.floor((textRoom - activeFontSize) / activeLineHeight)
}

// ═══════════════════════════════════════════════════════════════════════════
// 间距计算
// ═══════════════════════════════════════════════════════════════════════════

/** 计算两个连续块之间的垂直间距。 */
export function getGapBetweenBlocks(
  prev: ParagraphBlock | null,
  curr: ParagraphBlock,
  metrics: PosterMetrics,
): number {
  if (!prev) return 0
  const baseGap = metrics.bodyParagraphGap
  const quoteGap = baseGap * 1.08 + 4
  if (curr.kind === 'subheading') return baseGap * 1.2
  if (prev.kind === 'subheading') return baseGap * 0.85
  if (prev.kind === 'quote' || curr.kind === 'quote') return quoteGap
  return baseGap
}

// ═══════════════════════════════════════════════════════════════════════════
// Poster 指标（按页布局计算）
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 计算卡片页面的完整布局指标集。
 */
export function getPosterMetrics(
  _page: CardPage,
  settings: TypographySettings,
  footerEnabled: boolean,
): PosterMetrics {
  const bodySize = Math.max(21, settings.bodySize - 4)
  const bodyLineHeight = bodySize * Math.max(1.58, settings.lineHeight - 0.06)
  const bodyParagraphGap = Math.max(30, bodySize * 1.25)

  const separatorY = 110
  const bodyTopY = separatorY + 10
  const bodyBottomY = footerEnabled
    ? BODY_BOTTOM_WITH_FOOTER
    : BODY_BOTTOM_WITHOUT_FOOTER

  return {
    bodySize,
    bodyLineHeight,
    bodyParagraphGap,
    bodyFontFamily: getBodyFontFamily(settings.bodyFontMode),
    separatorY,
    bodyTopY,
    bodyBottomY,
    bodyWidth: CONTENT_WIDTH,
  }
}