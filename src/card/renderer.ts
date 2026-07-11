// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — Canvas rendering pipeline
// ═══════════════════════════════════════════════════════════════════════════

import type {
  HighlightStyle,
  HighlightTreatment,
  ParagraphBlock,
  PosterMetrics,
  QuoteBoxMetrics,
  RenderOptions,
  ThemeDefinition,
  CardCornerMode,
  TypographySettings,
  ColumnContainerBlock,
  Block,
} from './types'
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  CONTENT_LEFT,
  CONTENT_RIGHT,
  CONTENT_WIDTH,
  CANVAS_SCALE,
  FOOTER_LINE_LEFT,
  FOOTER_LINE_RIGHT,
  FOOTER_LINE_Y,
  FOOTER_TEXT_Y,
  BODY_TEXT_WEIGHT,
  BODY_BOLD_WEIGHT,
  QUOTE_TEXT_WEIGHT,
  SUBHEADING_TEXT_WEIGHT,
  BODY_FONT_FAMILY,
  FOOTER_FONT_FAMILY,
  HEADING_SIZE_RATIOS,
  COLUMN_GAP,
} from './types'
import {
  getPosterMetrics,
  getGapBetweenBlocks,
  measureParagraphBlock,
  getBodyTokenWidth,
  parseInlineMarkdown,
  wrapInlineTokensByWidth,
  getParagraphVisualHeight,
  getQuoteBoxMetrics,
} from './measure'
import { drawCodeBlock, measureCodeBlock } from './code-renderer'
import { drawTableBlock, measureTableBlock } from './table-renderer'
import { hexToRgba, hexToRgb, gradientAngleToPoints } from './color-utils'

// ═══════════════════════════════════════════════════════════════════════════
// Seeded PRNG (mulberry32) — fast, deterministic, avoids Math.random() overhead
// ═══════════════════════════════════════════════════════════════════════════

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Pre-generated noise texture cache
// ═══════════════════════════════════════════════════════════════════════════

interface NoiseCacheEntry {
  canvas: HTMLCanvasElement
  density: number
  darkMode: boolean
  grainAlpha: number
  textColor: string
}

const _noiseCache = new Map<string, NoiseCacheEntry>()

/**
 * Pre-render noise grain + paper fibers onto an offscreen canvas.
 * Regenerated only when the theme changes — reused across renders.
 * Uses a seeded PRNG for consistent, deterministic results.
 */
function getOrCreateNoiseTexture(
  theme: ThemeDefinition,
): HTMLCanvasElement | null {
  if (isBrutalTheme(theme) || isGlassTheme(theme)) return null
  if (theme.surface.grainAlpha <= 0) return null

  const dark = isDarkTheme(theme)
  const density = isDigitalEditorTheme(theme)
    ? 760
    : dark
      ? (theme.mode === 'cyber' ? 900 : 2200)
      : theme.mode === 'vintage'
        ? 1700
        : theme.mode === 'paper'
          ? 1900
          : theme.mode === 'luxe' || theme.mode === 'frost'
            ? 800
            : 1500

  const cacheKey = `${theme.id}|${density}|${dark}|${theme.surface.grainAlpha}|${theme.palette.text}|${theme.mode}`

  const cached = _noiseCache.get(cacheKey)
  if (cached && cached.density === density && cached.darkMode === dark &&
      cached.grainAlpha === theme.surface.grainAlpha && cached.textColor === theme.palette.text) {
    return cached.canvas
  }

  // Build a pre-rendered noise canvas
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const nctx = canvas.getContext('2d')
  if (!nctx) return null

  const [r, g, b] = hexToRgb(theme.palette.text)
  const rand = mulberry32(42) // fixed seed for reproducibility

  // ── Grain particles ──
  for (let i = 0; i < density; i++) {
    const x = rand() * PAGE_WIDTH
    const y = rand() * PAGE_HEIGHT
    const size = rand() > 0.92 ? 1.4 : 0.8
    const alpha = theme.surface.grainAlpha * (rand() > 0.9 ? 1.4 : 0.8)
    nctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
    nctx.fillRect(x, y, size, size)
  }

  // ── Paper fibers (not for digital, dark, or swiss) ──
  if (!isDigitalEditorTheme(theme) && !dark && theme.mode !== 'swiss') {
    const fiberCount = theme.mode === 'paper' ? 72 : 48
    nctx.lineWidth = 0.7
    nctx.lineCap = 'round'
    for (let i = 0; i < fiberCount; i++) {
      const x = rand() * PAGE_WIDTH
      const y = rand() * PAGE_HEIGHT
      const length = 18 + rand() * 54
      const drift = (rand() - 0.5) * 2.2
      const alpha = theme.surface.grainAlpha * (theme.mode === 'paper' ? 0.52 : 0.36)
      nctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
      nctx.beginPath()
      nctx.moveTo(x, y)
      nctx.lineTo(Math.min(PAGE_WIDTH, x + length), y + drift)
      nctx.stroke()
    }
  }

  _noiseCache.set(cacheKey, { canvas, density, darkMode: dark, grainAlpha: theme.surface.grainAlpha, textColor: theme.palette.text })

  // Prune cache if it grows too large (keep last 12 entries)
  if (_noiseCache.size > 12) {
    const firstKey = _noiseCache.keys().next().value
    if (firstKey !== undefined) _noiseCache.delete(firstKey)
  }

  return canvas
}

