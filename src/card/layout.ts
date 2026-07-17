// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 智能分页引擎
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
  TableDisplayBlock,
  ColumnContainerBlock,
  ListBlock,
  ListItem,
  HeadingLevel,
} from './types'
import {
  getPosterMetrics,
  getGapBetweenBlocks,
  measureParagraphBlock,
  getParagraphMaxLines,
  measureListBlock,
} from './measure'
import { measureCodeBlock } from './code-renderer'
import { getBodyFontFamily, BODY_TEXT_WEIGHT } from './types'
import type { ThemeDefinition } from './types'

// ═══════════════════════════════════════════════════════════════════════════
// Markdown 块分类
// ═══════════════════════════════════════════════════════════════════════════

function isMarkdownDividerLine(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())
}

/** 检查一行是否以 markdown 标题开头。 */
function isHeadingLine(line: string): boolean {
  return /^#{1,6}\s+\S/.test(line.trim())
}

/** 将原始文本行分类为 TextBlock。 */
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

// ── List detection helpers ─────────────────────────────────────────────────

/** 匹配无序列表项：`- `, `* `, `+ ` 开头 */
const UNORDERED_LIST_RE = /^(\s*)([-*+])\s+(.+)$/

/** 匹配有序列表项：`1. `, `1) ` 等开头 */
const ORDERED_LIST_RE = /^(\s*)(\d+)([.)])\s+(.+)$/

/** 检查一行是否为列表项（有序或无序）。 */
function isListItemLine(line: string): boolean {
  return UNORDERED_LIST_RE.test(line) || ORDERED_LIST_RE.test(line)
}

/** 检查是否为无序列表项。 */
function isUnorderedListItem(line: string): boolean {
  return UNORDERED_LIST_RE.test(line)
}

/** 从列表项行中提取缩进层级（每 2 个空格算一级）。 */
function getListItemIndent(line: string): number {
  const match = line.match(/^(\s*)/)
  const spaces = match ? match[1]!.length : 0
  return Math.floor(spaces / 2)
}

/** 从列表项行中提取纯文本内容。 */
function getListItemText(line: string): string {
  const uMatch = line.match(UNORDERED_LIST_RE)
  if (uMatch) return uMatch[3]!.trim()
  const oMatch = line.match(ORDERED_LIST_RE)
  if (oMatch) return oMatch[4]!.trim()
  return line.trim()
}

// ═══════════════════════════════════════════════════════════════════════════
// 输入解析
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 块级解析器（状态机）
// ═══════════════════════════════════════════════════════════════════════════

/** 检测打开围栏代码块的行。 */
function isFenceOpen(line: string): boolean {
  return /^```\S*$/.test(line.trim()) || /^~~~\S*$/.test(line.trim())
}

/** 检测关闭围栏代码块的行。 */
function isFenceClose(line: string): boolean {
  const t = line.trim()
  return t === '```' || t === '~~~'
}

