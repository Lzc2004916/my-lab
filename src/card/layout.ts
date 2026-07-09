// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — intelligent pagination engine
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CardPage,
  InlineLine,
  ParagraphBlock,
  InlineToken,
  LayoutOptions,
  Block,
  TextBlock,
  CodeBlock,
  MathDisplayBlock,
  MermaidDisplayBlock,
  TableDisplayBlock,
  ColumnContainerBlock,
  HeadingLevel,
} from './types'
import {
  getPosterMetrics,
  getGapBetweenBlocks,
  measureParagraphBlock,
  getParagraphMaxLines,
} from './measure'
import { measureCodeBlock } from './code-renderer'
import { getBodyFontFamily } from './types'

// ═══════════════════════════════════════════════════════════════════════════
// Markdown block classification
// ═══════════════════════════════════════════════════════════════════════════

function isMarkdownDividerLine(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())
}

/** Check if a line starts a markdown heading. */
function isHeadingLine(line: string): boolean {
  return /^#{1,6}\s+\S/.test(line.trim())
}

/** Classify a raw text line into a TextBlock. */
export function getParagraphBlock(text: string): TextBlock {
  const trimmed = text.trim()
  if (isMarkdownDividerLine(trimmed)) {
    return { kind: 'divider', raw: '' }
  }
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
  if (headingMatch) {
    return {
      kind: 'subheading',
      raw: headingMatch[2]!.trim(),
      headingLevel: headingMatch[1]!.length as HeadingLevel,
    }
  }
  const quoteMatch = trimmed.match(/^>\s?(.*)$/)
  if (quoteMatch) {
    return { kind: 'quote', raw: quoteMatch[1]!.trim() }
  }
  return { kind: 'body', raw: trimmed }
}

// ═══════════════════════════════════════════════════════════════════════════
// Input parsing
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// Block-level parser (state machine)
// ═══════════════════════════════════════════════════════════════════════════

/** Detect line that opens a fenced code block. */
function isFenceOpen(line: string): boolean {
  return /^```\S*$/.test(line.trim()) || /^~~~\S*$/.test(line.trim())
}

/** Detect line that closes a fenced code block. */
function isFenceClose(line: string): boolean {
  const t = line.trim()
  return t === '```' || t === '~~~'
}