// ═══════════════════════════════════════════════════════════════════════════
// Luminance cache — avoids redundant color parsing during render
// ═══════════════════════════════════════════════════════════════════════════

const _luminanceCache = new Map<string, number>()

// ═══════════════════════════════════════════════════════════════════════════
// Theme helpers
// ═══════════════════════════════════════════════════════════════════════════

function isDarkTheme(theme: ThemeDefinition): boolean {
  // Mode-based fast path
  if (theme.mode === 'obsidian' || theme.mode === 'archive' || theme.mode === 'cyber') return true
  // Luminance-based detection — catches dark luxe/glass/brutal themes
  return getPageLuminance(theme) < 0.35
}

/** Perceived brightness of the page background (0–1, 0 = black). */
function getPageLuminance(theme: ThemeDefinition): number {
  const raw = theme.palette.page
  // Check cache first
  const cacheKey = raw
  const cached = _luminanceCache.get(cacheKey)
  if (cached !== undefined) return cached

  // rgb/rgba strings
  const rgbaMatch = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  let luminance: number
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]!) / 255
    const g = parseInt(rgbaMatch[2]!) / 255
    const b = parseInt(rgbaMatch[3]!) / 255
    const linearize = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  } else {
    // hex
    const hex = raw.replace('#', '')
    if (hex.length < 6) luminance = 0.5
    else {
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      const linearize = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
    }
  }
  _luminanceCache.set(cacheKey, luminance)
  return luminance
}

function isDigitalEditorTheme(theme: ThemeDefinition): boolean {
  return theme.id === 'warm-editor'
}

function isBrutalTheme(theme: ThemeDefinition): boolean {
  return theme.mode === 'brutal'
}

function isGlassTheme(theme: ThemeDefinition): boolean {
  return theme.mode === 'glass'
}

function isFrostTheme(theme: ThemeDefinition): boolean {
  return theme.mode === 'frost'
}

function isLuxeTheme(theme: ThemeDefinition): boolean {
  return theme.mode === 'luxe'
}

// ═══════════════════════════════════════════════════════════════════════════
// Shape / clipping
// ═══════════════════════════════════════════════════════════════════════════

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function traceCardShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cornerMode: CardCornerMode,
  radius = 36,
): void {
  if (cornerMode === 'rounded') {
    roundRectPath(ctx, x, y, w, h, radius)
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.closePath()
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Background
// ═══════════════════════════════════════════════════════════════════════════

function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, PAGE_HEIGHT)

  if (theme.mode === 'archive') {
    gradient.addColorStop(0, theme.palette.pageAlt)
    gradient.addColorStop(0.58, theme.palette.page)
    gradient.addColorStop(1, '#101713')
  } else if (theme.mode === 'obsidian') {
    gradient.addColorStop(0, theme.palette.pageAlt)
    gradient.addColorStop(0.55, theme.palette.page)
    gradient.addColorStop(1, '#0e0d0c')
  } else if (theme.mode === 'cyber') {
    gradient.addColorStop(0, '#0f0c1a')
    gradient.addColorStop(0.5, theme.palette.page)
    gradient.addColorStop(1, '#06040d')
  } else if (theme.mode === 'brutal') {
    // Solid background — no gradient for brutalist
    gradient.addColorStop(0, theme.palette.page)
    gradient.addColorStop(1, theme.palette.page)
  } else if (theme.mode === 'luxe') {
    gradient.addColorStop(0, theme.palette.pageAlt)
    gradient.addColorStop(0.6, theme.palette.page)
    gradient.addColorStop(1, '#f0e8d4')
  } else if (theme.mode === 'frost') {
    gradient.addColorStop(0, theme.palette.pageAlt)
    gradient.addColorStop(0.5, theme.palette.page)
    gradient.addColorStop(1, '#e8f0f6')
  } else if (theme.mode === 'glass') {
    // Layered diagonal gradient for glass effect
    const glassGrad = ctx.createLinearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    glassGrad.addColorStop(0, 'rgba(255,255,255,0.6)')
    glassGrad.addColorStop(0.3, '#f5f0ff')
    glassGrad.addColorStop(0.7, '#f8f5ff')
    glassGrad.addColorStop(1, 'rgba(240,235,255,0.7)')
    ctx.fillStyle = glassGrad
    ctx.fill()
    return
  } else if (theme.mode === 'swiss') {
    gradient.addColorStop(0, theme.palette.page)
    gradient.addColorStop(1, theme.palette.page)
  } else {
    gradient.addColorStop(0, theme.palette.pageAlt)
    gradient.addColorStop(1, theme.palette.page)
  }

  ctx.fillStyle = gradient
  ctx.fill()
}