/** 从围栏起始符中提取语言标识符（例如 "```js" → "js"）。 */
function getFenceLang(line: string): string {
  const m = line.trim().match(/^```(\S+)$/)
  return m ? m[1]! : ''
}

/** 检测管道表格行（以 | 开头和结尾）。 */
function isTableLine(line: string): boolean {
  return /^\|.*\|$/.test(line.trim())
}

/** 解析表格分隔行以提取对齐方式。 */
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

/** 将管道表格单元格行分割为单个单元格。 */
function splitTableCells(line: string): string[] {
  return line
    .trim()
    .split('|')
    .filter((_, i, arr) => i > 0 && i < arr.length - 1) // skip outer empty
    .map((c) => c.trim())
}

/**
 * 状态机解析器，将原始 markdown 源文本转换为 Block[]。
 *
 * 处理多行结构：
 * - 围栏代码块 (``` ... ```)
 * - 表格 (连续的 |...| 行)
 * - 列容器 (:::left / :::right ... :::)
 * - 普通文本（按空行分割，通过 getParagraphBlock 分类）
 */
export function parseInputBlocks(raw: string): Block[] {
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
    // 首先按空行分割（标准段落分隔）
    const paragraphs = trimmed.split(/\n{2,}/)
    for (const para of paragraphs) {
      if (!para.trim()) continue

      // 在段落内按标题边界分割：
// 以 # 开头的行应始终形成自己的块，
// 即使它是第一行（前面没有需要刷新的文本）。
      const lines = para.split('\n')
      let subBuffer = ''
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]!
        if (isHeadingLine(line)) {
          // 在推送此标题之前刷新所有累积的文本
          if (subBuffer.trim()) {
            blocks.push(getParagraphBlock(subBuffer.trim()))
          }
          // 将标题本身作为独立块推送，以便
// getParagraphBlock 能正确匹配标题正则表达式。
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
          kind: 'code',
          language: 'mermaid',
          code,
        } as CodeBlock)
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
        // 单个 |行| — 作为正文文本处理
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
        // 居中列：解析内容并将每个块居中
        const innerBlocks = parseInputBlocks(colLines.join('\n'))
        for (const b of innerBlocks) blocks.push(b)
      } else if (colType === 'left') {
        // 向前查找 :::right 配对
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

    // ── List block (consecutive list items) ──────────────────────
    if (isListItemLine(line)) {
      flushTextBuffer(textBuffer)
      textBuffer = ''
      const listItems: ListItem[] = []
      const isOrdered = !isUnorderedListItem(line)

      while (i < lines.length && isListItemLine(lines[i]!)) {
        const itemLine = lines[i]!
        listItems.push({
          text: getListItemText(itemLine),
          indent: getListItemIndent(itemLine),
        })
        i++
      }

      blocks.push({
        kind: isOrdered ? 'orderedList' : 'unorderedList',
        items: listItems,
      } as ListBlock)
      continue
    }

    // ── Regular text ───────────────────────────────────────────
    // 如果该行是标题且缓冲区已有内容，
// 先刷新缓冲区，使标题从自己的块开始。
    if (isHeadingLine(line) && textBuffer.trim()) {
      flushTextBuffer(textBuffer)
      textBuffer = ''
    }
    textBuffer += (textBuffer ? '\n' : '') + line
    i++
  }

  // 刷新剩余文本
  flushTextBuffer(textBuffer)
  return blocks
}

// ═══════════════════════════════════════════════════════════════════════════
// 段落序列化
// ═══════════════════════════════════════════════════════════════════════════

function serializeParagraphBlock(raw: string, kind: ParagraphBlock['kind'], headingLevel?: number): string {
  const trimmed = raw.trim()
  if (kind === 'divider') return '---'
  if (!trimmed) return ''
  if (kind === 'quote') return `> ${trimmed}`
  if (kind === 'subheading') return `${'#'.repeat(headingLevel || 1)} ${trimmed}`
  return trimmed
}

function serializeInlineTokens(tokens: InlineToken[]): string {
  return tokens
    .map((t) => {
      // 顺序很重要：粗体 (**) 在斜体 (*) 之前，避免歧义
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
// 段落分割
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 检测文本中是否包含内联 markdown 格式化标记。
 * 用于防止分割操作意外截断 **bold**、*italic*、==highlight== 或 ^underline^。
 */
function hasInlineMarkdownMarkers(text: string): boolean {
  return /(\*\*|(?<!\*)\*(?!\*)|==|\^)/.test(text)
}

/** 将长段落分割为约 chunkSize 个字符的块。 */
function splitLongParagraph(raw: string, chunkSize: number): string[] {
  const text = raw.trim()
  if (text.length <= chunkSize + 40) return [text]

  // 首先尝试按手动换行符分割
  const manualLines = text.split('\n')
  if (manualLines.length > 1) {
    // 如果包含格式化标记，则需要更保守地进行分割：
    // 逐行累积，但在遇到格式化标记跨行时保持完整。
    const hasFormatting = hasInlineMarkdownMarkers(text)
    const chunks: string[] = []
    let current = ''
    for (const line of manualLines) {
      const candidate = current ? `${current}\n${line}` : line
      if (candidate.length > chunkSize && current) {
        // 如果当前 chunk 已有格式化标记，确保分割点不在标记内部
        if (hasFormatting && hasInlineMarkdownMarkers(current)) {
          // 检查 candidate 中是否还有未闭合的标记（即标记跨越了换行符）
          const openBold = (current.match(/\*\*/g) || []).length % 2 !== 0
          const openMark = (current.match(/==/g) || []).length % 2 !== 0
          const openUnderline = (current.match(/\^/g) || []).length % 2 !== 0
          // 计算单 * 数量（排除 ** 中的 *）
          const singleStars = current.match(/(?<!\*)\*(?!\*)/g) || []
          const openItalic = singleStars.length % 2 !== 0
          if (openBold || openItalic || openMark || openUnderline) {
            // 标记未闭合 — 暂不分块，继续累积直到标记闭合
            current = candidate
            continue
          }
        }
        chunks.push(current.trim())
        current = line
      } else {
        current = candidate
      }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
  }

  // 按句子边界分割
  const sentences = text
    .split(/(?<=[。！？!?；;])/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentences.length <= 1) {
    // 如果包含格式化标记，禁止按字符位置切分，避免截断标记
    if (hasInlineMarkdownMarkers(text)) return [text]
    const slices: string[] = []
    let cursor = 0
    while (cursor < text.length) {
      slices.push(text.slice(cursor, cursor + chunkSize).trim())
      cursor += chunkSize
    }
    return slices.filter(Boolean)
  }

  // 按句子累积，遇到格式化标记的句子时保持完整
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    const candidate = `${current}${sentence}`
    if (candidate.length > chunkSize && current) {
      // 在格式化文本边界保持句子完整
      if (hasInlineMarkdownMarkers(sentence) && current.length < chunkSize * 0.5) {
        // 当前积累较少，将格式化句子附加到当前块以避免拆分
        current = candidate
        continue
      }
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
  // 如果文本中包含任何内联格式化标记，拒绝按句子拆分，
  // 以避免截断 **bold**、*italic*、==highlight== 或 ^underline^ 范围。
  if (hasInlineMarkdownMarkers(text)) return [text]
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
    serialize: (raw: string) => serializeParagraphBlock(raw, block.kind, (block as any).headingLevel),
  }
}

function splitInlineLines(
  lines: InlineLine[],
  count: number,
): {
  takenRaw: (kind: ParagraphBlock['kind'], headingLevel?: number) => string
  restRaw: (kind: ParagraphBlock['kind'], headingLevel?: number) => string
} {
  const taken = lines.slice(0, count)
  const rest = lines.slice(count)
  return {
    takenRaw: (kind, headingLevel) =>
      serializeParagraphBlock(
        serializeInlineTokens(taken.flatMap((l) => l.tokens)),
        kind,
        headingLevel,
      ),
    restRaw: (kind, headingLevel) =>
      serializeParagraphBlock(
        serializeInlineTokens(rest.flatMap((l) => l.tokens)),
        kind,
        headingLevel,
      ),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 块高度估算（非文本块）
// ═══════════════════════════════════════════════════════════════════════════

/** 估计非文本块用于布局目的的渲染高度。 */
function estimateBlockHeight(
  block: Block,
  bodySize: number,
  bodyLineHeight?: number,
  maxWidth?: number,
  theme?: ThemeDefinition,
  fontFamily?: string,
): number {
  switch (block.kind) {
    case 'code': {
      const cb = block as CodeBlock
      // 使用 measureCodeBlock，它现在会考虑行换行。
// 这确保布局引擎和渲染器对高度达成一致。
      try {
        const { height } = measureCodeBlock(cb, bodySize)
        return height
      } catch {
        // 回退：测量失败时的粗略估算
        const lineCount = cb.code.split('\n').length
        const monoSize = bodySize * 0.92
        const monoLineHeight = monoSize * 1.5
        return 32 + lineCount * monoLineHeight
      }
    }
    case 'table': {
      const tb = block as TableDisplayBlock
      return 20 + (tb.rows.length + 1) * (bodySize * 1.8)
    }
    case 'columnContainer': {
      const cc = block as ColumnContainerBlock
      const leftH = cc.leftBlocks.reduce((h, b) =>
        h + estimateBlockHeight(b, bodySize, bodyLineHeight, maxWidth, theme, fontFamily) + 10, 0)
      const rightH = cc.rightBlocks.reduce((h, b) =>
        h + estimateBlockHeight(b, bodySize, bodyLineHeight, maxWidth, theme, fontFamily) + 10, 0)
      return Math.max(leftH, rightH) + 20
    }
    case 'orderedList':
    case 'unorderedList': {
      const lb = block as ListBlock
      // Use measureListBlock when theme metrics are available for
      // accurate height accounting (indentation, wrapping, item gaps).
      if (theme && bodyLineHeight !== undefined && maxWidth !== undefined) {
        try {
          const { totalHeight } = measureListBlock(
            lb, bodySize, bodyLineHeight, maxWidth, theme, fontFamily,
          )
          return totalHeight
        } catch {
          // Fall through to simple estimate
        }
      }
      // Simple fallback estimate
      const lineH = bodySize * 1.55
      return 14 + lb.items.length * (lineH + 10) + 14
    }
    default:
      return 40
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// 主分页引擎
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 将 markdown 源文本布局为卡片页面。
 *
 * 算法：
 * 1. 将 markdown 源文本解析为段落块
 * 2. 预分割长段落（>180 个字符）
 * 3. 通过测量高度在每个页面上累积段落
 * 4. 溢出时：尝试句子分割 → 尝试行分割 → 续到下一页
 */
export function layoutPages(opts: LayoutOptions): CardPage[] {
  const { source, settings, theme, footerEnabled, headingOverrides } = opts
  const bodyFontFamily = getBodyFontFamily(settings.bodyFontMode)
  const bodyFontWeight = settings.bodyFontWeight ?? theme.editor.bodyFontWeight ?? BODY_TEXT_WEIGHT

  const allBlocks = parseInputBlocks(source)
  const title = ''

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

  // 预分割长文本段落
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
          expandedParagraphs.push(getParagraphBlock(serializeParagraphBlock(chunk, tb.kind, (tb as any).headingLevel)))
        }
      }
    } else {
      // 非文本块（代码、表格、列）— 保持原样
      expandedParagraphs.push(block)
    }
  }

  const pages: CardPage[] = []
  let currentParagraph = 0
  let carryParagraph: string | null = null
  let carryBlock: Block | null = null
  /** 跟踪携带的块是否来自扩展段落分割。 */
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
      // 确定下一步要处理的内容
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
      if (block.kind === 'code' ||
          block.kind === 'table' ||
          block.kind === 'columnContainer' ||
          block.kind === 'orderedList' ||
          block.kind === 'unorderedList') {
        // 估算非文本块的高度（传入完整尺寸参数以获得准确列表高度）
        const estHeight = estimateBlockHeight(
          block, metrics.bodySize, metrics.bodyLineHeight,
          metrics.bodyWidth, theme, bodyFontFamily,
        )
        const blockTop = cursorY + getGapBetweenBlocks(previousBlock, { kind: 'body', raw: '' }, metrics, headingOverrides, theme, pageKind === 'cover')
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
        // 放不下 — 如果当前页有内容，移动到下一页
        if (page.blocks.length > 0) break
        // 空页 — 无论如何都要放进去（块比页面高）
        page.blocks.push(block)
        if (!nextIsCarried) currentParagraph++
        continue
      }

      // ── For text blocks: existing measurement + splitting ──
      // 如果块来自 expandedParagraphs（非 carry），直接使用它
      // to preserve headingLevel and block kind.  Carry text is re-serialized
      // with kind prefixes so getParagraphBlock has already correctly classified
      // it — don't re-parse from .raw (which lacks the prefix), use the block as-is.
      const blockRaw = (block as TextBlock).raw
      const paraBlock: TextBlock = nextIsCarried
        ? (block as TextBlock)
        : (block as TextBlock).kind === 'body'
          ? getParagraphBlock(blockRaw)
          : (block as TextBlock)
      const currentText = blockRaw
      const leadingGap = getGapBetweenBlocks(previousBlock, paraBlock, metrics, headingOverrides, theme, pageKind === 'cover')
      const { lines, height } = measureParagraphBlock(
        paraBlock,
        metrics.bodySize,
        metrics.bodyLineHeight,
        metrics.bodyWidth,
        theme,
        settings.subheadingStyle,
        bodyFontFamily,
        false,
        headingOverrides,
        bodyFontWeight,
      )
      const blockTop = cursorY + leadingGap
      const blockBottom = blockTop + height

      // 块完全适合
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
            bodyFontFamily,
            false,
            headingOverrides,
            bodyFontWeight,
          )
          if (blockTop + candidateHeight <= metrics.bodyBottomY) {
            fittedRaw = candidateRaw
            fittedCount++
            fittedHeight = candidateHeight
            continue
          }
          // 尝试行级间隙填充
          const gapTop = blockTop + fittedHeight
          const gapHeight = metrics.bodyBottomY - gapTop
          if (gapHeight > 0) {
            const sentenceOnly = sentenceSplit.serialize(sentence)
            const sentenceBlock = getParagraphBlock(sentenceOnly)
            const maxGapLines = getParagraphMaxLines(
              sentenceBlock, gapHeight, metrics.bodySize, metrics.bodyLineHeight,
              theme, settings.subheadingStyle,
              false, headingOverrides,
            )
            if (maxGapLines > 0) {
              const { lines: sLines } = measureParagraphBlock(
                sentenceBlock, metrics.bodySize, metrics.bodyLineHeight,
                metrics.bodyWidth, theme, settings.subheadingStyle,
                bodyFontFamily, false, headingOverrides,
                bodyFontWeight,
              )
              const gapFill = splitInlineLines(sLines, maxGapLines)
              const gapTaken = gapFill.takenRaw(sentenceBlock.kind, (sentenceBlock as any).headingLevel)
              if (gapTaken) {
                const combinedRaw = `${fittedRaw}${sentenceSplit.separator}${gapTaken}`
                const combined = sentenceSplit.serialize(combinedRaw)
                fittedRaw = combinedRaw
                fittedCount++
                fittedHeight = (measureParagraphBlock(
                  getParagraphBlock(combined), metrics.bodySize, metrics.bodyLineHeight,
                  metrics.bodyWidth, theme, settings.subheadingStyle,
                  bodyFontFamily, false, headingOverrides,
                  bodyFontWeight,
                )).height
                gapRestRaw = gapFill.restRaw(sentenceBlock.kind, (sentenceBlock as any).headingLevel)
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
            false, headingOverrides,
          )
          if (fillMaxLines > 0) {
            const { takenRaw, restRaw } = splitInlineLines(lines, fillMaxLines)
            const fillTaken = takenRaw(paraBlock.kind, (paraBlock as any).headingLevel)
            if (fillTaken) {
              page.blocks.push(getParagraphBlock(fillTaken))
              cursorY = blockTop + (measureParagraphBlock(
                getParagraphBlock(fillTaken), metrics.bodySize, metrics.bodyLineHeight,
                metrics.bodyWidth, theme, settings.subheadingStyle, bodyFontFamily,
                false, headingOverrides,
                bodyFontWeight,
              )).height
              previousBlock = getParagraphBlock(fillTaken)
              const fillRest = restRaw(paraBlock.kind, (paraBlock as any).headingLevel)
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
        false, headingOverrides,
      )
      if (maxLines <= 0) break
      const { takenRaw, restRaw } = splitInlineLines(lines, maxLines)
      const taken = takenRaw(paraBlock.kind, (paraBlock as any).headingLevel)
      const rest = restRaw(paraBlock.kind, (paraBlock as any).headingLevel)
      if (taken) {
        page.blocks.push(getParagraphBlock(taken))
        const takenBlock = getParagraphBlock(taken)
        cursorY = blockTop + (measureParagraphBlock(
          takenBlock, metrics.bodySize, metrics.bodyLineHeight,
          metrics.bodyWidth, theme, settings.subheadingStyle, bodyFontFamily,
          false, headingOverrides,
          bodyFontWeight,
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