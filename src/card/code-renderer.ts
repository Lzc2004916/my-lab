// ═══════════════════════════════════════════════════════════════════════════
// CardPreview — Code block renderer (Prism.js + canvas drawing)
// ═══════════════════════════════════════════════════════════════════════════

import type { ThemeDefinition, CodeBlock } from './types'
import { CODE_FONT_SIZE_RATIO, CODE_BG_ALPHA, CONTENT_WIDTH } from './types'

import Prism from 'prismjs'

// ═══════════════════════════════════════════════════════════════════════════
// Prism token types
// ═══════════════════════════════════════════════════════════════════════════

interface PrismToken {
  type: string
  content: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Color mapping
// ═══════════════════════════════════════════════════════════════════════════

/** Map Prism token types to theme-derived canvas fill colors. */
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
// Tokenization
// ═══════════════════════════════════════════════════════════════════════════

/** Recursively flatten a Prism token tree into (type, content) pairs. */
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
 * Tokenize a code string using Prism. Returns an array of lines,
 * each containing an array of typed tokens.
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

/** Merge adjacent tokens of the same type into a single token. */
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
// Measurement
// ═══════════════════════════════════════════════════════════════════════════

/** Compute monospace font size and line height from body font size. */
export function getCodeMetrics(bodySize: number): {
  fontSize: number
  lineHeight: number
  font: string
} {
  const fontSize = Math.round(bodySize * CODE_FONT_SIZE_RATIO)
  const lineHeight = fontSize * 1.5
  const font = `${fontSize}px "JetBrains Mono","Cascadia Code","SF Mono","Fira Code","Consolas",monospace`
  return { fontSize, lineHeight, font }
}

/** Measure the total height of a code block. */
export function measureCodeBlock(block: CodeBlock, _bodySize: number): {
  lineCount: number
  height: number
  codeWidth: number
  fontSize: number
  lineHeight: number
} {
  const { fontSize, lineHeight } = getCodeMetrics(_bodySize)
  const lines = block.code.split('\n')
  const lineCount = lines.length
  const paddingTop = 16
  const paddingBottom = 16
  const height = paddingTop + lineCount * lineHeight + paddingBottom

  let maxLineLen = 0
  for (const line of lines) {
    if (line.length > maxLineLen) maxLineLen = line.length
  }
  const codeWidth = Math.min(CONTENT_WIDTH, maxLineLen * fontSize * 0.62)

  block.lineCount = lineCount
  return { lineCount, height, codeWidth, fontSize, lineHeight }
}

// ═══════════════════════════════════════════════════════════════════════════
// Drawing
// ═══════════════════════════════════════════════════════════════════════════

/** Draw a code block on the canvas. */
export function drawCodeBlock(
  ctx: CanvasRenderingContext2D,
  block: CodeBlock,
  x: number,
  y: number,
  bodySize: number,
  theme: ThemeDefinition,
): number {
  const { fontSize, lineHeight, height } = measureCodeBlock(block, bodySize)
  const colors = getCodeColors(theme)
  const tokenLines = tokenizeCode(block.code, block.language)
  const paddingX = 18
  const paddingTop = 16

  // Calculate block width from longest line
  let blockWidth = CONTENT_WIDTH
  const ctx2 = document.createElement('canvas').getContext('2d')
  if (ctx2) {
    ctx2.font = `${fontSize}px "JetBrains Mono",monospace`
    let maxW = 0
    for (const line of tokenLines) {
      let w = 0
      for (const token of line) {
        w += ctx2.measureText(token.content).width
      }
      if (w > maxW) maxW = w
    }
    blockWidth = Math.min(CONTENT_WIDTH, maxW + paddingX * 2 + 20)
  }

  // Background
  ctx.save()
  ctx.fillStyle = `rgba(0,0,0,${CODE_BG_ALPHA})`
  const radius = 8
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + blockWidth - radius, y)
  ctx.arcTo(x + blockWidth, y, x + blockWidth, y + radius, radius)
  ctx.lineTo(x + blockWidth, y + height - radius)
  ctx.arcTo(x + blockWidth, y + height, x - radius + blockWidth, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.fill()

  // Language label (top-right)
  if (block.language) {
    ctx.font = `500 ${Math.round(fontSize * 0.78)}px monospace`
    ctx.fillStyle = theme.palette.muted
    ctx.textAlign = 'right'
    ctx.fillText(block.language, x + blockWidth - 12, y + paddingTop + fontSize * 0.7)
    ctx.textAlign = 'left'
  }

  // Draw each line
  ctx.font = `${fontSize}px "JetBrains Mono",monospace`
  for (let li = 0; li < tokenLines.length; li++) {
    const tokens = tokenLines[li]!
    let cursorX = x + paddingX
    const lineY = y + paddingTop + fontSize * 0.84 + li * lineHeight

    for (const token of tokens) {
      const color = (colors as Record<string, string>)[token.type] || theme.palette.text
      ctx.fillStyle = color
      ctx.fillText(token.content, cursorX, lineY)
      cursorX += ctx.measureText(token.content).width
    }
  }

  ctx.restore()
  return height
}