// ── Gradient overlay ──────────────────────────────────────────────────────

/**
 * Draw a soft two-color gradient overlay over the entire card.
 * Blends with the existing background using a low-opacity screen/multiply.
 * Uses the CSS gradient angle convention (0deg = bottom→top).
 */
function drawGradientOverlay(
  ctx: CanvasRenderingContext2D,
  color1: string,
  color2: string,
  angle = 135,
): void {
  ctx.save()
  ctx.globalAlpha = 0.28

  const { x0, y0, x1, y1 } = gradientAngleToPoints(angle, PAGE_WIDTH, PAGE_HEIGHT)
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)

  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Atmosphere (washes, vignettes, digital grid)
// ═══════════════════════════════════════════════════════════════════════════

function drawDigitalGrid(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const gridAlpha = 0.042
  const majorAlpha = 0.062
  ctx.save()
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'multiply' as GlobalCompositeOperation
  ctx.lineWidth = 0.7

  for (let x = 54; x <= PAGE_WIDTH - 54; x += 28) {
    ctx.strokeStyle = hexToRgba(
      theme.palette.text,
      x % 112 === 54 ? majorAlpha : gridAlpha,
    )
    ctx.beginPath()
    ctx.moveTo(x, 42)
    ctx.lineTo(x, PAGE_HEIGHT - 42)
    ctx.stroke()
  }

  for (let y = 54; y <= PAGE_HEIGHT - 54; y += 28) {
    ctx.strokeStyle = hexToRgba(
      theme.palette.text,
      y % 112 === 54 ? majorAlpha : gridAlpha,
    )
    ctx.beginPath()
    ctx.moveTo(42, y)
    ctx.lineTo(PAGE_WIDTH - 42, y)
    ctx.stroke()
  }

  // Accent horizontal line
  ctx.strokeStyle = hexToRgba(theme.palette.accent, 0.09)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(CONTENT_LEFT, 92)
  ctx.lineTo(CONTENT_RIGHT, 92)
  ctx.stroke()
  ctx.restore()
}

