// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — decorative ornament renderers
// ═══════════════════════════════════════════════════════════════════════════

import type { ThemeDefinition } from './types'
import { PAGE_WIDTH, PAGE_HEIGHT, CONTENT_LEFT, CONTENT_RIGHT } from './types'

// ── Color helpers ──────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return `rgba(36,52,70,${alpha})`
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Corner brackets ────────────────────────────────────────────────────────

/**
 * Swiss/luxe style corner brackets.
 * Draws thin L-shaped brackets at the four corners of the content area.
 */
export function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'cornerBracket') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1
  const armLen = 28 * scale
  const inset = 8
  const lineWidth = 1.5 * scale

  ctx.save()
  ctx.strokeStyle = hexToRgba(color, alpha)
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'

  const corners = [
    // Top-left
    { x: CONTENT_LEFT + inset, y: inset + 20, dx1: 1, dy1: 0, dx2: 0, dy2: 1 },
    // Top-right
    { x: CONTENT_RIGHT - inset, y: inset + 20, dx1: -1, dy1: 0, dx2: 0, dy2: 1 },
    // Bottom-left
    { x: CONTENT_LEFT + inset, y: PAGE_HEIGHT - inset - 20, dx1: 1, dy1: 0, dx2: 0, dy2: -1 },
    // Bottom-right
    { x: CONTENT_RIGHT - inset, y: PAGE_HEIGHT - inset - 20, dx1: -1, dy1: 0, dx2: 0, dy2: -1 },
  ]

  for (const c of corners) {
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.x + armLen * c.dx1, c.y + armLen * c.dy1)
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.x + armLen * c.dx2, c.y + armLen * c.dy2)
    ctx.stroke()
  }

  ctx.restore()
}

// ── Top decorative rule ────────────────────────────────────────────────────

/**
 * Thick decorative rule below the title area.
 * Used by dark/luxe themes as a visual separator.
 */
export function drawTopRule(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  titleEndY: number,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'topRule') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const y = titleEndY + 12

  ctx.save()
  ctx.strokeStyle = hexToRgba(color, alpha)
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'

  // Main rule
  ctx.beginPath()
  ctx.moveTo(CONTENT_LEFT, y)
  ctx.lineTo(CONTENT_RIGHT, y)
  ctx.stroke()

  // Thin accent rule below
  ctx.strokeStyle = hexToRgba(color, alpha * 0.5)
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(CONTENT_LEFT + 40, y + 4)
  ctx.lineTo(CONTENT_RIGHT - 40, y + 4)
  ctx.stroke()

  ctx.restore()
}

// ── Geometric pattern overlay ──────────────────────────────────────────────

/**
 * Crystalline geometric pattern — diamond/hex grid.
 * Used by frost and cyber themes.
 */