/** Extract language identifier from fence opener (e.g. "```js" → "js"). */
function getFenceLang(line: string): string {
  const m = line.trim().match(/^```(\S+)$/)
  return m ? m[1]! : ''
}

/** Detect a pipe-table line (starts and ends with |). */
function isTableLine(line: string): boolean {
  return /^\|.*\|$/.test(line.trim())
}

/** Parse a table separator line to extract alignments. */
function parseTableAlignments(line: string): ('left' | 'center' | 'right')[] {
  return line
    .trim()
    .split('|')
    .filter(Boolean)
    .map((cell) => {
      const t = cell.trim()
      if (t.startsWith(':') && t.endsWith(':')) return 'center'
      if (t.endsWith(':')) return 'right'
      return 'left'
    })
}

/** Split a pipe-table cell line into individual cells. */
function splitTableCells(line: string): string[] {
  return line
    .trim()
    .split('|')
    .filter((_, i, arr) => i > 0 && i < arr.length - 1) // skip outer empty
    .map((c) => c.trim())
}

/**
 * State-machine parser that converts raw markdown source into Block[].
 *
 * Handles multi-line constructs:
 * - Fenced code blocks (``` ... ```)
 * - Math blocks ($$ ... $$)
 * - Tables (consecutive |...| lines)
 * - Column containers (:::left / :::right ... :::)
 * - Regular text (split by blank lines, classified by getParagraphBlock)
 */
function parseInputBlocks(raw: string): Block[] {
  const lines = raw.split('\n')
  const blocks: Block[] = []
  let i = 0


  /** Push buffered text as TextBlock(s) using blank-line splitting.
   *  Also splits on heading boundaries within multi-line text so that
   *  headings mixed with body text (no blank line separator) are still
   *  correctly identified. */
  function flushTextBuffer(buf: string): void {
    const trimmed = buf.trim()
    if (!trimmed) return
    // First split by blank lines (standard paragraph separation)
    const paragraphs = trimmed.split(/\n{2,}/)
    for (const para of paragraphs) {
      if (!para.trim()) continue

      // Within a paragraph, split on heading boundaries:
      // lines that start with # should always form their own block,
      // even when they are the first line (no preceding text to flush).
      const lines = para.split('\n')
      let subBuffer = ''
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]!
        if (isHeadingLine(line)) {
          // Flush any accumulated text before this heading
          if (subBuffer.trim()) {
            blocks.push(getParagraphBlock(subBuffer.trim()))
          }
          // Push the heading itself as a standalone block so
          // getParagraphBlock can match the heading regex correctly.
          blocks.push(getParagraphBlock(line.trim()))
          subBuffer = ''
        } else {
          subBuffer += (subBuffer ? '\n' : '') + line
        }
      }
      if (subBuffer.trim()) {
        blocks.push(getParagraphBlock(subBuffer.trim()))
      }
    }
  }

  let textBuffer = ''

  while (i < lines.length) {
    const line = lines[i]!

    // ── Fenced code block ──────────────────────────────────────
    if (isFenceOpen(line)) {
      flushTextBuffer(textBuffer)
      textBuffer = ''
      const lang = getFenceLang(line)
      const codeLines: string[] = []
      i++
      while (i < lines.length && !isFenceClose(lines[i]!)) {
        codeLines.push(lines[i]!)
        i++
      }
      const code = codeLines.join('\n')
      if (lang.toLowerCase() === 'mermaid') {
        blocks.push({
          kind: 'mermaid',
          code,
          estimatedHeight: Math.max(180, 180 + (codeLines.length - 4) * 20),
        } as MermaidDisplayBlock)
      } else {
        blocks.push({
          kind: 'code',
          language: lang,
          code,
        } as CodeBlock)
      }
      i++ // skip closing fence
      continue
    }

    // ── Math block ($$ ... $$) ─────────────────────────────────
    if (line.trim() === '$$') {
      flushTextBuffer(textBuffer)
      textBuffer = ''
      const mathLines: string[] = []
      i++
      while (i < lines.length && lines[i]!.trim() !== '$$') {
        mathLines.push(lines[i]!)
        i++
      }
      blocks.push({
        kind: 'mathBlock',
        formula: mathLines.join('\n'),
      } as MathDisplayBlock)
      i++ // skip closing $$
      continue
    }

    // ── Table (consecutive |...| lines) ────────────────────────
    if (isTableLine(line)) {
      flushTextBuffer(textBuffer)
      textBuffer = ''
      const tableLines: string[] = [line]
      i++
      while (i < lines.length && isTableLine(lines[i]!)) {
        tableLines.push(lines[i]!)
        i++
      }
      if (tableLines.length >= 2) {
        const headers = splitTableCells(tableLines[0]!)
        const alignments = parseTableAlignments(tableLines[1]!)
        const rows = tableLines.slice(2).map(splitTableCells)
        blocks.push({
          kind: 'table',
          headers,
          alignments,
          rows,
        } as TableDisplayBlock)
      } else {
        // Single |line| — treat as body text
        blocks.push(getParagraphBlock(line))
      }
      continue
    }

    // ── Column container (:::left / :::right / :::center ... :::) ──
    const colMatch = line.trim().match(/^:::(left|right|center)\s*$/)
    if (colMatch) {
      flushTextBuffer(textBuffer)
      textBuffer = ''
      const colType = colMatch[1]!
      const colLines: string[] = []
      i++
      while (i < lines.length && lines[i]!.trim() !== ':::') {
        colLines.push(lines[i]!)
        i++
      }
      i++ // skip closing :::

      if (colType === 'center') {
        // Center column: parse content and center each block
        const innerBlocks = parseInputBlocks(colLines.join('\n'))
        for (const b of innerBlocks) blocks.push(b)
      } else if (colType === 'left') {
        // Look ahead for :::right partner
        const rightLines: string[] = []
        if (i < lines.length && lines[i]!.trim() === ':::right') {
          i++
          while (i < lines.length && lines[i]!.trim() !== ':::') {
            rightLines.push(lines[i]!)
            i++
          }
          i++ // skip closing :::
        }
        const leftBlocks = parseInputBlocks(colLines.join('\n'))
        const rightBlocks = rightLines.length > 0
          ? parseInputBlocks(rightLines.join('\n'))
          : []
        blocks.push({
          kind: 'columnContainer',
          leftBlocks,
          rightBlocks,
        } as ColumnContainerBlock)
      } else {
        // :::right without preceding :::left — treat as single column
        const innerBlocks = parseInputBlocks(colLines.join('\n'))
        for (const b of innerBlocks) blocks.push(b)
      }
      continue
    }

    // ── Regular text ───────────────────────────────────────────
    // If the line is a heading and the buffer already has content,
    // flush the buffer first so the heading starts its own block.
    if (isHeadingLine(line) && textBuffer.trim()) {
      flushTextBuffer(textBuffer)
      textBuffer = ''
    }
    textBuffer += (textBuffer ? '\n' : '') + line
    i++
  }

  // Flush remaining text
  flushTextBuffer(textBuffer)
  return blocks
}

// ═══════════════════════════════════════════════════════════════════════════
// Paragraph serialization
// ═══════════════════════════════════════════════════════════════════════════

function serializeParagraphBlock(raw: string, kind: ParagraphBlock['kind']): string {
  const trimmed = raw.trim()
  if (kind === 'divider') return '---'
  if (!trimmed) return ''
  if (kind === 'quote') return `> ${trimmed}`
  if (kind === 'subheading') return `# ${trimmed}`
  return trimmed
}

function serializeInlineTokens(tokens: InlineToken[]): string {
  return tokens
    .map((t) => {
      // Order matters: bold (**) before italic (*) to avoid ambiguity
      if (t.bold) return `**${t.text}**`
      if (t.italic) return `*${t.text}*`
      if (t.mark) return `==${t.text}==`
      if (t.underline) return `^${t.text}^`
      return t.text
    })
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim()
}

// ═══════════════════════════════════════════════════════════════════════════
// Paragraph splitting
// ═══════════════════════════════════════════════════════════════════════════

/** Split a long paragraph into chunks of ~chunkSize characters. */
function splitLongParagraph(raw: string, chunkSize: number): string[] {
  const text = raw.trim()
  if (text.length <= chunkSize + 40) return [text]

  // Try to split by manual line breaks first
  const manualLines = text.split('\n')
  if (manualLines.length > 1) {
    const chunks: string[] = []
    let current = ''
    for (const line of manualLines) {
      const candidate = current ? `${current}\n${line}` : line
      if (candidate.length > chunkSize && current) {
        chunks.push(current.trim())
        current = line
      } else {
        current = candidate
      }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
  }

  // Split by sentence boundaries
  const sentences = text
    .split(/(?<=[。！？!?；;])/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentences.length <= 1) {
    const slices: string[] = []
    let cursor = 0
    while (cursor < text.length) {
      slices.push(text.slice(cursor, cursor + chunkSize).trim())
      cursor += chunkSize
    }
    return slices.filter(Boolean)
  }

  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    const candidate = `${current}${sentence}`
    if (candidate.length > chunkSize && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = candidate
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function splitParagraphBySentence(text: string): string[] {
  if (/\*\*|==/.test(text)) return [text]
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return text
    .split(/(?<=[。！？!?；;])/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitParagraphBlockBySentence(block: ParagraphBlock, sourceText: string) {
  const sourceRaw = block.kind === 'body' ? sourceText.trim() : block.raw
  return {
    parts: splitParagraphBySentence(sourceRaw),
    separator: sourceRaw.includes('\n') ? '\n' : '',
    serialize: (raw: string) => serializeParagraphBlock(raw, block.kind),
  }
}

function splitInlineLines(
  lines: InlineLine[],
  count: number,
): {
  takenRaw: (kind: ParagraphBlock['kind']) => string
  restRaw: (kind: ParagraphBlock['kind']) => string
} {
  const taken = lines.slice(0, count)
  const rest = lines.slice(count)
  return {
    takenRaw: (kind) =>
      serializeParagraphBlock(
        serializeInlineTokens(taken.flatMap((l) => l.tokens)),
        kind,
      ),
    restRaw: (kind) =>
      serializeParagraphBlock(
        serializeInlineTokens(rest.flatMap((l) => l.tokens)),
        kind,
      ),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Block height estimation (for non-text blocks)
// ═══════════════════════════════════════════════════════════════════════════

/** Estimate the rendered height of a non-text block for layout purposes. */
function estimateBlockHeight(block: Block, bodySize: number): number {
  switch (block.kind) {
    case 'code': {
      const cb = block as CodeBlock
      // Use measureCodeBlock which now accounts for line wrapping.
      // This ensures the layout engine and renderer agree on height.
      try {
        const { height } = measureCodeBlock(cb, bodySize)
        return height
      } catch {
        // Fallback: rough estimate if measurement fails
        const lineCount = cb.code.split('\n').length
        const monoSize = bodySize * 0.92
        const monoLineHeight = monoSize * 1.5
        return 32 + lineCount * monoLineHeight
      }
    }
    case 'mathBlock':
      return 60 // placeholder — will be refined during measurement
    case 'mermaid': {
      const mb = block as MermaidDisplayBlock
      return mb.estimatedHeight
    }
    case 'table': {
      const tb = block as TableDisplayBlock
      return 20 + (tb.rows.length + 1) * (bodySize * 1.8)
    }
    case 'columnContainer': {
      const cc = block as ColumnContainerBlock
      const leftH = cc.leftBlocks.reduce((h, b) =>
        h + estimateBlockHeight(b, bodySize) + 10, 0)
      const rightH = cc.rightBlocks.reduce((h, b) =>
        h + estimateBlockHeight(b, bodySize) + 10, 0)
      return Math.max(leftH, rightH) + 20
    }
    default:
      return 40
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Title comparison
// ═══════════════════════════════════════════════════════════════════════════

function normalizeComparableText(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/[*_~`#]/g, '')
    .toLowerCase()
}

function parseTitleMarkupForPlain(raw: string): string {
  return raw.replace(/\*\*([\s\S]+?)\*\*/g, '$1').trim()
}

// ═══════════════════════════════════════════════════════════════════════════
// Main pagination engine
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Layout markdown source text into card pages.
 *
 * Algorithm:
 * 1. Parse markdown source into paragraph blocks
 * 2. Remove duplicate title from body
 * 3. Pre-split long paragraphs (>180 chars)
 * 4. Accumulate paragraphs on each page by measuring heights
 * 5. When overflow: try sentence split → try line split → carry-over
 */
export function layoutPages(opts: LayoutOptions): CardPage[] {
  const { source, manualTitle, settings, theme, footerEnabled } = opts
  const bodyFontFamily = getBodyFontFamily(settings.bodyFontMode)

  const allBlocks = parseInputBlocks(source)
  const title = manualTitle.trim()
  const renderableTitle = parseTitleMarkupForPlain(title)

  // Remove duplicate title from first body block
  if (
    renderableTitle &&
    allBlocks.length > 0 &&
    allBlocks[0]!.kind === 'body' &&
    normalizeComparableText(allBlocks[0]!.raw) ===
      normalizeComparableText(renderableTitle)
  ) {
    allBlocks.shift()
  }

  if (allBlocks.length === 0) {
    return [
      {
        id: 'page-1',
        kind: 'body',
        title: '',
        blocks: [{ kind: 'body', raw: '在左侧输入内容后，这里会生成卡片。' }],
      },
    ]
  }

  // Pre-split long text paragraphs
  const expandedParagraphs: Block[] = []
  for (const block of allBlocks) {
    if (block.kind === 'body' || block.kind === 'quote' || block.kind === 'subheading') {
      const chunkSize = 180
      const tb = block as TextBlock
      if (tb.raw.length <= chunkSize + 40) {
        expandedParagraphs.push(block)
      } else {
        const chunks = splitLongParagraph(tb.raw, chunkSize)
        for (const chunk of chunks) {
          expandedParagraphs.push(getParagraphBlock(serializeParagraphBlock(chunk, tb.kind)))
        }
      }
    } else {
      // Non-text blocks (code, math, mermaid, table, column) — keep as-is
      expandedParagraphs.push(block)
    }
  }

  const pages: CardPage[] = []
  let currentParagraph = 0
  let carryParagraph: string | null = null
  let carryBlock: Block | null = null
  /** Track whether the carried block came from an expanded-paragraph split. */
  let carryPendingWasSplit = false
  const pendingCarries: string[] = []
  const pendingWasSplits: boolean[] = []

  while (
    currentParagraph < expandedParagraphs.length ||
    carryParagraph ||
    carryBlock
  ) {
    const isCarriedBlock = Boolean(carryBlock)
    const currentBlock: Block | null = isCarriedBlock
      ? carryBlock!
      : carryParagraph
        ? getParagraphBlock(carryParagraph)
        : (expandedParagraphs[currentParagraph] ?? null)
    if (!currentBlock) break

    const pageKind =
      pages.length === 0 && title ? 'cover' : 'body'
    const page: CardPage = {
      id: `page-${pages.length + 1}`,
      kind: pageKind,
      title: pageKind === 'cover' ? title : '',
      blocks: [],
    }

    const metrics = getPosterMetrics(page, settings, footerEnabled)
    let cursorY = metrics.bodyTopY
    let previousBlock: ParagraphBlock | null = null

    // ── Inner loop: fill current page ──────────────────────────

    while (true) {
      // Determine what to process next
      let nextBlock: Block | null = null
      let nextIsCarried = false

      if (carryBlock) {
        nextBlock = carryBlock
        nextIsCarried = true
      } else if (carryParagraph) {
        nextBlock = getParagraphBlock(carryParagraph)
        nextIsCarried = true
      } else if (currentParagraph < expandedParagraphs.length) {
        nextBlock = expandedParagraphs[currentParagraph]!
        nextIsCarried = false
      } else {
        break // no more blocks
      }

      const block = nextBlock

      // ── For non-text blocks: measure and fit atomically ─────
      if (block.kind === 'code' || block.kind === 'mathBlock' ||
          block.kind === 'mermaid' || block.kind === 'table' ||
          block.kind === 'columnContainer') {
        // Estimate height for non-text blocks
        const estHeight = estimateBlockHeight(block, metrics.bodySize)
        const blockTop = cursorY + getGapBetweenBlocks(previousBlock, { kind: 'body', raw: '' }, metrics)
        const blockBottom = blockTop + estHeight

        if (blockBottom <= metrics.bodyBottomY || page.blocks.length === 0) {
          page.blocks.push(block)
          cursorY = blockBottom
          previousBlock = { kind: 'body', raw: '' } // generic previous
          if (nextIsCarried) {
            carryBlock = null
            carryParagraph = null
          } else {
            currentParagraph++
          }
          continue
        }
        // Doesn't fit — if page has content, move to next page
        if (page.blocks.length > 0) break
        // Empty page — push it anyway (block is taller than page)
        page.blocks.push(block)
        if (!nextIsCarried) currentParagraph++
        continue
      }

      // ── For text blocks: existing measurement + splitting ──
      // If the block came from expandedParagraphs (not a carry), use it directly
      // to preserve headingLevel and block kind.  Carry text is re-serialized
      // with kind prefixes so re-parsing is safe.
      const blockRaw = (block as TextBlock).raw
      const paraBlock: TextBlock = (nextIsCarried || (block as TextBlock).kind === 'body')
        ? getParagraphBlock(blockRaw)
        : (block as TextBlock)
      const currentText = blockRaw
      const leadingGap = getGapBetweenBlocks(previousBlock, paraBlock, metrics)
      const { lines, height } = measureParagraphBlock(
        paraBlock,
        metrics.bodySize,
        metrics.bodyLineHeight,
        metrics.bodyWidth,
        theme,
        settings.subheadingStyle,
        bodyFontFamily,
      )
      const blockTop = cursorY + leadingGap
      const blockBottom = blockTop + height

      // Block fits entirely
      if (blockBottom <= metrics.bodyBottomY) {
        page.blocks.push(paraBlock)
        cursorY = blockBottom
        previousBlock = paraBlock
        if (nextIsCarried) {
          carryParagraph = null
          carryBlock = null
          if (!carryPendingWasSplit) {
            // carryParagraph source was already advanced
          }
          carryPendingWasSplit = false
        } else {
          currentParagraph++
        }
        continue
      }

      // ── Doesn't fit — try sentence-level split ──────────────
      const sentenceSplit = splitParagraphBlockBySentence(paraBlock, currentText)
      if (sentenceSplit.parts.length > 1) {
        let fittedRaw = ''
        let fittedCount = 0
        let fittedHeight = 0
        let gapRestRaw = ''
        for (const sentence of sentenceSplit.parts) {
          const candidateRaw = fittedRaw
            ? `${fittedRaw}${sentenceSplit.separator}${sentence}`
            : sentence
          const candidate = sentenceSplit.serialize(candidateRaw)
          const candidateBlock = getParagraphBlock(candidate)
          const { height: candidateHeight } = measureParagraphBlock(
            candidateBlock,
            metrics.bodySize,
            metrics.bodyLineHeight,
            metrics.bodyWidth,
            theme,
            settings.subheadingStyle,
          )
          if (blockTop + candidateHeight <= metrics.bodyBottomY) {
            fittedRaw = candidateRaw
            fittedCount++
            fittedHeight = candidateHeight
            continue
          }
          // Try line-level gap fill
          const gapTop = blockTop + fittedHeight
          const gapHeight = metrics.bodyBottomY - gapTop
          if (gapHeight > 0) {
            const sentenceOnly = sentenceSplit.serialize(sentence)
            const sentenceBlock = getParagraphBlock(sentenceOnly)
            const maxGapLines = getParagraphMaxLines(
              sentenceBlock, gapHeight, metrics.bodySize, metrics.bodyLineHeight,
              theme, settings.subheadingStyle,
            )
            if (maxGapLines > 0) {
              const { lines: sLines } = measureParagraphBlock(
                sentenceBlock, metrics.bodySize, metrics.bodyLineHeight,
                metrics.bodyWidth, theme, settings.subheadingStyle,
              )
              const gapFill = splitInlineLines(sLines, maxGapLines)
              const gapTaken = gapFill.takenRaw(sentenceBlock.kind)
              if (gapTaken) {
                const combinedRaw = `${fittedRaw}${sentenceSplit.separator}${gapTaken}`
                const combined = sentenceSplit.serialize(combinedRaw)
                fittedRaw = combinedRaw
                fittedCount++
                fittedHeight = (measureParagraphBlock(
                  getParagraphBlock(combined), metrics.bodySize, metrics.bodyLineHeight,
                  metrics.bodyWidth, theme, settings.subheadingStyle,
                )).height
                gapRestRaw = serializeInlineTokens(
                  sLines.slice(maxGapLines).flatMap((l) => l.tokens),
                )
              }
            }
          }
          break
        }

        if (fittedRaw) {
          const fittedText = sentenceSplit.serialize(fittedRaw)
          page.blocks.push(getParagraphBlock(fittedText))
          previousBlock = getParagraphBlock(fittedText)
          cursorY = blockTop + fittedHeight

          const remainingSentences = sentenceSplit.parts.slice(fittedCount)
          const carryParts = [gapRestRaw, ...remainingSentences].filter(Boolean)
          const rest = carryParts.length > 0
            ? sentenceSplit.serialize(carryParts.join(sentenceSplit.separator).trim())
            : ''
          if (rest) {
            pendingCarries.push(rest)
            pendingWasSplits.push(!nextIsCarried)
          }
          if (nextIsCarried) {
            carryParagraph = null
            carryBlock = null
          } else {
            currentParagraph++
          }
          continue
        }
      }

      // ── Line-level fill on non-empty page ───────────────────
      if (page.blocks.length > 0) {
        const fillHeight = metrics.bodyBottomY - blockTop
        if (fillHeight > 0) {
          const fillMaxLines = getParagraphMaxLines(
            paraBlock, fillHeight, metrics.bodySize, metrics.bodyLineHeight,
            theme, settings.subheadingStyle,
          )
          if (fillMaxLines > 0) {
            const { takenRaw, restRaw } = splitInlineLines(lines, fillMaxLines)
            const fillTaken = takenRaw(paraBlock.kind)
            if (fillTaken) {
              page.blocks.push(getParagraphBlock(fillTaken))
              cursorY = blockTop + (measureParagraphBlock(
                getParagraphBlock(fillTaken), metrics.bodySize, metrics.bodyLineHeight,
                metrics.bodyWidth, theme, settings.subheadingStyle, bodyFontFamily,
              )).height
              previousBlock = getParagraphBlock(fillTaken)
              const fillRest = restRaw(paraBlock.kind)
              if (fillRest) {
                pendingCarries.push(fillRest)
                pendingWasSplits.push(!nextIsCarried)
              }
              if (nextIsCarried) {
                carryParagraph = null
                carryBlock = null
              } else {
                currentParagraph++
              }
              continue
            }
          }
        }
        break
      }

      // ── Empty page — line-level split ───────────────────────
      const remainingHeight = metrics.bodyBottomY - blockTop
      const maxLines = getParagraphMaxLines(
        paraBlock, remainingHeight, metrics.bodySize, metrics.bodyLineHeight,
        theme, settings.subheadingStyle,
      )
      if (maxLines <= 0) break
      const { takenRaw, restRaw } = splitInlineLines(lines, maxLines)
      const taken = takenRaw(paraBlock.kind)
      const rest = restRaw(paraBlock.kind)
      if (taken) {
        page.blocks.push(getParagraphBlock(taken))
        const takenBlock = getParagraphBlock(taken)
        cursorY = blockTop + (measureParagraphBlock(
          takenBlock, metrics.bodySize, metrics.bodyLineHeight,
          metrics.bodyWidth, theme, settings.subheadingStyle, bodyFontFamily,
        )).height
        previousBlock = takenBlock
      }
      if (rest) {
        pendingCarries.push(rest)
        pendingWasSplits.push(!nextIsCarried)
      }
      if (nextIsCarried) {
        carryParagraph = null
        carryBlock = null
      } else {
        currentParagraph++
      }
      continue
    }

    // ── Move next pending carry into active carry ─────────────
    if (pendingCarries.length > 0) {
      carryParagraph = pendingCarries.shift()!
      carryBlock = null
      carryPendingWasSplit = pendingWasSplits.shift()!
    } else {
      carryParagraph = null
      carryBlock = null
    }

    pages.push(page)
    if (pages.length > 60) break
  }

  return pages
}