function paintAtmosphere(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  if (theme.mode === 'swiss') {
    if (theme.surface.vignetteAlpha > 0) {
      const shade = ctx.createLinearGradient(0, 0, PAGE_WIDTH, 0)
      shade.addColorStop(0, hexToRgba(theme.palette.accent, 0.04))
      shade.addColorStop(0.12, 'rgba(255,255,255,0)')
      shade.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = shade
      ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    }
    return
  }

  ctx.save()
  ctx.globalAlpha = theme.surface.washStrength

  // Top wash
  const topWash = ctx.createRadialGradient(160, 120, 0, 160, 120, 220)
  topWash.addColorStop(
    0,
    isDarkTheme(theme)
      ? hexToRgba(theme.palette.accent, theme.mode === 'archive' ? 0.2 : 0.28)
      : theme.palette.glow,
  )
  topWash.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = topWash
  ctx.beginPath()
  ctx.arc(160, 120, 220, 0, Math.PI * 2)
  ctx.fill()

  // Side wash
  const sideWash = ctx.createRadialGradient(616, 172, 0, 616, 172, 154)
  sideWash.addColorStop(
    0,
    isDarkTheme(theme)
      ? hexToRgba(theme.palette.accent, theme.mode === 'archive' ? 0.14 : 0.18)
      : theme.palette.glow,
  )
  sideWash.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sideWash
  ctx.beginPath()
  ctx.arc(616, 172, 154, 0, Math.PI * 2)
  ctx.fill()

  // Title area wash
  const titleWash = ctx.createRadialGradient(278, 258, 18, 278, 258, 310)
  titleWash.addColorStop(
    0,
    isDarkTheme(theme)
      ? hexToRgba(theme.palette.accent, 0.12)
      : hexToRgba(
          theme.palette.accent,
          theme.mode === 'paper' ? 0.09 : 0.065,
        ),
  )
  titleWash.addColorStop(
    0.55,
    isDarkTheme(theme)
      ? hexToRgba(theme.palette.pageAlt, 0.08)
      : hexToRgba(theme.palette.pageAlt, 0.06),
  )
  titleWash.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = titleWash
  ctx.beginPath()
  ctx.ellipse(278, 258, 310, 190, -0.08, 0, Math.PI * 2)
  ctx.fill()

  // Bottom accent wash
  const bottomWash = ctx.createRadialGradient(94, 820, 0, 94, 820, 124)
  bottomWash.addColorStop(0, theme.palette.accentSoft)
  bottomWash.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = bottomWash
  ctx.beginPath()
  ctx.arc(94, 820, 124, 0, Math.PI * 2)
  ctx.fill()

  // Vintage film sweep
  if (theme.mode === 'vintage') {
    const filmSweep = ctx.createLinearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    filmSweep.addColorStop(0, hexToRgba(theme.palette.accent, 0.08))
    filmSweep.addColorStop(0.4, 'rgba(255,255,255,0)')
    filmSweep.addColorStop(1, hexToRgba(theme.palette.pageAlt, 0.18))
    ctx.fillStyle = filmSweep
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  }

  // Digital editor grid
  if (isDigitalEditorTheme(theme)) {
    drawDigitalGrid(ctx, theme)
  }

  // Paper bloom
  if (theme.mode === 'paper' && !isDigitalEditorTheme(theme)) {
    const bloom = ctx.createLinearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    bloom.addColorStop(0, hexToRgba(theme.palette.pageAlt, 0.08))
    bloom.addColorStop(0.35, 'rgba(255,255,255,0)')
    bloom.addColorStop(1, hexToRgba(theme.palette.accent, 0.04))
    ctx.fillStyle = bloom
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  }

  // Dark vignette
  if (isDarkTheme(theme)) {
    const darkVignette = ctx.createLinearGradient(0, 0, 0, PAGE_HEIGHT)
    darkVignette.addColorStop(
      0,
      theme.mode === 'archive'
        ? 'rgba(255,255,255,0.02)'
        : 'rgba(255,255,255,0.03)',
    )
    darkVignette.addColorStop(
      1,
      theme.mode === 'archive'
        ? 'rgba(0,0,0,0.18)'
        : theme.mode === 'cyber'
          ? 'rgba(0,0,0,0.35)'
          : 'rgba(0,0,0,0.24)',
    )
    ctx.fillStyle = darkVignette
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  }

  // Cyber scanlines
  if (theme.mode === 'cyber') {
    ctx.globalAlpha = 0.04
    for (let y = 0; y < PAGE_HEIGHT; y += 4) {
      ctx.fillStyle = '#00f0ff'
      ctx.fillRect(0, y, PAGE_WIDTH, 2)
    }
    ctx.globalAlpha = theme.surface.washStrength
  }

  // Frost crystalline shimmer
  if (isFrostTheme(theme)) {
    ctx.globalAlpha = 0.06
    ctx.fillStyle = theme.palette.accent
    const cx = PAGE_WIDTH * 0.3
    const cy = PAGE_HEIGHT * 0.25
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const r = 80 + i * 28
      ctx.beginPath()
      ctx.arc(cx + Math.cos(angle) * r * 0.3, cy + Math.sin(angle) * r * 0.3, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = theme.surface.washStrength
  }

  // Luxe gold foil specks
  if (isLuxeTheme(theme)) {
    ctx.globalAlpha = 0.08
    ctx.fillStyle = theme.palette.accent
    const seed = 42
    for (let i = 0; i < 60; i++) {
      const pseudoX = ((seed * (i + 1) * 17) % PAGE_WIDTH)
      const pseudoY = ((seed * (i + 1) * 31) % PAGE_HEIGHT)
      const size = (i % 3 === 0) ? 2.5 : 1.2
      ctx.beginPath()
      ctx.arc(pseudoX, pseudoY, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = theme.surface.washStrength
  }

  // Glass overlay — soft translucent gradient
  if (isGlassTheme(theme)) {
    const glassOverlay = ctx.createLinearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    glassOverlay.addColorStop(0, 'rgba(255,255,255,0.25)')
    glassOverlay.addColorStop(0.4, 'rgba(255,255,255,0.05)')
    glassOverlay.addColorStop(0.6, 'rgba(108,92,231,0.04)')
    glassOverlay.addColorStop(1, 'rgba(255,255,255,0.15)')
    ctx.fillStyle = glassOverlay
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  }

  ctx.restore()

  // Vignette (all themes)
  const vignette = ctx.createRadialGradient(
    PAGE_WIDTH / 2,
    PAGE_HEIGHT / 2,
    PAGE_WIDTH * 0.18,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT / 2,
    PAGE_WIDTH * 0.76,
  )
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, `rgba(0,0,0,${theme.surface.vignetteAlpha})`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Texture (grain + paper fibers)
// ═══════════════════════════════════════════════════════════════════════════

function applyNoiseTexture(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  // Skip texture entirely for brutalist and glass themes
  if (isBrutalTheme(theme) || isGlassTheme(theme)) return
  if (theme.surface.grainAlpha <= 0) return

  const noiseCanvas = getOrCreateNoiseTexture(theme)
  if (!noiseCanvas) return

  ctx.save()
  ctx.globalCompositeOperation = isDarkTheme(theme)
    ? ('screen' as GlobalCompositeOperation)
    : ('multiply' as GlobalCompositeOperation)
  ctx.drawImage(noiseCanvas, 0, 0)
  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. Body drawing — highlights, quotes, paragraphs, dividers
// ═══════════════════════════════════════════════════════════════════════════

function resolveHighlightTreatment(
  theme: ThemeDefinition,
  highlightStyle: HighlightStyle,
): HighlightTreatment {
  if (highlightStyle === theme.editor.highlightStyle)
    return theme.components.highlightTreatment
  if (highlightStyle === 'highlight') return 'boldAccent'
  if (highlightStyle === 'border') return 'swissRule'
  return 'softUnderline'
}

function drawHighlightMark(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  highlightStyle: HighlightStyle,
  x: number,
  baselineY: number,
  tokenWidth: number,
  fontSize: number,
): void {
  const treatment = resolveHighlightTreatment(theme, highlightStyle)
  const accent = theme.palette.accent

  ctx.save()

  if (treatment === 'boldAccent') {
    // No background mark — text styling (bold + accent color) is handled
    // by drawInlineParagraph.
    ctx.restore()
    return
  } else if (treatment === 'swissRule') {
    ctx.strokeStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightDashAlpha, 0.78),
    )
    ctx.lineWidth = theme.mode === 'swiss' ? 4 : 3.2
    ctx.lineCap = theme.mode === 'swiss' ? 'butt' : 'round'
    if (highlightStyle === 'border' || theme.mode !== 'swiss') {
      ctx.setLineDash([10, 5])
    }
    const ruleY = baselineY + Math.max(3, fontSize * 0.08)
    ctx.beginPath()
    ctx.moveTo(x - 1, ruleY)
    ctx.lineTo(x + tokenWidth + 1, ruleY)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    // softUnderline (default) — thick underline below the text baseline
    ctx.fillStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightUnderlineAlpha, 0.44),
    )
    const underlineTop = baselineY + Math.max(2, fontSize * 0.06)
    const underlineHeight = Math.max(5, fontSize * 0.14)
    roundRectPath(
      ctx,
      x - 2,
      underlineTop,
      tokenWidth + 5,
      underlineHeight,
      Math.min(4, underlineHeight / 2),
    )
    ctx.fill()
  }

  ctx.restore()
}

function drawQuoteBlock(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  x: number,
  y: number,
  maxWidth: number,
  blockHeight: number,
  metrics: QuoteBoxMetrics,
): void {
  const treatment = theme.components.quoteTreatment
  const quoteBaseColor =
    treatment === 'paper' && !isDarkTheme(theme)
      ? theme.palette.accent
      : theme.palette.text
  const fillAlpha =
    treatment === 'callout'
      ? Math.max(theme.components.quoteFillAlpha, 0.05)
      : theme.components.quoteFillAlpha

  // Background fill
  ctx.save()
  ctx.fillStyle = hexToRgba(quoteBaseColor, fillAlpha)
  roundRectPath(
    ctx,
    x + metrics.boxOffsetX,
    y,
    maxWidth + metrics.boxWidthOffset,
    blockHeight,
    theme.components.quoteRadius,
  )
  ctx.fill()

  // Border
  ctx.strokeStyle = hexToRgba(
    quoteBaseColor,
    theme.components.quoteStrokeAlpha,
  )
  ctx.lineWidth = treatment === 'code' ? 1.2 : 1
  ctx.stroke()
  ctx.restore()

  // Accent bar
  ctx.save()
  ctx.fillStyle = hexToRgba(
    theme.palette.accent,
    theme.components.quoteBarAlpha,
  )
  roundRectPath(
    ctx,
    x + metrics.barOffsetX,
    y + metrics.barTopInset,
    metrics.barWidth,
    Math.max(24, blockHeight - metrics.barBottomInset),
    metrics.barRadius,
  )
  ctx.fill()
  ctx.restore()
}

function drawDividerBlock(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  x: number,
  y: number,
  maxWidth: number,
  height: number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = isDarkTheme(theme)
    ? ('screen' as GlobalCompositeOperation)
    : ('multiply' as GlobalCompositeOperation)
  ctx.strokeStyle = hexToRgba(
    theme.palette.accent,
    isDarkTheme(theme) ? 0.34 : 0.26,
  )
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + maxWidth * 0.08, y + height * 0.5)
  ctx.lineTo(x + maxWidth * 0.92, y + height * 0.5)
  ctx.stroke()
  ctx.restore()
}

