// ═══════════════════════════════════════════════════════════════════════════
// CardPreview — 代码块渲染器（Prism.js + Canvas 绘制）
// ═══════════════════════════════════════════════════════════════════════════

import type { ThemeDefinition, CodeBlock } from './types'
import { CODE_FONT_SIZE_RATIO, CODE_BG_ALPHA, CONTENT_WIDTH } from './types'

import Prism from 'prismjs'

// ═══════════════════════════════════════════════════════════════════════════
// Prism token 类型
// ═══════════════════════════════════════════════════════════════════════════

interface PrismToken {
  type: string
  content: string
}

// ═══════════════════════════════════════════════════════════════════════════
// 颜色映射
// ═══════════════════════════════════════════════════════════════════════════

/** 将 Prism token 类型映射为主题衍生的 canvas 填充颜色。 */
export function getCodeColors(theme: ThemeDefinition): Record<string, string> {
  return {
    keyword: theme.palette.accent,
    'attr-name': theme.palette.accent,
    'class-name': theme.palette.accent,
    function: theme.palette.accent,
    string: theme.palette.muted,
    number: theme.palette.accent,
    comment: theme.palette.muted,
    operator: theme.palette.text,
    punctuation: theme.palette.text,
    boolean: theme.palette.accent,
    'atrule': theme.palette.accent,
    'attr-value': theme.palette.muted,
    'builtin': theme.palette.accent,
    'constant': theme.palette.accent,
    'deleted': theme.palette.muted,
    'entity': theme.palette.accent,
    'inserted': theme.palette.muted,
    'property': theme.palette.accent,
    'regex': theme.palette.muted,
    'selector': theme.palette.accent,
    'tag': theme.palette.accent,
    'url': theme.palette.muted,
    'variable': theme.palette.text,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Token 化
// ═══════════════════════════════════════════════════════════════════════════

/** 递归展平 Prism token 树为 (type, content) 对。 */
function flattenTokens(token: any, parentType = ''): PrismToken[] {
  if (typeof token === 'string') {
    return [{ type: parentType || 'plain', content: token }]
  }
  const result: PrismToken[] = []
  if (Array.isArray(token.content)) {
    for (const child of token.content) {
      result.push(...flattenTokens(child, token.type))
    }
  } else if (typeof token.content === 'string') {
    result.push({ type: token.type, content: token.content })
  }
  return result
}

/**
 * 使用 Prism 对代码字符串进行分词。返回一个行数组，
 * 每行包含一个类型化 token 数组。
 */
export function tokenizeCode(code: string, language: string): PrismToken[][] {
  const lang = language.toLowerCase()
  const grammar = Prism.languages?.[lang]

  const lines = code.split('\n')
  if (!grammar) {
    return lines.map((line) => [{ type: 'plain', content: line }])
  }

  return lines.map((line) => {
    if (!line.trim()) return [{ type: 'plain', content: line }]
    try {
      const tokens: any[] = Prism.tokenize(line, grammar)
      const flattened = tokens.flatMap((t: any) => flattenTokens(t))
      return mergeAdjacentTokens(flattened)
    } catch {
      return [{ type: 'plain', content: line }]
    }
  })
}

/** 将相同类型的相邻 token 合并为单个 token。 */
function mergeAdjacentTokens(tokens: PrismToken[]): PrismToken[] {
  const merged: PrismToken[] = []
  for (const token of tokens) {
    const last = merged[merged.length - 1]
    if (last && last.type === token.type) {
      last.content += token.content
    } else {
      merged.push({ ...token })
    }
  }
  return merged
}

// ═══════════════════════════════════════════════════════════════════════════
// 测量
// ═══════════════════════════════════════════════════════════════════════════

const PADDING_X = 18
const PADDING_TOP = 16
const PADDING_BOTTOM = 16

/** 根据正文字体大小计算等宽字体大小和行高。 */
export function getCodeMetrics(bodySize: number): {
  fontSize: number
  lineHeight: number
  font: string
  fontFamily: string
} {
  const fontSize = Math.round(bodySize * CODE_FONT_SIZE_RATIO)
  const lineHeight = fontSize * 1.5
  const fontFamily = '"JetBrains Mono","Cascadia Code","SF Mono","Fira Code","Consolas",monospace'
  const font = `${fontSize}px ${fontFamily}`
  return { fontSize, lineHeight, font, fontFamily }
}

/**
 * 将单个 token 数组包裹为多个视觉行，使
 * 没有视觉行超过 `maxTextWidth` 像素。
 *
 * 算法：
 *  1. Token 适合当前行 → 追加并推进光标
 *  2. Token 比整行还宽 → 刷新当前行，然后将宽 token
 *     逐字符分割到多个视觉行
 *  3. Token 不适合（但不是特别宽）→ 换到下一行
 *
 * 使用提供的 canvas 上下文进行精确的文本测量。
 */
function wrapTokenLine(
  tokens: PrismToken[],
  maxTextWidth: number,
  measureCtx: CanvasRenderingContext2D,
): PrismToken[][] {
  const visualLines: PrismToken[][] = []
  let currentLine: PrismToken[] = []
  let cursorX = 0

  for (const token of tokens) {
    const tokenWidth = measureCtx.measureText(token.content).width

    // ── Case 1: Token fits on current line ──────────────────────────
    if (cursorX + tokenWidth <= maxTextWidth) {
      currentLine.push(token)
      cursorX += tokenWidth
      continue
    }

    // ── Case 2: Token alone is wider than the entire line ───────────
    // 先刷新当前行，再分割宽 token
    if (tokenWidth > maxTextWidth) {
      if (currentLine.length > 0) {
        visualLines.push(currentLine)
        currentLine = []
        cursorX = 0
      }

      const { content, type } = token
      let charBuf = ''
      let charWidth = 0

      for (const ch of content) {
        const cw = measureCtx.measureText(ch).width
        if (cursorX + charWidth + cw > maxTextWidth && charBuf.length > 0) {
          currentLine.push({ type, content: charBuf })
          visualLines.push(currentLine)
          currentLine = []
          cursorX = 0
          charBuf = ''
          charWidth = 0
        }
        charBuf += ch
        charWidth += cw
      }
      if (charBuf) {
        currentLine.push({ type, content: charBuf })
        cursorX += charWidth
      }
      continue
    }

    // ── Case 3: Token doesn't fit on current line → wrap ───────────
    visualLines.push(currentLine)
    currentLine = [token]
    cursorX = tokenWidth
  }

  // 刷新剩余行
  if (currentLine.length > 0) {
    visualLines.push(currentLine)
  }

  return visualLines
}

/** 测量代码块的总高度（含换行）。 */
export function measureCodeBlock(block: CodeBlock, _bodySize: number): {
  lineCount: number
  height: number
  codeWidth: number
  fontSize: number
  lineHeight: number
} {
  const { fontSize, lineHeight, fontFamily } = getCodeMetrics(_bodySize)

  // 代码块内部可用的最大文本宽度
  const maxTextWidth = CONTENT_WIDTH - PADDING_X * 2

  // Token 化并测量换行
  const tokenLines = tokenizeCode(block.code, block.language)

  // 设置测量上下文
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  if (measureCtx) {
    measureCtx.font = `${fontSize}px ${fontFamily}`
  }

  let totalVisualLines = 0
  for (const line of tokenLines) {
    if (measureCtx) {
      const wrapped = wrapTokenLine(line, maxTextWidth, measureCtx)
      totalVisualLines += wrapped.length
    } else {
      totalVisualLines += 1 // fallback
    }
  }

  const lineCount = totalVisualLines
  const height = PADDING_TOP + totalVisualLines * lineHeight + PADDING_BOTTOM
  const codeWidth = CONTENT_WIDTH

  block.lineCount = lineCount
  return { lineCount, height, codeWidth, fontSize, lineHeight }
}

// ═══════════════════════════════════════════════════════════════════════════
// 绘制
// ═══════════════════════════════════════════════════════════════════════════

const BG_RADIUS = 8

/** 在 canvas 上绘制代码块。长行自动换行。 */
export function drawCodeBlock(
  ctx: CanvasRenderingContext2D,
  block: CodeBlock,
  x: number,
  y: number,
  bodySize: number,
  theme: ThemeDefinition,
): number {
  const { fontSize, lineHeight, fontFamily } = getCodeMetrics(bodySize)
  const colors = getCodeColors(theme)
  const tokenLines = tokenizeCode(block.code, block.language)
  const blockWidth = CONTENT_WIDTH
  const maxTextWidth = CONTENT_WIDTH - PADDING_X * 2

  // 预换行所有行，计算总视觉行数 + 高度
  let totalVisualLines = 0
  const allWrappedLines: PrismToken[][] = []

  // 使用 ctx 进行测量（字体已设置或将在下方设置）
  ctx.save()
  ctx.font = `${fontSize}px ${fontFamily}`

  for (const line of tokenLines) {
    const wrapped = wrapTokenLine(line, maxTextWidth, ctx)
    for (const wl of wrapped) {
      allWrappedLines.push(wl)
    }
    totalVisualLines += wrapped.length
  }

  const totalHeight = PADDING_TOP + totalVisualLines * lineHeight + PADDING_BOTTOM

  // ── Background ──────────────────────────────────────────────────────
  ctx.fillStyle = `rgba(0,0,0,${CODE_BG_ALPHA})`
  ctx.beginPath()
  ctx.moveTo(x + BG_RADIUS, y)
  ctx.lineTo(x + blockWidth - BG_RADIUS, y)
  ctx.arcTo(x + blockWidth, y, x + blockWidth, y + BG_RADIUS, BG_RADIUS)
  ctx.lineTo(x + blockWidth, y + totalHeight - BG_RADIUS)
  ctx.arcTo(x + blockWidth, y + totalHeight, x + blockWidth - BG_RADIUS, y + totalHeight, BG_RADIUS)
  ctx.lineTo(x + BG_RADIUS, y + totalHeight)
  ctx.arcTo(x, y + totalHeight, x, y + totalHeight - BG_RADIUS, BG_RADIUS)
  ctx.lineTo(x, y + BG_RADIUS)
  ctx.arcTo(x, y, x + BG_RADIUS, y, BG_RADIUS)
  ctx.fill()

  // ── Language label (top-right) ─────────────────────────────────────
  if (block.language) {
    ctx.font = `500 ${Math.round(fontSize * 0.78)}px monospace`
    ctx.fillStyle = theme.palette.muted
    ctx.textAlign = 'right'
    ctx.fillText(block.language, x + blockWidth - 12, y + PADDING_TOP + fontSize * 0.7)
    ctx.textAlign = 'left'
  }

  // ── Draw each visual line ───────────────────────────────────────────
  ctx.font = `${fontSize}px ${fontFamily}`
  for (let vi = 0; vi < allWrappedLines.length; vi++) {
    const tokens = allWrappedLines[vi]!
    let cursorX = x + PADDING_X
    const lineY = y + PADDING_TOP + fontSize * 0.84 + vi * lineHeight

    for (const token of tokens) {
      const color = (colors as Record<string, string>)[token.type] || theme.palette.text
      ctx.fillStyle = color
      ctx.fillText(token.content, cursorX, lineY)
      cursorX += ctx.measureText(token.content).width
    }
  }

  ctx.restore()
  return totalHeight
}