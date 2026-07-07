// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — Canvas text measurement utilities
// ═══════════════════════════════════════════════════════════════════════════

import type {
  InlineToken,
  InlineLine,
  ParagraphBlock,
  PosterMetrics,
  QuoteBoxMetrics,
  TextRange,
  ThemeDefinition,
  TitleFontMode,
  TitleCustomization,
  SubheadingStyle,
  TypographySettings,
  CardPage,
} from './types'
import { DEFAULT_TITLE_CUSTOM } from './types'
import {
  BODY_TEXT_WEIGHT,
  BODY_BOLD_WEIGHT,
  BODY_FONT_FAMILY,
  TITLE_FONT_MODES,
  LEADING_PUNCTUATION,
  CONTENT_WIDTH,
  BODY_BOTTOM_WITH_FOOTER,
  BODY_BOTTOM_WITHOUT_FOOTER,
} from './types'

// ═══════════════════════════════════════════════════════════════════════════
// Low-level text measurement
// ═══════════════════════════════════════════════════════════════════════════

/** Get a shared off-screen canvas 2D context for text measurement. */
function getMeasureCtx(font: string): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create measure canvas')
  ctx.font = font
  return ctx
}

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
      mark: token.mark,
    })),
  )
}

/** Measure the canvas width of a single body token. */
export function getBodyTokenWidth(token: InlineToken, fontSize: number): number {
  if (token.text === '\n') return 0
  const weight = token.bold ? BODY_BOLD_WEIGHT : BODY_TEXT_WEIGHT
  const font = `${weight} ${fontSize}px ${BODY_FONT_FAMILY}`
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
): InlineToken[] {
  if (token.text.length <= 1 || getBodyTokenWidth(token, fontSize) <= maxWidth)
    return [token]
  return Array.from(token.text).map((char) => ({ ...token, text: char }))
}

/** Wrap inline tokens to fit within `maxWidth`, returning lines. */
export function wrapInlineTokensByWidth(
  tokens: InlineToken[],
  fontSize: number,
  maxWidth: number,
): InlineLine[] {
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
    const splitTokens = splitOversizedUnit(sourceToken, fontSize, maxWidth)
    for (const token of splitTokens) {
      if (token.text === '\n') {
        pushLine()
        continue
      }
      // Skip leading whitespace on a new line
      if (currentLine.length === 0 && isWhitespaceToken(token.text)) continue

      const tokenWidth = getBodyTokenWidth(token, fontSize)

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
        lastToken.mark === token.mark
      ) {
        lastToken.text += token.text
      } else {
        currentLine.push({ ...token })
      }
      currentWidth += tokenWidth
    }
  }

  pushLine()
  return lines
}

// ═══════════════════════════════════════════════════════════════════════════
// Inline markdown parsing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse inline markdown — extract **bold** and ==highlight== markers
 * into InlineToken[].
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const pattern = /(\*\*[\s\S]+?\*\*|==[\s\S]+?==)/g
  const parts = text.split(pattern).filter(Boolean)

  for (const part of parts) {
    const boldMatch = part.match(/^\*\*([\s\S]+)\*\*$/)
    if (boldMatch) {
      tokens.push({ text: boldMatch[1]!, bold: true, mark: false })
      continue
    }
    const markMatch = part.match(/^==([\s\S]+)==$/)
    if (markMatch) {
      tokens.push({ text: markMatch[1]!, bold: false, mark: true })
      continue
    }
    tokens.push({ text: part, bold: false, mark: false })
  }
  return tokens
}

// ═══════════════════════════════════════════════════════════════════════════
// Title measurement
// ═══════════════════════════════════════════════════════════════════════════

function getTitleFontWeight(mode: TitleFontMode, custom?: TitleCustomization): number {
  if (custom && custom.fontWeight > 0) return custom.fontWeight
  return mode === 'retroSerif' || mode === 'sans' || mode === 'puhuiti' ? 700 : 600
}

