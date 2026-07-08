// ═══════════════════════════════════════════════════════════════════════════
// CardPreview — Math block renderer (KaTeX + html2canvas)
// ═══════════════════════════════════════════════════════════════════════════

import type { MathDisplayBlock } from './types'
import { CONTENT_WIDTH } from './types'
import katex from 'katex'

// ═══════════════════════════════════════════════════════════════════════════
// KaTeX → HTML rendering
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a LaTeX formula to HTML using KaTeX.
 * Returns the HTML string and the rendered dimensions.
 */
export function renderMathToHTML(
  formula: string,
  maxWidth: number = CONTENT_WIDTH - 24,
): { html: string; width: number; height: number } {
  try {
    const cleanFormula = formula.trim()
    if (!cleanFormula) {
      return { html: '', width: 0, height: 0 }
    }

    const html = katex.renderToString(cleanFormula, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
      strict: false,
    })

    // Measure the rendered output using a temporary DOM element
    const tempDiv = document.createElement('div')
    tempDiv.style.cssText =
      `display:inline-block;max-width:${maxWidth}px;visibility:hidden;position:absolute;left:-9999px;top:0;`
    tempDiv.innerHTML = html
    document.body.appendChild(tempDiv)
    const rect = tempDiv.getBoundingClientRect()
    const width = Math.min(rect.width, maxWidth)
    const height = rect.height
    document.body.removeChild(tempDiv)

    return { html, width, height }
  } catch {
    return { html: '', width: 0, height: 0 }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Async pre-rendering with html2canvas
// ═══════════════════════════════════════════════════════════════════════════

export interface MathRenderImageResult {
  canvas: HTMLCanvasElement
  width: number
  height: number
}

/**
 * Render a LaTeX formula to an HTMLCanvasElement using KaTeX + html2canvas.
 * This is called from the async engine path (renderAllPagesAsync) to
 * pre-render all math blocks before drawing.
 *
 * Returns null if rendering fails (caller should handle gracefully).
 */
export async function renderMathToImage(formula: string): Promise<MathRenderImageResult | null> {
  try {
    const { html, width, height } = renderMathToHTML(formula)
    if (!html || !width || !height) return null

    // Create a temporary DOM element to host the KaTeX HTML
    const container = document.createElement('div')
    container.style.cssText =
      `display:inline-block;position:absolute;left:-9999px;top:0;` +
      `width:${Math.ceil(width) + 8}px;` +
      `padding:4px;` +
      `background:#fff;`
    container.innerHTML = html
    document.body.appendChild(container)

    try {
      // Use html2canvas to capture the rendered formula
      const html2canvas = (await import('html2canvas')).default
      const captured = await html2canvas(container, {
        backgroundColor: null,  // transparent background
        scale: 2,               // retina quality
        logging: false,
      })
      return {
        canvas: captured,
        width: captured.width / 2,   // scale back to logical px
        height: captured.height / 2,
      }
    } finally {
      document.body.removeChild(container)
    }
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Measurement (sync — used during layout pass)
// ═══════════════════════════════════════════════════════════════════════════

export interface MathBlockMetrics {
  width: number
  height: number
  html: string
}

/** Measure a math block — returns dimensions and cached HTML. */
export function measureMathBlock(
  block: MathDisplayBlock,
  _bodySize: number,
): MathBlockMetrics {
  const padY = 16
  const { html, width, height } = renderMathToHTML(block.formula)

  block.renderedWidth = width
  block.renderedHeight = height + padY * 2

  return {
    width: width || 100,
    height: height + padY * 2,
    html,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Drawing (canvas render pass)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Draw a math formula block on the canvas.
 *
 * Priority:
 *   1. Pre-rendered html2canvas image (from renderAllPagesAsync) — best quality
 *   2. Fallback: render raw formula as monospace text
 */
export function drawMathBlock(
  ctx: CanvasRenderingContext2D,
  block: MathDisplayBlock,
  x: number,
  y: number,
  _bodySize: number,
): number {
  const padY = 16

  // ── Path 1: Use pre-rendered html2canvas image ──────────────
  if (block.html2canvasImage && block.renderedWidth && block.renderedHeight) {
    const totalHeight = block.renderedHeight + padY * 2
    ctx.save()
    // Subtle background
    ctx.fillStyle = 'rgba(0,0,0,0.02)'
    ctx.fillRect(x, y, block.renderedWidth + 8, totalHeight)
    // Draw the pre-rendered image
    ctx.drawImage(
      block.html2canvasImage,
      x + 4,
      y + padY,
      block.renderedWidth,
      block.renderedHeight,
    )
    ctx.restore()
    return totalHeight
  }

  // ── Path 2: Sync fallback — render KaTeX to DOM and snapshot ──
  try {
    const { html, width, height } = renderMathToHTML(block.formula)
    if (html && width && height) {
      const totalHeight = height + padY * 2

      // Subtle background (drawn first so text is on top)
      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.02)'
      ctx.fillRect(x, y, width + 8, totalHeight)
      ctx.restore()

      // Create temp element with KaTeX HTML, extract rendered text
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText =
        `display:inline-block;position:absolute;left:-9999px;top:0;` +
        `width:${Math.ceil(width) + 8}px;padding:4px;`
      tempDiv.innerHTML = html
      document.body.appendChild(tempDiv)

      try {
        drawMathFallbackText(ctx, tempDiv, block.formula, x, y, padY)
      } finally {
        document.body.removeChild(tempDiv)
      }

      return totalHeight
    }
  } catch {
    // Fall through to raw text fallback
  }

  // ── Path 3: Raw text fallback ─────────────────────────────
  const fallbackText = block.formula.trim()
  if (fallbackText) {
    ctx.save()
    ctx.font = '14px monospace'
    ctx.fillStyle = '#666'
    ctx.fillText(`$${fallbackText}$`, x, y + padY + 14)
    ctx.restore()
  }
  return 40
}

/**
 * Walk the DOM element's text nodes and draw formula text on canvas.
 * Used as fallback when html2canvas is unavailable.
 */
function drawMathFallbackText(
  ctx: CanvasRenderingContext2D,
  element: HTMLElement,
  _formula: string,
  x: number,
  y: number,
  padY: number,
): void {
  // Collect all text content for rendering
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const textParts: string[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.textContent) {
      textParts.push(node.textContent)
    }
  }
  const fullText = textParts.join('').trim()
  if (fullText) {
    ctx.save()
    ctx.font = '16px serif'
    ctx.fillStyle = '#333'
    ctx.fillText(fullText, x + 4, y + padY + 16)
    ctx.restore()
  }
}