function getDividerBlockHeight(fontSize: number): number {
  return Math.max(18, fontSize * 0.72)
}

// ═══════════════════════════════════════════════════════════════════════════
// Column container drawing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Draw a column container (:::left / :::right) on the canvas.
 * Renders left and right blocks side-by-side, then returns the total height
 * consumed (max of the two columns).
 */
function drawColumnContainer(
  ctx: CanvasRenderingContext2D,
  colBlock: ColumnContainerBlock,
  x: number,
  y: number,
  metrics: PosterMetrics,
  theme: ThemeDefinition,
  settings: TypographySettings,
  highlightStyle: HighlightStyle,
): number {
  const halfWidth = (CONTENT_WIDTH - COLUMN_GAP) / 2
  const leftX = x
  const rightX = x + halfWidth + COLUMN_GAP

  // Save/restore clip region so columns don't bleed into each other
  ctx.save()
  drawColumnBlocks(ctx, colBlock.leftBlocks, leftX, y, halfWidth, metrics, theme, settings, highlightStyle)
  const leftHeight = _colDrawnHeight
  ctx.restore()

  ctx.save()
  drawColumnBlocks(ctx, colBlock.rightBlocks, rightX, y, halfWidth, metrics, theme, settings, highlightStyle)
  const rightHeight = _colDrawnHeight
  ctx.restore()

  // Return the taller column's height + bottom padding
  return Math.max(leftHeight, rightHeight) + 12
}