function getTitleTracking(size: number, mode: TitleFontMode, custom?: TitleCustomization): number {
  if (custom && custom.letterSpacing > 0) return custom.letterSpacing
  if (mode === 'retroSerif') return Math.max(2, size * 0.03)
  return 0
}

function getTitleLineHeightRatio(mode: TitleFontMode): number {
  if (mode === 'puhuiti') return 1.38
  if (mode === 'sans') return 1.32
  return 1.28
}

function resolveTitleFontFamily(mode: TitleFontMode, isLatin: boolean): string {
  const config = TITLE_FONT_MODES[mode] ?? TITLE_FONT_MODES.serif
  return isLatin ? config.latinFamily : config.family
}

/** Split text into Latin/CJK segments for font-appropriate measurement. */
function splitLatinRuns(text: string): string[] {
  return text.match(/[A-Za-z0-9][A-Za-z0-9\s'&/.-]*|[^A-Za-z0-9]+/g) ?? [text]
}

/** Measure a title text segment with per-character tracking. */
function measureTrackedTitleSegment(
  segment: string,
  size: number,
  mode: TitleFontMode,
  isLatin: boolean,
  custom?: TitleCustomization,
): number {
  const ctx = getMeasureCtx(
    `${getTitleFontWeight(mode, custom)} ${size}px ${resolveTitleFontFamily(mode, isLatin)}`,
  )
  const chars = Array.from(segment)
  const tracking = getTitleTracking(size, mode, custom)
  let width = 0

  chars.forEach((char, index) => {
    width += ctx.measureText(char).width
    const nextChar = chars[index + 1]
    if (nextChar && !/\s/.test(char) && !/\s/.test(nextChar)) {
      width += tracking
    }
  })

  return width
}

/** Measure the total rendered width of title text. */
export function measureTitleText(
  text: string,
  size: number,
  mode: TitleFontMode,
  custom?: TitleCustomization,
): number {
  let width = 0
  for (const segment of splitLatinRuns(text)) {
    const isLatin = /^[A-Za-z0-9\s'&/.-]+$/.test(segment)
    width += measureTrackedTitleSegment(segment, size, mode, isLatin, custom)
  }
  return width
}

/** Get title text segments for wrapping.
 *  Latin words (with letters/spaces/symbols) stay as word segments.
 *  CJK characters stay as individual segments (breakable between any two).
 *  Pure-digit runs and pure-letter runs are broken into individual characters —
 *  they have no word-boundary semantics and would otherwise overflow as one
 *  unbreakable segment (e.g. a long number or letter string as a custom title).
 *  Mixed alphanumeric runs with no spaces are handled by the overflow safety
 *  net in wrapTitleByWidth. */
function getTitleSegments(text: string): string[] {
  const runs = splitLatinRuns(text)
  const segments: string[] = []
  for (const run of runs) {
    const chars = Array.from(run)
    // Determine if this run is Latin
    const isLatinRun = /^[A-Za-z0-9\s'&/.-]+$/.test(run)
    // Pure-digit or pure-letter runs have no word boundaries — break into chars
    const isPureDigits = /^\d+$/.test(run)
    const isPureLetters = /^[A-Za-z]+$/.test(run)
    if (isLatinRun && !isPureDigits && !isPureLetters) {
      // Latin run with mixed content — keep as one word segment
      segments.push(run)
    } else if (isPureDigits || isPureLetters) {
      // Digit-only or letter-only run — each char is a breakable segment
      for (const char of chars) {
        segments.push(char)
      }
    } else {
      // CJK / punctuation run — each char is a breakable segment
      for (const char of chars) {
        if (/\s/.test(char) && segments.length > 0) {
          // Whitespace in CJK context: skip, it's handled by measuring
          segments.push(char)
        } else if (!/\s/.test(char)) {
          segments.push(char)
        }
      }
    }
  }
  return segments
}

/** Wrap title text to fit within maxWidth. */
function wrapTitleByWidth(
  text: string,
  ctx: CanvasRenderingContext2D,
  maxWidth: number,
  mode: TitleFontMode,
  custom?: TitleCustomization,
): string[] {
  const manualLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (manualLines.length > 1) return manualLines

  const segments = getTitleSegments(text)
  const lines: string[] = []
  let currentLine = ''
  const sizeMatch = ctx.font.match(/(\d+)px/)
  const titleSize = sizeMatch ? Number(sizeMatch[1]) : 62

  for (const segment of segments) {
    const candidate = `${currentLine}${segment}`
    if (currentLine && measureTitleText(candidate, titleSize, mode, custom) > maxWidth) {
      lines.push(currentLine.trim())
      currentLine = segment.trimStart()
    } else if (!currentLine && segment.length > 1 && measureTitleText(segment, titleSize, mode, custom) > maxWidth) {
      // Segment alone exceeds maxWidth — break into individual characters
      for (const char of Array.from(segment)) {
        const charCandidate = `${currentLine}${char}`
        if (currentLine && measureTitleText(charCandidate, titleSize, mode, custom) > maxWidth) {
          lines.push(currentLine.trim())
          currentLine = char
        } else {
          currentLine = charCandidate
        }
      }
    } else {
      currentLine = candidate
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim())
  return lines.length > 0 ? lines : [text]
}

/** Auto-shrink title size until it fits in ≤2 lines. */
export function fitTitleLines(
  title: string,
  settings: TypographySettings,
): {
  titleSize: number
  titleLineHeight: number
  titleLines: string[]
} {
  const cleanTitle = title.trim()
  const ratio = getTitleLineHeightRatio(settings.titleFontMode)
  const custom = settings.titleCustom ?? DEFAULT_TITLE_CUSTOM
  if (!cleanTitle) {
    return { titleSize: settings.titleSize, titleLineHeight: settings.titleSize * ratio, titleLines: [] }
  }
  const minSize = Math.max(34, settings.titleSize - 18)
  const weight = getTitleFontWeight(settings.titleFontMode, custom)

  /** Verify every line fits within the content width. */
  function allLinesFit(lines: string[], size: number, maxW: number): boolean {
    for (const line of lines) {
      if (measureTitleText(line, size, settings.titleFontMode, custom) > maxW) {
        return false
      }
    }
    return true
  }

  for (let size = settings.titleSize; size >= minSize; size -= 2) {
    const ctx = getMeasureCtx(
      `${weight} ${size}px ${TITLE_FONT_MODES[settings.titleFontMode].family}`,
    )
    const lines = wrapTitleByWidth(cleanTitle, ctx, CONTENT_WIDTH, settings.titleFontMode, custom)
    if (lines.length <= 2 && allLinesFit(lines, size, CONTENT_WIDTH)) {
      return { titleSize: size, titleLineHeight: size * ratio, titleLines: lines }
    }
  }
  // Minimum size fallback
  const ctx = getMeasureCtx(
    `${weight} ${minSize}px ${TITLE_FONT_MODES[settings.titleFontMode].family}`,
  )
  return {
    titleSize: minSize,
    titleLineHeight: minSize * ratio,
    titleLines: wrapTitleByWidth(cleanTitle, ctx, CONTENT_WIDTH, settings.titleFontMode, custom),
  }
}

/** Parse title markup to extract accent (bold) ranges. */
export function parseTitleMarkup(raw: string): {
  plainText: string
  accentRanges: TextRange[]
} {
  const ranges: TextRange[] = []
  let plainText = ''
  let sourceCursor = 0
  let charCursor = 0
  const pattern = /\*\*([\s\S]+?)\*\*/g

  const countVisibleChars = (t: string) => Array.from(t.replace(/\n/g, '')).length

  for (const match of raw.matchAll(pattern)) {
    const matchIndex = match.index ?? 0
    const before = raw.slice(sourceCursor, matchIndex)
    plainText += before
    charCursor += countVisibleChars(before)

    const emphasized = match[1] ?? ''
    plainText += emphasized
    const len = countVisibleChars(emphasized)
    if (emphasized.trim()) {
      ranges.push({ start: charCursor, end: charCursor + len })
    }
    charCursor += len
    sourceCursor = matchIndex + match[0].length
  }

  plainText += raw.slice(sourceCursor)
  return { plainText, accentRanges: ranges }
}

// ═══════════════════════════════════════════════════════════════════════════
// Paragraph measurement
// ═══════════════════════════════════════════════════════════════════════════

function getSubheadingFontSize(fontSize: number, style: SubheadingStyle): number {
  return style === 'large' ? Math.round(fontSize * 1.08) : fontSize
}

function getSubheadingLineHeight(lineHeight: number, style: SubheadingStyle): number {
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
): { lines: InlineLine[]; height: number } {
  if (block.kind === 'divider') {
    return { lines: [], height: getDividerBlockHeight(fontSize) }
  }

  const activeFontSize =
    block.kind === 'subheading'
      ? getSubheadingFontSize(fontSize, subheadingStyle)
      : fontSize
  const activeLineHeight =
    block.kind === 'subheading'
      ? getSubheadingLineHeight(lineHeight, subheadingStyle)
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

  const activeFontSize =
    block.kind === 'subheading'
      ? getSubheadingFontSize(fontSize, subheadingStyle)
      : fontSize
  const activeLineHeight =
    block.kind === 'subheading'
      ? getSubheadingLineHeight(lineHeight, subheadingStyle)
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
  if (curr.kind === 'subheading') return baseGap * 1.62
  if (prev.kind === 'subheading') return baseGap * 1.3
  if (prev.kind === 'quote' || curr.kind === 'quote') return quoteGap
  return baseGap
}

// ═══════════════════════════════════════════════════════════════════════════
// Poster metrics (computed per-page layout)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the full set of layout metrics for a card page.
 *
 * This determines title sizing, line heights, body type area, and the
 * vertical positions of the title, separator, and body text region.
 */
export function getPosterMetrics(
  page: CardPage,
  settings: TypographySettings,
  footerEnabled: boolean,
): PosterMetrics {
  const bodySize = Math.max(21, settings.bodySize - 4)
  const bodyLineHeight = bodySize * Math.max(1.58, settings.lineHeight - 0.06)
  const bodyParagraphGap = Math.max(30, bodySize * 1.25)

  const parsedTitle =
    page.kind === 'cover' && page.title.trim()
      ? parseTitleMarkup(page.title)
      : null
  const titleBlock = parsedTitle
    ? fitTitleLines(parsedTitle.plainText, settings)
    : null
  const titleLineHeightRatio = getTitleLineHeightRatio(settings.titleFontMode)

  const bodyAnchorStartY = 196
  const titleStartY = 218
  const separatorY = titleBlock
    ? bodyAnchorStartY + titleBlock.titleLines.length * titleBlock.titleLineHeight - 18
    : 110
  const bodyTopY = separatorY + (titleBlock ? 0 : 10)
  const bodyBottomY = footerEnabled
    ? BODY_BOTTOM_WITH_FOOTER
    : BODY_BOTTOM_WITHOUT_FOOTER

  return {
    titleSize: titleBlock?.titleSize ?? settings.titleSize,
    titleLineHeight:
      titleBlock?.titleLineHeight ?? settings.titleSize * titleLineHeightRatio,
    bodySize,
    bodyLineHeight,
    bodyParagraphGap,
    titleLines: titleBlock?.titleLines ?? [],
    titleAccentRanges: parsedTitle?.accentRanges ?? [],
    titleStartY,
    separatorY,
    bodyTopY,
    bodyBottomY,
    bodyWidth: CONTENT_WIDTH,
  }
}