export function drawGeometricPattern(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'geometricPattern') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1
  const spacing = 48 * scale

  ctx.save()
  ctx.strokeStyle = hexToRgba(color, alpha)
  ctx.lineWidth = 0.6
  ctx.globalAlpha = alpha

  // Diamond grid
  for (let x = -spacing; x < PAGE_WIDTH + spacing; x += spacing) {
    for (let y = -spacing; y < PAGE_HEIGHT + spacing; y += spacing) {
      const cx = x + (Math.floor(y / spacing) % 2) * (spacing / 2)
      ctx.beginPath()
      ctx.moveTo(cx, y - spacing / 3)
      ctx.lineTo(cx + spacing / 4, y)
      ctx.lineTo(cx, y + spacing / 3)
      ctx.lineTo(cx - spacing / 4, y)
      ctx.closePath()
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ── Circuit trace pattern ──────────────────────────────────────────────────

/**
 * Cyber/tech circuit board trace lines.
 * Angular paths with terminal dots.
 */
export function drawCircuitTrace(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'circuitTrace') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent

  ctx.save()
  ctx.strokeStyle = hexToRgba(color, alpha)
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.fillStyle = hexToRgba(color, alpha * 1.5)

  // Corner circuit traces
  const traces = [
    // Top-right corner
    [
      [PAGE_WIDTH - 10, 52], [PAGE_WIDTH - 42, 52],
      [PAGE_WIDTH - 42, 62], [PAGE_WIDTH - 32, 62],
      [PAGE_WIDTH - 32, 72],
    ],
    // Bottom-left corner
    [
      [10, PAGE_HEIGHT - 52], [42, PAGE_HEIGHT - 52],
      [42, PAGE_HEIGHT - 62], [32, PAGE_HEIGHT - 62],
      [32, PAGE_HEIGHT - 72],
    ],
  ]

  for (const trace of traces) {
    ctx.beginPath()
    ctx.moveTo(trace[0]![0]!, trace[0]![1]!)
    for (let i = 1; i < trace.length; i++) {
      ctx.lineTo(trace[i]![0]!, trace[i]![1]!)
    }
    ctx.stroke()

    // Terminal dot at the end
    const end = trace[trace.length - 1]!
    ctx.beginPath()
    ctx.arc(end[0]!, end[1]!, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ── Watermark ──────────────────────────────────────────────────────────────

/**
 * Subtle background watermark or seal mark.
 * Used by ink-wash and midnight-ink themes.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'watermark') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.muted
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.fillStyle = hexToRgba(color, alpha)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Large subtle seal mark at bottom-right
  const size = 140 * scale
  const x = PAGE_WIDTH - 72
  const y = PAGE_HEIGHT - 72

  ctx.font = `${size}px serif`
  ctx.fillText('印', x, y)

  ctx.restore()
}

// ── Gold foil specks ───────────────────────────────────────────────────────

/**
 * Random gold foil particles for luxe themes.
 */
export function drawGoldFoil(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'goldFoil') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent

  ctx.save()

  // Deterministic pseudo-random placement
  const seed = 137
  for (let i = 0; i < 45; i++) {
    const px = ((seed * (i + 1) * 23 + i * 7) % (PAGE_WIDTH - 80)) + 40
    const py = ((seed * (i + 1) * 41 + i * 13) % (PAGE_HEIGHT - 120)) + 60
    const size = 0.6 + (i % 5) * 0.5
    const particleAlpha = alpha * (0.5 + (i % 3) * 0.25)

    ctx.fillStyle = hexToRgba(color, particleAlpha)
    ctx.beginPath()
    // Irregular foil shapes
    if (i % 4 === 0) {
      // Diamond
      ctx.moveTo(px, py - size)
      ctx.lineTo(px + size * 0.7, py)
      ctx.lineTo(px, py + size)
      ctx.lineTo(px - size * 0.7, py)
    } else {
      // Circle
      ctx.arc(px, py, size, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  ctx.restore()
}

// ── Leaf motif ─────────────────────────────────────────────────────────────

/**
 * Botanical leaf illustration in the margin.
 */
export function drawLeafMotif(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'leafMotif') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.strokeStyle = hexToRgba(color, alpha)
  ctx.fillStyle = hexToRgba(color, alpha * 0.35)
  ctx.lineWidth = 1.2 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Draw 2-3 simple leaf shapes in the margin
  const leaves = [
    { x: 22, y: 180, angle: -0.3, size: 14 * scale },
    { x: 24, y: 340, angle: 0.2, size: 11 * scale },
    { x: 20, y: 500, angle: -0.15, size: 12 * scale },
  ]

  for (const leaf of leaves) {
    ctx.save()
    ctx.translate(leaf.x, leaf.y)
    ctx.rotate(leaf.angle)

    // Leaf shape (bezier curve)
    ctx.beginPath()
    ctx.moveTo(0, -leaf.size)
    ctx.bezierCurveTo(
      leaf.size * 0.6, -leaf.size * 0.5,
      leaf.size * 0.6, leaf.size * 0.3,
      0, leaf.size * 0.7,
    )
    ctx.bezierCurveTo(
      -leaf.size * 0.6, leaf.size * 0.3,
      -leaf.size * 0.6, -leaf.size * 0.5,
      0, -leaf.size,
    )
    ctx.fill()
    ctx.stroke()

    // Center vein
    ctx.beginPath()
    ctx.moveTo(0, -leaf.size * 0.8)
    ctx.lineTo(0, leaf.size * 0.5)
    ctx.stroke()

    ctx.restore()
  }

  ctx.restore()
}

// ── Aurora glow ────────────────────────────────────────────────────────────

/**
 * Northern lights / aurora gradient effect for frost themes.
 */
export function drawAuroraGlow(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || (decor.kind !== 'auroraGlow')) return

  const alpha = decor.opacity

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  // Aurora band 1
  const aurora1 = ctx.createLinearGradient(0, 0, PAGE_WIDTH, 0)
  aurora1.addColorStop(0, 'rgba(58, 200, 220, 0)')
  aurora1.addColorStop(0.3, `rgba(58, 200, 220, ${alpha * 0.6})`)
  aurora1.addColorStop(0.5, `rgba(120, 220, 180, ${alpha})`)
  aurora1.addColorStop(0.7, `rgba(180, 200, 240, ${alpha * 0.5})`)
  aurora1.addColorStop(1, 'rgba(200, 220, 255, 0)')
  ctx.fillStyle = aurora1
  ctx.fillRect(0, 80, PAGE_WIDTH, 40)

  // Aurora band 2
  const aurora2 = ctx.createLinearGradient(0, 0, PAGE_WIDTH, 0)
  aurora2.addColorStop(0, 'rgba(180, 200, 255, 0)')
  aurora2.addColorStop(0.4, `rgba(140, 180, 240, ${alpha * 0.4})`)
  aurora2.addColorStop(0.6, `rgba(100, 200, 220, ${alpha * 0.7})`)
  aurora2.addColorStop(1, 'rgba(80, 180, 210, 0)')
  ctx.fillStyle = aurora2
  ctx.fillRect(0, 100, PAGE_WIDTH, 28)

  ctx.restore()
}

// ── Fan burst (Art Deco sunburst) ─────────────────────────────────────────

/**
 * Art Deco radial fan/sunburst pattern.
 * Radiating lines from corners — the quintessential Chrysler Building motif.
 * Used by art-deco theme.
 */
export function drawFanBurst(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'fanBurst') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.strokeStyle = hexToRgba(color, alpha)
  ctx.lineCap = 'round'

  // ── Top-left fan burst ────────────────────────────────────────────────
  const originX = 0
  const originY = 0
  const maxRadius = 380 * scale
  const startAngle = -0.05   // near-horizontal right
  const endAngle = 0.58      // ~33° downward

  drawFanRays(ctx, originX, originY, maxRadius, startAngle, endAngle, alpha, color, scale)

  // ── Bottom-right fan burst (mirrored, softer) ─────────────────────────
  const brX = PAGE_WIDTH
  const brY = PAGE_HEIGHT
  const brMaxRadius = 320 * scale
  const brStartAngle = Math.PI - 0.08  // near-horizontal left
  const brEndAngle = Math.PI - 0.52    // ~30° upward

  drawFanRays(ctx, brX, brY, brMaxRadius, brStartAngle, brEndAngle, alpha * 0.65, color, scale * 0.85)

  ctx.restore()
}

/** Draw a single fan of radial rays from an origin point. */
function drawFanRays(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  maxRadius: number,
  startAngle: number,
  endAngle: number,
  alpha: number,
  color: string,
  scale: number,
): void {
  const rayCount = 28
  const angleStep = (endAngle - startAngle) / rayCount

  for (let i = 0; i < rayCount; i++) {
    const angle = startAngle + i * angleStep

    // Staggered lengths — stepped geometric rhythm (ziggurat effect)
    const lengthRatio = 0.45 + (i % 4) * 0.14 + (i / rayCount) * 0.08
    const rayLength = maxRadius * Math.min(1, lengthRatio)
    const lineWidth = 0.7 + (i % 3 === 0 ? 0.8 : 0) * scale

    ctx.lineWidth = lineWidth
    ctx.strokeStyle = hexToRgba(color, alpha * (0.55 + (i % 3) * 0.22))

    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(
      ox + Math.cos(angle) * rayLength,
      oy + Math.sin(angle) * rayLength,
    )
    ctx.stroke()

    // Tiny dot at ray endpoint for selected rays (star-point effect)
    if (i % 5 === 0) {
      const dotAlpha = alpha * 0.7
      ctx.fillStyle = hexToRgba(color, dotAlpha)
      ctx.beginPath()
      ctx.arc(
        ox + Math.cos(angle) * rayLength * 0.94,
        oy + Math.sin(angle) * rayLength * 0.94,
        1.8 * scale,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main decor dispatch
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Draw all decorative ornaments for the given theme.
 * Call after atmosphere and before body content.
 */
export function drawDecor(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  titleEndY?: number,
): void {
  const decor = theme.decor
  if (!decor || decor.kind === 'none') return

  switch (decor.kind) {
    case 'cornerBracket':
      drawCornerBrackets(ctx, theme)
      break
    case 'topRule':
      drawTopRule(ctx, theme, titleEndY ?? 200)
      break
    case 'geometricPattern':
      drawGeometricPattern(ctx, theme)
      break
    case 'circuitTrace':
      drawCircuitTrace(ctx, theme)
      break
    case 'watermark':
      drawWatermark(ctx, theme)
      break
    case 'goldFoil':
      drawGoldFoil(ctx, theme)
      break
    case 'leafMotif':
      drawLeafMotif(ctx, theme)
      break
    case 'auroraGlow':
      drawAuroraGlow(ctx, theme)
      break
    case 'fanBurst':
      drawFanBurst(ctx, theme)
      break
  }
}