/** Mutable tracker for the height drawn by drawColumnBlocks. */
let _colDrawnHeight = 0

/**
 * Draw a list of blocks within a constrained column width.
 * Recursively handles text, code, and table blocks.
 */
function drawColumnBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  x: number,
  y: number,
  maxWidth: number,
  metrics: PosterMetrics,
  theme: ThemeDefinition,
  settings: TypographySettings,
  highlightStyle: HighlightStyle,
): void {
  let cursorY = y
  let prevBlock: ParagraphBlock | null = null

  for (const block of blocks) {
    const gap = prevBlock
      ? getGapBetweenBlocks(prevBlock, { kind: 'body', raw: '' }, metrics) * 0.7
      : 0
    cursorY += gap

    if (block.kind === 'body' || block.kind === 'quote' ||
        block.kind === 'subheading' || block.kind === 'divider') {
      const paraBlock = block
      const { height } = measureParagraphBlock(
        paraBlock, metrics.bodySize, metrics.bodyLineHeight,
        maxWidth, theme, settings.subheadingStyle,
        metrics.bodyFontFamily,
      )
      drawInlineParagraph(
        ctx, paraBlock, x, cursorY,
        metrics.bodySize, metrics.bodyLineHeight, maxWidth,
        theme, highlightStyle, settings.subheadingStyle, metrics.bodyFontFamily,
      )
      cursorY += height
      prevBlock = paraBlock
    } else if (block.kind === 'code') {
      const m = measureCodeBlock(block, metrics.bodySize)
      // Scale code block to column width
      const scaleFactor = Math.min(1, maxWidth / CONTENT_WIDTH)
      ctx.save()
      if (scaleFactor < 1) {
        ctx.scale(scaleFactor, 1)
        drawCodeBlock(ctx, block, x / scaleFactor, cursorY, metrics.bodySize, theme)
      } else {
        drawCodeBlock(ctx, block, x, cursorY, metrics.bodySize, theme)
      }
      ctx.restore()
      cursorY += m.height
      prevBlock = { kind: 'body', raw: '' }
    } else if (block.kind === 'table') {
      const { totalHeight } = measureTableBlock(block, metrics.bodySize, metrics.bodyLineHeight, metrics.bodyFontFamily)
      const scaleFactor = Math.min(1, maxWidth / CONTENT_WIDTH)
      ctx.save()
      if (scaleFactor < 1) {
        ctx.scale(scaleFactor, 1)
        drawTableBlock(ctx, block, x / scaleFactor, cursorY,
          metrics.bodySize, metrics.bodyLineHeight, theme, metrics.bodyFontFamily)
      } else {
        drawTableBlock(ctx, block, x, cursorY,
          metrics.bodySize, metrics.bodyLineHeight, theme, metrics.bodyFontFamily)
      }
      ctx.restore()
      cursorY += totalHeight
      prevBlock = { kind: 'body', raw: '' }
    }
  }

  _colDrawnHeight = cursorY - y
}

