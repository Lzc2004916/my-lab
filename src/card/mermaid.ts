// ═══════════════════════════════════════════════════════════════════════════
// CardPreview — Mermaid diagram renderer (async SVG → canvas)
// ═══════════════════════════════════════════════════════════════════════════

import type { MermaidDisplayBlock } from './types'

import mermaid from 'mermaid'

let _initialized = false
let _renderCounter = 0

/** Ensure mermaid is initialized once. */
function ensureInit(): void {
  if (_initialized) return
  try {
    mermaid.initialize({ startOnLoad: false, theme: 'default' })
  } catch {
    // Ignore init errors — mermaid may still work
  }
  _initialized = true
}

// ═══════════════════════════════════════════════════════════════════════════
// Async rendering
// ═══════════════════════════════════════════════════════════════════════════

export interface MermaidRenderResult {
  svg: string
  image: HTMLImageElement
  width: number
  height: number
}

/**
 * Render a Mermaid diagram definition to an HTMLImageElement.
 * Returns the SVG string and a loaded Image ready for ctx.drawImage().
 */
export async function renderMermaid(code: string): Promise<MermaidRenderResult> {
  ensureInit()
  const id = `mermaid-card-${++_renderCounter}-${Date.now()}`

  try {
    const { svg }: { svg: string } = await mermaid.render(id, code.trim())

    return new Promise((resolve, reject) => {
      const img = new Image()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        // Scale down large diagrams to fit CONTENT_WIDTH (608px)
        const maxWidth = 600
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > maxWidth) {
          const scale = maxWidth / w
          w = maxWidth
          h = Math.round(h * scale)
        }
        resolve({ svg, image: img, width: w, height: h })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load mermaid SVG'))
      }
      img.src = url
    })
  } catch {
    throw new Error(`Mermaid render failed for diagram`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Drawing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Draw a Mermaid diagram on the canvas.
 *
 * Priority:
 *   1. Pre-rendered SVG image (from renderAllPagesAsync) — best quality
 *   2. Fallback: draw the raw Mermaid code as monospace text so the user
 *      at least sees the diagram source rather than a blank area.
 */
export function drawMermaidBlock(
  ctx: CanvasRenderingContext2D,
  block: MermaidDisplayBlock,
  x: number,
  y: number,
  _bodySize: number,
): number {
  const PAD = 8

  if (block.renderedImage && block.renderedWidth && block.renderedHeight) {
    // ── Path 1: Pre-rendered SVG image ──────────────────────
    ctx.save()
    ctx.drawImage(
      block.renderedImage,
      x + 4,
      y + PAD,
      block.renderedWidth,
      block.renderedHeight,
    )
    ctx.restore()
    return block.renderedHeight + PAD * 2
  }

  // ── Path 2: Fallback — draw raw mermaid code as text ──────
  const estHeight = block.estimatedHeight || 180
  const code = block.code.trim()
  const lines = code.split('\n')
  const monoSize = Math.max(11, _bodySize * 0.6)
  const lineHeight = monoSize * 1.6
  const textHeight = Math.max(estHeight, lines.length * lineHeight + PAD * 2)

  ctx.save()

  // Subtle background
  ctx.fillStyle = 'rgba(0,0,0,0.03)'
  ctx.fillRect(x, y + PAD, 592, textHeight)

  // Border to indicate it's a diagram placeholder
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(x, y + PAD, 592, textHeight)
  ctx.setLineDash([])

  // Draw "Mermaid" label
  ctx.font = `500 ${monoSize}px monospace`
  ctx.fillStyle = '#888'
  ctx.fillText('[Mermaid Diagram]', x + 12, y + PAD + monoSize * 1.2)

  // Draw the raw code
  ctx.font = `${monoSize * 0.9}px monospace`
  ctx.fillStyle = '#666'
  for (let li = 0; li < Math.min(lines.length, 20); li++) {
    ctx.fillText(
      lines[li] || '',
      x + 12,
      y + PAD + monoSize * 1.2 + (li + 1) * lineHeight,
    )
  }
  if (lines.length > 20) {
    ctx.fillText(
      `... (${lines.length - 20} more lines)`,
      x + 12,
      y + PAD + monoSize * 1.2 + 21 * lineHeight,
    )
  }

  ctx.restore()
  return textHeight + PAD * 2
}
