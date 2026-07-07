// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — intelligent pagination engine
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CardPage,
  InlineLine,
  ParagraphBlock,
  InlineToken,
  LayoutOptions,
} from './types'
import {
  getPosterMetrics,
  getGapBetweenBlocks,
  measureParagraphBlock,
  getParagraphMaxLines,
} from './measure'

// ═══════════════════════════════════════════════════════════════════════════
// Markdown block classification
// ═══════════════════════════════════════════════════════════════════════════

function isMarkdownDividerLine(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())
}

/** Classify a raw text line into a ParagraphBlock. */
export function getParagraphBlock(text: string): ParagraphBlock {
  const trimmed = text.trim()
  if (isMarkdownDividerLine(trimmed)) {
    return { kind: 'divider', raw: '' }
  }
  const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/)
  if (headingMatch) {
    return { kind: 'subheading', raw: headingMatch[1]!.trim() }
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

/** Parse raw markdown source into paragraph lines. */
function parseInput(raw: string): { paragraphs: string[] } {
  const lines = raw.split('\n')
  const paragraphs: string[] = []
  let buffer = ''

  for (const line of lines) {
    if (line.trim() === '') {
      if (buffer.trim()) {
        paragraphs.push(buffer.trim())
        buffer = ''
      }
    } else {
      buffer += (buffer ? '\n' : '') + line
    }
  }
  if (buffer.trim()) paragraphs.push(buffer.trim())
  return { paragraphs }
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
      if (t.bold) return `**${t.text}**`
      if (t.mark) return `==${t.text}==`
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

  const parsed = parseInput(source)
  const title = manualTitle.trim()
  const renderableTitle = parseTitleMarkupForPlain(title)

  let sourceParagraphs = parsed.paragraphs.filter(
    (p) => p.trim().length > 0,
  )

  // Remove duplicate title from body
  if (
    renderableTitle &&
    sourceParagraphs.length > 0 &&
    normalizeComparableText(sourceParagraphs[0]!) ===
      normalizeComparableText(renderableTitle)
  ) {
    sourceParagraphs = sourceParagraphs.slice(1)
  }

  if (sourceParagraphs.length === 0) {
    return [
      {
        id: 'page-1',
        kind: 'body',
        title: '',
        paragraphs: ['在左侧输入内容后，这里会生成卡片。'],
      },
    ]
  }

  // Pre-split long paragraphs
  const expandedParagraphs = sourceParagraphs.flatMap((paragraph) => {
    const chunkSize = 180
    const block = getParagraphBlock(paragraph)
    if (block.raw.length <= chunkSize + 40) return [paragraph]
    return splitLongParagraph(block.raw, chunkSize).map((chunk) =>
      serializeParagraphBlock(chunk, block.kind),
    )
  })

  const pages: CardPage[] = []
  let currentParagraph = 0
  let carryParagraph = ''
  /**
   * FIFO queue of paragraph remainders produced by sentence / line splits.
   * Each entry is a piece of text that must start a future page.
   * Separate from `carryParagraph` so the inner loop can continue adding
   * paragraphs after a split without re-processing the remainder on the
   * same page — multiple splits on one page each push here in order.
   */
  const pendingCarries: string[] = []
  /**
   * Parallel queue to `pendingCarries`. When an entry is `true` the
   * remainder was produced by splitting an expandedParagraphs item
   * (`wasCarrying` was false), so `currentParagraph` was already advanced
   * past the original item. Consuming that carry on a later page must NOT
   * advance `currentParagraph` again.
   */
  const pendingWasSplits: boolean[] = []
  /**
   * The `pendingWasSplit` value for the CURRENT `carryParagraph`.
   * Set when a pendingCarry is shifted into `carryParagraph` at the end
   * of the previous page. Must live outside the outer loop so it survives
   * across page iterations.
   */
  let carryPendingWasSplit = false

  while (
    currentParagraph < expandedParagraphs.length ||
    carryParagraph
  ) {
    const kind =
      pages.length === 0 && title ? 'cover' : 'body'
    const page: CardPage = {
      id: `page-${pages.length + 1}`,
      kind,
      title: kind === 'cover' ? title : '',
      paragraphs: [],
    }

    const metrics = getPosterMetrics(page, settings, footerEnabled)
    let cursorY = metrics.bodyTopY
    let previousBlock: ParagraphBlock | null = null

    while (
      currentParagraph < expandedParagraphs.length ||
      carryParagraph
    ) {
      const wasCarrying = Boolean(carryParagraph)
      const currentText = wasCarrying
        ? carryParagraph
        : expandedParagraphs[currentParagraph]!
      const block = getParagraphBlock(currentText)
      const leadingGap = getGapBetweenBlocks(previousBlock, block, metrics)
      const { lines, height } = measureParagraphBlock(
        block,
        metrics.bodySize,
        metrics.bodyLineHeight,
        metrics.bodyWidth,
        theme,
        settings.subheadingStyle,
      )
      const blockTop = cursorY + leadingGap
      const blockBottom = blockTop + height

      // Block fits entirely
      if (blockBottom <= metrics.bodyBottomY) {
        page.paragraphs.push(currentText)
        cursorY = blockBottom
        previousBlock = block
        if (wasCarrying) {
          carryParagraph = ''
          if (!carryPendingWasSplit) {
            currentParagraph += 1
          }
          carryPendingWasSplit = false
        } else {
          currentParagraph += 1
        }
        continue
      }

      // ── Paragraph doesn't fit — try sentence-level split ──────────
      const sentenceSplit = splitParagraphBlockBySentence(
        block,
        currentText,
      )
      if (sentenceSplit.parts.length > 1) {
        let fittedRaw = ''
        let fittedCount = 0
        let fittedHeight = 0
        /** Remainder text from line-level gap-fill of the overflowing sentence (raw). */
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
            fittedCount += 1
            fittedHeight = candidateHeight
            continue
          }

          // ── This sentence overflows — try line-level split to fill the gap ──
          // Measure the vertical gap remaining after previously-fitted sentences.
          const gapTop = blockTop + fittedHeight
          const gapHeight = metrics.bodyBottomY - gapTop
          if (gapHeight > 0) {
            const sentenceOnly = sentenceSplit.serialize(sentence)
            const sentenceBlock = getParagraphBlock(sentenceOnly)
            const maxGapLines = getParagraphMaxLines(
              sentenceBlock,
              gapHeight,
              metrics.bodySize,
              metrics.bodyLineHeight,
              theme,
              settings.subheadingStyle,
            )
            if (maxGapLines > 0) {
              const { lines: sLines } = measureParagraphBlock(
                sentenceBlock,
                metrics.bodySize,
                metrics.bodyLineHeight,
                metrics.bodyWidth,
                theme,
                settings.subheadingStyle,
              )
              const gapFill = splitInlineLines(sLines, maxGapLines)
              const gapTaken = gapFill.takenRaw(sentenceBlock.kind)
              if (gapTaken) {
                // Merge the line-fill portion with previously fitted sentences.
                // This keeps it as ONE paragraph → no spurious gap in the renderer.
                const combinedRaw = `${fittedRaw}${sentenceSplit.separator}${gapTaken}`
                const combined = sentenceSplit.serialize(combinedRaw)
                const combinedBlock = getParagraphBlock(combined)
                const { height: combinedHeight } = measureParagraphBlock(
                  combinedBlock,
                  metrics.bodySize,
                  metrics.bodyLineHeight,
                  metrics.bodyWidth,
                  theme,
                  settings.subheadingStyle,
                )
                fittedRaw = combinedRaw
                fittedCount += 1 // mark this sentence as partially consumed
                fittedHeight = combinedHeight
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
          const fittedBlock = getParagraphBlock(fittedText)
          page.paragraphs.push(fittedText)
          previousBlock = fittedBlock
          cursorY = blockTop + fittedHeight

          // Build carry: gapRestRaw (line-level remainder from partially
          // consumed sentence) + any sentences after fittedCount.
          // Both are raw text — serialize ONCE at the end.
          const remainingSentences = sentenceSplit.parts.slice(fittedCount)
          const carryParts = [gapRestRaw, ...remainingSentences].filter(Boolean)
          const rest = carryParts.length > 0
            ? sentenceSplit.serialize(
                carryParts.join(sentenceSplit.separator).trim(),
              )
            : ''

          // Enqueue remainder for the next page; continue trying to fit
          // more expandedParagraphs items on the current page.
          if (rest) {
            pendingCarries.push(rest)
            pendingWasSplits.push(!wasCarrying)
          }
          if (wasCarrying) {
            carryParagraph = ''
          } else {
            currentParagraph += 1
          }
          continue
        }
      }

      // ── No sentence fit — try line-level fill on non-empty page ──
      // Even if the page already has content, we attempt a line-level
      // split of this paragraph to fill every last pixel before the
      // boundary.  Every paragraph on every page reaches bodyBottomY.
      if (page.paragraphs.length > 0) {
        const fillHeight = metrics.bodyBottomY - blockTop
        if (fillHeight > 0) {
          const fillMaxLines = getParagraphMaxLines(
            block,
            fillHeight,
            metrics.bodySize,
            metrics.bodyLineHeight,
            theme,
            settings.subheadingStyle,
          )
          if (fillMaxLines > 0) {
            const { takenRaw: fillTakenRaw, restRaw: fillRestRaw } =
              splitInlineLines(lines, fillMaxLines)
            const fillTaken = fillTakenRaw(block.kind)
            if (fillTaken) {
              const fillBlock = getParagraphBlock(fillTaken)
              const { height: fillHeightMeasured } = measureParagraphBlock(
                fillBlock,
                metrics.bodySize,
                metrics.bodyLineHeight,
                metrics.bodyWidth,
                theme,
                settings.subheadingStyle,
              )
              page.paragraphs.push(fillTaken)
              cursorY = blockTop + fillHeightMeasured
              previousBlock = fillBlock

              const fillRest = fillRestRaw(block.kind)
              if (fillRest) {
                pendingCarries.push(fillRest)
                pendingWasSplits.push(!wasCarrying)
              }
              if (wasCarrying) {
                carryParagraph = ''
              } else {
                currentParagraph += 1
              }
              continue
            }
          }
        }
        break
      }

      // ── Page is empty — try line-level split ──────────────────────
      const remainingHeight = metrics.bodyBottomY - blockTop
      const maxLines = getParagraphMaxLines(
        block,
        remainingHeight,
        metrics.bodySize,
        metrics.bodyLineHeight,
        theme,
        settings.subheadingStyle,
      )
      if (maxLines <= 0) break

      const { takenRaw, restRaw } = splitInlineLines(lines, maxLines)
      const taken = takenRaw(block.kind)
      const rest = restRaw(block.kind)
      if (taken) {
        page.paragraphs.push(taken)

        // Measure the taken portion's height for cursor tracking
        const takenBlock = getParagraphBlock(taken)
        const { height: takenHeight } = measureParagraphBlock(
          takenBlock,
          metrics.bodySize,
          metrics.bodyLineHeight,
          metrics.bodyWidth,
          theme,
          settings.subheadingStyle,
        )
        cursorY = blockTop + takenHeight
        previousBlock = takenBlock
      }

      if (rest) {
        pendingCarries.push(rest)
        pendingWasSplits.push(!wasCarrying)
      }
      if (wasCarrying) {
        carryParagraph = ''
      } else {
        // Always advance past the expandedParagraphs item we just split.
        // `pendingWasSplits` queue entry will prevent double-advance when
        // the carry is consumed on a later page.
        currentParagraph += 1
      }
      // After a line split on an empty page, try to fit more content
      continue
    }

    // ── Move next pending split remainder into carry for the next page ──
    if (pendingCarries.length > 0) {
      carryParagraph = pendingCarries.shift()!
      carryPendingWasSplit = pendingWasSplits.shift()!
    }

    pages.push(page)
    if (pages.length > 60) break // safety cap
  }

  return pages
}