function drawInlineParagraph(
  ctx: CanvasRenderingContext2D,
  block: ParagraphBlock,
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  maxWidth: number,
  theme: ThemeDefinition,
  highlightStyle: HighlightStyle,
  subheadingStyle: import('./types').SubheadingStyle,
  fontFamily?: string,
): number {
  if (block.kind === 'divider') {
    const h = getDividerBlockHeight(fontSize)
    drawDividerBlock(ctx, theme, x, y, maxWidth, h)
    return 0
  }

  const isQuote = block.kind === 'quote'
  const isSubheading = block.kind === 'subheading'
  // Use heading level for size differentiation (H1-H6)
  const headingLevel = (block as any).headingLevel as number | undefined
  const activeFontSize = isSubheading
    ? Math.round(fontSize * (HEADING_SIZE_RATIOS[headingLevel || 2] ?? 1.12))
    : fontSize
  const activeLineHeight = isSubheading
    ? Math.round(activeFontSize * (headingLevel && headingLevel <= 3 ? [0, 1.25, 1.35, 1.45][headingLevel]! : 1.55))
    : lineHeight
  const quoteMetrics = isQuote
    ? getQuoteBoxMetrics(theme, activeFontSize, maxWidth)
    : null
  const quoteInset = quoteMetrics?.textInset ?? 0
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
  const blockHeight = isQuote
    ? quotePadTop + textHeight + quotePadBottom
    : textHeight

  // Draw quote box background
  if (isQuote && quoteMetrics) {
    drawQuoteBlock(ctx, theme, x, y, maxWidth, blockHeight, quoteMetrics)
  }

  // Resolve highlight treatment once for this paragraph
  const treatment = resolveHighlightTreatment(theme, highlightStyle)

  // Draw each line
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]!
    let cursorX = x + quoteInset
    const textStartY = isQuote ? y + quotePadTop : y
    const baselineY =
      textStartY + activeFontSize * 0.84 + li * activeLineHeight

    for (const token of line.tokens) {
      const tokenWidth = getBodyTokenWidth(token, activeFontSize)

      // Draw highlight mark behind text (no-op for 'boldAccent')
      if (token.mark) {
        drawHighlightMark(
          ctx,
          theme,
          highlightStyle,
          cursorX,
          baselineY,
          tokenWidth,
          activeFontSize,
        )
      }

      ctx.save()
      // 'boldAccent' treatment: marked text is rendered bold + accent color
      const markBoldAccent = token.mark && treatment === 'boldAccent'
      const weight = isSubheading
        ? SUBHEADING_TEXT_WEIGHT
        : (token.bold || markBoldAccent)
          ? BODY_BOLD_WEIGHT
          : isQuote
            ? QUOTE_TEXT_WEIGHT
            : BODY_TEXT_WEIGHT

      const fontStyle = token.italic ? 'italic ' : ''

      ctx.globalCompositeOperation = isDarkTheme(theme)
        ? ('screen' as GlobalCompositeOperation)
        : ('multiply' as GlobalCompositeOperation)
      ctx.font = `${fontStyle}${weight} ${activeFontSize}px ${fontFamily ?? BODY_FONT_FAMILY}`
      ctx.fillStyle =
        isSubheading && subheadingStyle === 'accent'
          ? theme.palette.accent
          : markBoldAccent
            ? theme.palette.accent
            : theme.palette.text
      ctx.fillText(token.text, cursorX, baselineY)

      // Draw underline for ^underline^ tokens
      if (token.underline) {
        const ulineY = baselineY + Math.max(2, activeFontSize * 0.08)
        ctx.strokeStyle = ctx.fillStyle
        ctx.lineWidth = Math.max(1, activeFontSize * 0.05)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cursorX, ulineY)
        ctx.lineTo(cursorX + tokenWidth, ulineY)
        ctx.stroke()
      }

      ctx.restore()

      cursorX += tokenWidth
    }
  }

  return lines.length
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Footer
// ═══════════════════════════════════════════════════════════════════════════

