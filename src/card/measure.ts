// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — Canvas text measurement utilities
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
  HEADING_SIZE_RATIOS,
  getBodyFontFamily,
} from './types'

// ═══════════════════════════════════════════════════════════════════════════
// Low-level text measurement
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Singleton measurement context — reused for all text measurement.
 * Avoids creating/destroying hundreds of canvas elements per render.
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
// Inline-markdown parse + wrap caches (simple Map-based, LRU-ish via cap)
// ═══════════════════════════════════════════════════════════════════════════

const MAX_CACHE_SIZE = 256

/** Cache for parseInlineMarkdown results. Keyed by raw text string. */
const _parseCache = new Map<string, InlineToken[]>()

/** Cache for wrapInlineTokensByWidth results. Keyed by composite key string. */
const _wrapCache = new Map<string, InlineLine[]>()

/** Split text into CJK characters, Latin runs, whitespace, and newlines. */
export function splitTextForWrapping(text: string): string[] {
  return (
    text.match(/[A-Za-z0-9]+(?:[._'’&/+:-][A-Za-z0-9]+)*|[ \t]+|\n|./gu) ?? []
  )
}

/** Explode inline tokens into per-character wrapping units. */
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

/** Measure the canvas width of a single body token. */
export function getBodyTokenWidth(token: InlineToken, fontSize: number, fontFamily?: string): number {
  if (token.text === '\n') return 0
  const weight = token.bold ? BODY_BOLD_WEIGHT : BODY_TEXT_WEIGHT
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

/** Split an oversized wrapping unit into individual characters. */
function splitOversizedUnit(
  token: InlineToken,
  fontSize: number,
  maxWidth: number,
  fontFamily?: string,
): InlineToken[] {
  if (token.text.length <= 1 || getBodyTokenWidth(token, fontSize, fontFamily) <= maxWidth)
    return [token]
  return Array.from(token.text).map((char) => ({ ...token, text: char }))
}

/**
 * Build a composite cache key for the wrap cache.
 * Token identity is too complex for Map keying directly, so we derive a
 * compact key from the serialized token text + layout params.
 */
function wrapCacheKey(tokens: InlineToken[], fontSize: number, maxWidth: number, fontFamily?: string): string {
  // Use first + last token text + total count as a cheap fingerprint
  const first = tokens.length > 0 ? tokens[0]!.text : ''
  const last = tokens.length > 0 ? tokens[tokens.length - 1]!.text : ''
  return `${tokens.length}:${first}:${last}:${fontSize}:${Math.round(maxWidth)}:${fontFamily ?? ''}`
}

/** Wrap inline tokens to fit within `maxWidth`, returning lines. */
export function wrapInlineTokensByWidth(
  tokens: InlineToken[],
  fontSize: number,
  maxWidth: number,
  fontFamily?: string,
): InlineLine[] {
  const key = wrapCacheKey(tokens, fontSize, maxWidth, fontFamily)
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
    const splitTokens = splitOversizedUnit(sourceToken, fontSize, maxWidth, fontFamily)
    for (const token of splitTokens) {
      if (token.text === '\n') {
        pushLine()
        continue
      }
      // Skip leading whitespace on a new line
      if (currentLine.length === 0 && isWhitespaceToken(token.text)) continue

      const tokenWidth = getBodyTokenWidth(token, fontSize, fontFamily)

      if (currentLine.length > 0 && currentWidth + tokenWidth > maxWidth) {
        if (!isLeadingPunctuation(token.text)) {
          pushLine()
          if (isWhitespaceToken(token.text)) continue
        }
      }

      // Merge with previous token if style matches
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

  // Cap cache size
  if (_wrapCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _wrapCache.keys().next().value
    if (firstKey !== undefined) _wrapCache.delete(firstKey)
  }
  _wrapCache.set(key, lines)
  return lines
}

// ═══════════════════════════════════════════════════════════════════════════
// Inline markdown parsing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse inline markdown — extract **bold**, *italic*, ==highlight==,
 * and ^underline^ markers into InlineToken[].
 *
 * Results are cached per raw text — most blocks don't change between renders.
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  const cached = _parseCache.get(text)
  if (cached) return cached

  const tokens: InlineToken[] = []
  // Bold (**) must match before italic (*) to avoid mis-parsing ** as two *.
  // Uses lookbehind/lookahead to ensure single * is not part of **.
  const pattern = /(\*\*[\s\S]+?\*\*|==[\s\S]+?==|\^[\s\S]+?\^|(?<!\*)\*[\s\S]+?\*(?!\*))/g
  const parts = text.split(pattern).filter(Boolean)

  for (const part of parts) {
    // Bold: **...**
    const boldMatch = part.match(/^\*\*([\s\S]+)\*\*$/)
    if (boldMatch) {
      tokens.push({ text: boldMatch[1]!, bold: true, italic: false, mark: false, underline: false })
      continue
    }
    // Highlight: ==...==
    const markMatch = part.match(/^==([\s\S]+)==$/)
    if (markMatch) {
      tokens.push({ text: markMatch[1]!, bold: false, italic: false, mark: true, underline: false })
      continue
    }
    // Underline: ^...^
    const underlineMatch = part.match(/^\^([\s\S]+)\^$/)
    if (underlineMatch) {
      tokens.push({ text: underlineMatch[1]!, bold: false, italic: false, mark: false, underline: true })
      continue
    }
    // Italic: *...* (single asterisk, not part of **)
    const italicMatch = part.match(/^\*([\s\S]+)\*$/)
    if (italicMatch) {
      tokens.push({ text: italicMatch[1]!, bold: false, italic: true, mark: false, underline: false })
      continue
    }
    tokens.push({ text: part, bold: false, italic: false, mark: false, underline: false })
  }

  // Cap cache size to avoid memory leaks on large documents
  if (_parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _parseCache.keys().next().value
    if (firstKey !== undefined) _parseCache.delete(firstKey)
  }
  _parseCache.set(text, tokens)
  return tokens
}

// ═══════════════════════════════════════════════════════════════════════════
// Paragraph measurement
// ═══════════════════════════════════════════════════════════════════════════

function getSubheadingFontSize(fontSize: number, headingLevel?: number): number {
  // Use heading-level-based sizing when available (matches drawInlineParagraph)
  if (headingLevel && headingLevel >= 1 && headingLevel <= 6) {
    const ratio = HEADING_SIZE_RATIOS[headingLevel] ?? 1.12
    return Math.round(fontSize * ratio)
  }
  // Fallback: generic subheading sizing (backward compatible)
  return Math.round(fontSize * 1.08)
}

/** Heading line height as a ratio of the heading's own font size. */
function getHeadingLineHeightRatio(headingLevel?: number): number {
  if (headingLevel === 1) return 1.25
  if (headingLevel === 2) return 1.35
  if (headingLevel === 3) return 1.45
  return 1.55
}

function getSubheadingLineHeight(fontSize: number, lineHeight: number, style: SubheadingStyle, headingLevel?: number): number {
  if (headingLevel && headingLevel >= 1 && headingLevel <= 6) {
    const headingFontSize = getSubheadingFontSize(fontSize, headingLevel)
    return Math.round(headingFontSize * getHeadingLineHeightRatio(headingLevel))
  }
  return style === 'large' ? lineHeight * 1.02 : lineHeight
}

function getDividerBlockHeight(fontSize: number): number {
  return Math.max(18, fontSize * 0.72)
}

/** Compute the visual height of N lines of text. */
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

/** Measure a single paragraph block — returns wrapped lines and total height. */
export function measureParagraphBlock(
  block: ParagraphBlock,
  fontSize: number,
  lineHeight: number,
  maxWidth: number,
  theme: ThemeDefinition,
  subheadingStyle: SubheadingStyle,
  fontFamily?: string,
): { lines: InlineLine[]; height: number } {
  if (block.kind === 'divider') {
    return { lines: [], height: getDividerBlockHeight(fontSize) }
  }

  const headingLevel = (block as any).headingLevel as number | undefined
  const activeFontSize =
    block.kind === 'subheading'
      ? getSubheadingFontSize(fontSize, headingLevel)
      : fontSize
  const activeLineHeight =
    block.kind === 'subheading'
      ? getSubheadingLineHeight(fontSize, lineHeight, subheadingStyle, headingLevel)
      : lineHeight
  const quoteMetrics =
    block.kind === 'quote'
      ? getQuoteBoxMetrics(theme, activeFontSize, maxWidth)
      : null
  const quoteWidth = quoteMetrics?.textWidth ?? maxWidth
  const lines = wrapInlineTokensByWidth(
    parseInlineMarkdown(block.raw),
    activeFontSize,
    quoteWidth,
    fontFamily,
  )
  const textHeight = getParagraphVisualHeight(
    lines.length,
    activeFontSize,
    activeLineHeight,
  )
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

/** Compute the maximum number of lines that fit within availableHeight. */
export function getParagraphMaxLines(
  block: ParagraphBlock,
  availableHeight: number,
  fontSize: number,
  lineHeight: number,
  theme: ThemeDefinition,
  subheadingStyle: SubheadingStyle,
): number {
  if (block.kind === 'divider') {
    return availableHeight >= getDividerBlockHeight(fontSize) ? 1 : 0
  }

  const headingLevel = (block as any).headingLevel as number | undefined
  const activeFontSize =
    block.kind === 'subheading'
      ? getSubheadingFontSize(fontSize, headingLevel)
      : fontSize
  const activeLineHeight =
    block.kind === 'subheading'
      ? getSubheadingLineHeight(fontSize, lineHeight, subheadingStyle, headingLevel)
      : lineHeight
  const quoteMetrics =
    block.kind === 'quote'
      ? getQuoteBoxMetrics(theme, activeFontSize, CONTENT_WIDTH)
      : null
  const padTop = quoteMetrics?.paddingTop ?? 0
  const padBottom = quoteMetrics?.paddingBottom ?? 0
  const textRoom = availableHeight - padTop - padBottom
  if (textRoom < activeFontSize) return 0
  return 1 + Math.floor((textRoom - activeFontSize) / activeLineHeight)
}

// ═══════════════════════════════════════════════════════════════════════════
// Gap computation
// ═══════════════════════════════════════════════════════════════════════════

/** Compute the vertical gap between two consecutive blocks. */
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
// Poster metrics (computed per-page layout)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the full set of layout metrics for a card page.
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