function getFooterRightText(
  mode: string,
  index: number,
  totalPages: number,
): string {
  if (mode === 'page')
    return `${String(index + 1).padStart(2, '0')}/${totalPages}`
  if (mode === 'date') {
    const d = new Date()
    const pad = (v: number) => String(v).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return ''
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  index: number,
  totalPages: number,
  footerLeft: string,
  footerRightMode: string,
): void {
  const leftText = footerLeft.trim()
  const rightText = getFooterRightText(footerRightMode, index, totalPages)
  const textAlpha = Math.max(0.52, theme.surface.footerTextAlpha * 0.74)

  // Horizontal rule
  ctx.strokeStyle = hexToRgba(
    theme.palette.text,
    theme.surface.footerLineAlpha * 0.72,
  )
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(FOOTER_LINE_LEFT, FOOTER_LINE_Y)
  ctx.lineTo(FOOTER_LINE_RIGHT, FOOTER_LINE_Y)
  ctx.stroke()

  // Left text
  ctx.fillStyle = hexToRgba(theme.palette.text, textAlpha)
  ctx.font = `500 13px ${FOOTER_FONT_FAMILY}`
  ctx.textBaseline = 'alphabetic'
  if (leftText) ctx.fillText(leftText, CONTENT_LEFT, FOOTER_TEXT_Y)

  // Right text
  if (rightText) {
    ctx.save()
    ctx.textAlign = 'right'
    ctx.font = `500 13px ${FOOTER_FONT_FAMILY}`
    ctx.fillStyle = hexToRgba(theme.palette.text, textAlpha)
    ctx.fillText(rightText, CONTENT_RIGHT, FOOTER_TEXT_Y)
    ctx.restore()
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main render function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a single card page to a Canvas element.
 *
 * Pipeline order:
 *   1. Create canvas (2x resolution)
 *   2. Background gradient
 *   3. Shape clipping (rounded or square)
 *   4. Atmosphere (washes, vignettes, grids)
 *   5. Texture (grain, fibers)
 *   6. Body paragraphs (with highlights + quotes)
 *   7. Footer
 *
 * Returns the canvas with the rendered card.
 */
export function renderCard(opts: RenderOptions): HTMLCanvasElement {
  const {
    page,
    theme,
    settings,
    highlightStyle,
    pageIndex,
    totalPages,
    footerLeft,
    footerRightMode,
    footerEnabled,
    cardCornerMode,
  } = opts

  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH * CANVAS_SCALE
  canvas.height = PAGE_HEIGHT * CANVAS_SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')
  ctx.scale(CANVAS_SCALE, CANVAS_SCALE)

  const metrics = getPosterMetrics(page, settings, footerEnabled)

  // ── 1-3. Background + shape + clip ──
  if (isBrutalTheme(theme)) {
    // Brutalist: no shadow, thick border drawn after fill
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  } else if (isGlassTheme(theme)) {
    // Glass: extra glow
    ctx.shadowColor = theme.palette.shadow
    ctx.shadowBlur = 32
    ctx.shadowOffsetY = 16
  } else {
    ctx.shadowColor = theme.palette.shadow
    ctx.shadowBlur = theme.mode === 'swiss' ? 18 : 40
    ctx.shadowOffsetY = theme.mode === 'swiss' ? 12 : 24
  }

  traceCardShape(ctx, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, cardCornerMode,
    isBrutalTheme(theme) ? 0 : 36)
  drawBackground(ctx, theme)

  // Brutalist: draw thick border stroke
  if (isBrutalTheme(theme)) {
    ctx.save()
    traceCardShape(ctx, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, cardCornerMode, 0)
    ctx.strokeStyle = theme.palette.border
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.restore()
  }

  ctx.save()
  traceCardShape(ctx, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, cardCornerMode,
    isBrutalTheme(theme) ? 0 : 36)
  ctx.clip()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // ── 4. Atmosphere ──
  paintAtmosphere(ctx, theme)

  // ── 5. Texture ──
  applyNoiseTexture(ctx, theme)

  // ── 5.5 Gradient overlay ──
  if (opts.gradientConfig?.enabled) {
    drawGradientOverlay(ctx, opts.gradientConfig.color1, opts.gradientConfig.color2, opts.gradientConfig.angle)
  }

  ctx.restore()

  // ── 6. Body blocks (dispatched by block kind) ──
  let paragraphY = metrics.bodyTopY
  let previousBlock: ParagraphBlock | null = null
  for (let bi = 0; bi < page.blocks.length; bi++) {
    const paragraph = page.blocks[bi]!
    const blockTopWithGap = paragraphY + (previousBlock
      ? getGapBetweenBlocks(previousBlock, paragraph as ParagraphBlock, metrics)
      : 0)

    // ── Text blocks (body / quote / subheading / divider) ──────────
    if (paragraph.kind === 'body' || paragraph.kind === 'quote' ||
        paragraph.kind === 'subheading' || paragraph.kind === 'divider') {
      const block: ParagraphBlock = paragraph
      paragraphY = blockTopWithGap
      const { height } = measureParagraphBlock(
        block,
        metrics.bodySize,
        metrics.bodyLineHeight,
        metrics.bodyWidth,
        theme,
        settings.subheadingStyle,
        metrics.bodyFontFamily,
      )
      const blockBottom = paragraphY + height
      if (blockBottom > metrics.bodyBottomY) return canvas

      drawInlineParagraph(
        ctx, block, CONTENT_LEFT, paragraphY,
        metrics.bodySize, metrics.bodyLineHeight, metrics.bodyWidth,
        theme, highlightStyle, settings.subheadingStyle, metrics.bodyFontFamily,
      )


      paragraphY = blockBottom
      previousBlock = block
      continue
    }

    // ── Code blocks ───────────────────────────────────────────────
    if (paragraph.kind === 'code') {
      const { height } = measureCodeBlock(paragraph, metrics.bodySize)
      const blockBottom = blockTopWithGap + height
      if (blockBottom > metrics.bodyBottomY && page.blocks.indexOf(paragraph) > 0) break
      paragraphY = blockTopWithGap
      const drawnH = drawCodeBlock(ctx, paragraph, CONTENT_LEFT, paragraphY, metrics.bodySize, theme)
      paragraphY += drawnH
      previousBlock = { kind: 'body', raw: '' }
      continue
    }

    // ── Table blocks ──────────────────────────────────────────────
    if (paragraph.kind === 'table') {
      const { totalHeight } = measureTableBlock(paragraph, metrics.bodySize, metrics.bodyLineHeight, metrics.bodyFontFamily)
      const blockBottom = blockTopWithGap + totalHeight
      if (blockBottom > metrics.bodyBottomY && page.blocks.indexOf(paragraph) > 0) break
      paragraphY = blockTopWithGap
      const drawnH = drawTableBlock(ctx, paragraph, CONTENT_LEFT, paragraphY,
        metrics.bodySize, metrics.bodyLineHeight, theme, metrics.bodyFontFamily)
      paragraphY += drawnH
      previousBlock = { kind: 'body', raw: '' }
      continue
    }

    // ── Column containers ────────────────────────────────────────
    if (paragraph.kind === 'columnContainer') {
      const colBlock = paragraph
      if (colBlock.leftBlocks.length === 0 && colBlock.rightBlocks.length === 0) {
        continue
      }
      paragraphY = blockTopWithGap
      const drawnH = drawColumnContainer(
        ctx, colBlock,
        CONTENT_LEFT, paragraphY,
        metrics, theme, settings, highlightStyle,
      )
      paragraphY += drawnH
      previousBlock = { kind: 'body', raw: '' }
      continue
    }
  }

  // ── 7. Footer ──
  if (footerEnabled) {
    drawFooter(
      ctx,
      theme,
      pageIndex,
      totalPages,
      footerLeft,
      footerRightMode,
    )
  }

  return canvas
}
