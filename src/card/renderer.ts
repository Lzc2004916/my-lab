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
  TextRange,
  ThemeDefinition,
  TitleFontMode,
  TitleCustomization,
  TitleAlignment,
  CardCornerMode,
  TypographySettings,
  ColumnContainerBlock,
  Block,
} from './types'
import { DEFAULT_TITLE_CUSTOM } from './types'
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
  TITLE_FONT_MODES,
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
import { drawMathBlock, measureMathBlock } from './math-renderer'
import { drawMermaidBlock } from './mermaid'
import { drawDecor } from './decor-renderer'

// ═══════════════════════════════════════════════════════════════════════════
// Color utilities
// ═══════════════════════════════════════════════════════════════════════════

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return `rgba(36,52,70,${alpha})`
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const value = hex.replace('#', '')
  if (value.length !== 6) return [36, 52, 70]
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

function mixHexColors(fromHex: string, toHex: string, ratio: number): string {
  const from = fromHex.replace('#', '')
  const to = toHex.replace('#', '')
  if (from.length !== 6 || to.length !== 6) return toHex
  const fr = parseInt(from.slice(0, 2), 16)
  const fg = parseInt(from.slice(2, 4), 16)
  const fb = parseInt(from.slice(4, 6), 16)
  const tr = parseInt(to.slice(0, 2), 16)
  const tg = parseInt(to.slice(2, 4), 16)
  const tb = parseInt(to.slice(4, 6), 16)
  const mix = (s: number, e: number) => Math.round(s + (e - s) * ratio)
  return `rgb(${mix(fr, tr)},${mix(fg, tg)},${mix(fb, tb)})`
}

// ═══════════════════════════════════════════════════════════════════════════
// Theme helpers
// ═══════════════════════════════════════════════════════════════════════════

function isDarkTheme(theme: ThemeDefinition): boolean {
  return theme.mode === 'obsidian' || theme.mode === 'archive' || theme.mode === 'cyber'
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

  const [r, g, b] = hexToRgb(theme.palette.text)
  const density = isDigitalEditorTheme(theme)
    ? 760
    : isDarkTheme(theme)
      ? (theme.mode === 'cyber' ? 900 : 2200)
      : theme.mode === 'vintage'
        ? 1700
        : theme.mode === 'paper'
          ? 1900
          : theme.mode === 'luxe' || theme.mode === 'frost'
            ? 800
            : 1500

  ctx.save()
  ctx.globalCompositeOperation = isDarkTheme(theme)
    ? ('screen' as GlobalCompositeOperation)
    : ('multiply' as GlobalCompositeOperation)

  // Grain particles
  for (let i = 0; i < density; i++) {
    const x = Math.random() * PAGE_WIDTH
    const y = Math.random() * PAGE_HEIGHT
    const size = Math.random() > 0.92 ? 1.4 : 0.8
    const alpha =
      theme.surface.grainAlpha * (Math.random() > 0.9 ? 1.4 : 0.8)
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
    ctx.fillRect(x, y, size, size)
  }

  // Paper fibers (not for digital or dark or swiss)
  if (
    !isDigitalEditorTheme(theme) &&
    !isDarkTheme(theme) &&
    theme.mode !== 'swiss'
  ) {
    const fiberCount = theme.mode === 'paper' ? 72 : 48
    ctx.lineWidth = 0.7
    ctx.lineCap = 'round'
    for (let i = 0; i < fiberCount; i++) {
      const x = Math.random() * PAGE_WIDTH
      const y = Math.random() * PAGE_HEIGHT
      const length = 18 + Math.random() * 54
      const drift = (Math.random() - 0.5) * 2.2
      const alpha =
        theme.surface.grainAlpha *
        (theme.mode === 'paper' ? 0.52 : 0.36)
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(Math.min(PAGE_WIDTH, x + length), y + drift)
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Cover ornament
// ═══════════════════════════════════════════════════════════════════════════

// ── Gradient text title (cyber, glass themes) ────────────────────────────

function drawGradientTitle(
  ctx: CanvasRenderingContext2D,
  titleLines: string[],
  titleSize: number,
  titleFontMode: TitleFontMode,
  titleStartY: number,
  titleLineHeight: number,
  gradientColors: [string, string],
  alignment: TitleAlignment,
  custom?: TitleCustomization,
): void {
  ctx.save()

  // Create gradient across full title area
  const colors = gradientColors
  const gradient = ctx.createLinearGradient(CONTENT_LEFT, titleStartY - titleSize * 0.3, CONTENT_RIGHT, titleStartY + titleLineHeight * titleLines.length)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(0.5, colors[1])
  gradient.addColorStop(1, colors[0])

  ctx.fillStyle = gradient
  ctx.globalCompositeOperation = 'source-over'

  const weight = getTitleFontWeight(titleFontMode, custom)

  for (let li = 0; li < titleLines.length; li++) {
    const line = titleLines[li]!
    const lineY = titleStartY + li * titleLineHeight

    // Center the title for gradient themes
    ctx.font = `${weight} ${titleSize}px ${resolveTitleFontFamily(titleFontMode, true)}`
    let x = alignment === 'center' ? (PAGE_WIDTH - ctx.measureText(line).width) / 2 : CONTENT_LEFT

    ctx.fillText(line, x, lineY)
  }

  ctx.restore()
}

// ── Drop cap rendering ──────────────────────────────────────────────────

function drawDropCap(
  ctx: CanvasRenderingContext2D,
  firstChar: string,
  restOfLine: string,
  x: number,
  y: number,
  fontSize: number,
  _lineHeight: number,
  theme: ThemeDefinition,
): number {
  const dropCapSize = fontSize * 2.6
  const dropCapColor = theme.palette.accent
  const mode = theme.editor.titleFontMode

  ctx.save()
  ctx.fillStyle = hexToRgba(dropCapColor, 0.85)
  ctx.font = `700 ${dropCapSize}px ${resolveTitleFontFamily(mode, /[A-Za-z]/.test(firstChar))}`
  ctx.fillText(firstChar, x, y + dropCapSize * 0.7)

  // Draw rest of line normally
  const capWidth = ctx.measureText(firstChar).width + 6
  ctx.fillStyle = theme.palette.text
  ctx.font = `400 ${fontSize}px ${BODY_FONT_FAMILY}`
  ctx.fillText(restOfLine, x + capWidth, y + fontSize * 0.84)

  ctx.restore()
  return capWidth
}

function drawCoverOrnament(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  metrics: PosterMetrics,
  titleFontMode: TitleFontMode,
  alignment: TitleAlignment,
): void {
  if (theme.mode === 'swiss' || theme.mode === 'brutal' || theme.mode === 'cyber' || theme.mode === 'glass' || isDigitalEditorTheme(theme)) return
  ctx.save()
  ctx.fillStyle = isDarkTheme(theme)
    ? hexToRgba(theme.palette.text, 0.08)
    : theme.mode === 'paper'
      ? hexToRgba(theme.palette.text, 0.06)
      : theme.mode === 'vintage'
        ? hexToRgba(theme.palette.accent, 0.14)
        : 'rgba(255,255,255,0.18)'
  const fontFamily =
    TITLE_FONT_MODES[titleFontMode]?.family ?? TITLE_FONT_MODES.serif.family
  ctx.font = `500 ${Math.round(metrics.titleSize * 1.46)}px ${fontFamily}`

  // Position ornament according to alignment
  const ornamentX =
    alignment === 'center'
      ? PAGE_WIDTH / 2 - 140
      : alignment === 'right'
        ? CONTENT_RIGHT - 42
        : 58

  ctx.fillText(
    '“',
    ornamentX,
    metrics.titleStartY - Math.max(18, metrics.titleSize * 0.24),
  )
  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Title drawing
// ═══════════════════════════════════════════════════════════════════════════

function getTitleFontWeight(mode: TitleFontMode, custom?: TitleCustomization): number {
  if (custom && custom.fontWeight > 0) return custom.fontWeight
  if (mode === 'display') return 800
  if (mode === 'handwriting') return 500
  if (mode === 'monoTitle') return 700
  return mode === 'retroSerif' || mode === 'sans' || mode === 'puhuiti'
    ? 700
    : 600
}

function getTitleTracking(size: number, mode: TitleFontMode, custom?: TitleCustomization): number {
  if (custom && custom.letterSpacing > 0) return custom.letterSpacing
  if (mode === 'retroSerif') return Math.max(2, size * 0.03)
  if (mode === 'display') return Math.max(-1, -size * 0.01)
  if (mode === 'handwriting') return Math.max(1, size * 0.015)
  if (mode === 'monoTitle') return 0
  return 0
}

/** Measure a single title line's rendered width (for alignment calc).
 *  Uses the same measurement approach as measure.ts for consistency. */
function measureTitleTextForLine(
  line: string,
  size: number,
  mode: TitleFontMode,
  custom?: TitleCustomization,
): number {
  const weight = getTitleFontWeight(mode, custom)
  const tracking = getTitleTracking(size, mode, custom)
  let width = 0
  // Reuse a single canvas context per script type
  const cjkCtx = document.createElement('canvas').getContext('2d')
  const latinCtx = document.createElement('canvas').getContext('2d')
  if (!cjkCtx || !latinCtx) return 0
  cjkCtx.font = `${weight} ${size}px ${resolveTitleFontFamily(mode, false)}`
  latinCtx.font = `${weight} ${size}px ${resolveTitleFontFamily(mode, true)}`

  const chars = Array.from(line)
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!
    const isLatin = /[A-Za-z0-9]/.test(char)
    const ctx = isLatin ? latinCtx : cjkCtx
    width += ctx.measureText(char).width
    const nextChar = chars[i + 1]
    if (nextChar && !/\s/.test(char) && !/\s/.test(nextChar)) {
      width += tracking
    }
  }
  return width
}

function resolveTitleFontFamily(mode: TitleFontMode, isLatin: boolean): string {
  const config = TITLE_FONT_MODES[mode] ?? TITLE_FONT_MODES.serif
  return isLatin ? config.latinFamily : config.family
}

function splitLatinRuns(text: string): string[] {
  return (
    text.match(/[A-Za-z0-9][A-Za-z0-9\s'&/.-]*|[^A-Za-z0-9]+/g) ?? [text]
  )
}

function drawTitleLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  size: number,
  mode: TitleFontMode,
  custom?: TitleCustomization,
  options?: {
    globalCharStart?: number
    accentRanges?: TextRange[]
    normalColor?: string
    accentColor?: string
    accentWeight?: number
  },
): number {
  let cursorX = x
  let globalCharIdx = options?.globalCharStart ?? 0
  const tracking = getTitleTracking(size, mode, custom)
  const titleWeight = getTitleFontWeight(mode, custom)

  for (const segment of splitLatinRuns(line)) {
    const isLatin = /^[A-Za-z0-9\s'&/.-]+$/.test(segment)
    const chars = Array.from(segment)

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i]!
      const isAccent = Boolean(
        options?.accentRanges?.some(
          (range) =>
            globalCharIdx >= range.start && globalCharIdx < range.end,
        ) && !/\s/.test(char),
      )
      const activeWeight = isAccent
        ? (options?.accentWeight ?? Math.min(titleWeight + 100, 700))
        : titleWeight

      ctx.font = `${activeWeight} ${size}px ${resolveTitleFontFamily(mode, isLatin)}`
      ctx.fillStyle = isAccent
        ? (options?.accentColor ?? ctx.fillStyle)
        : (options?.normalColor ?? ctx.fillStyle)
      ctx.fillText(char, cursorX, y)
      cursorX += ctx.measureText(char).width

      const nextChar = chars[i + 1]
      if (nextChar && !/\s/.test(char) && !/\s/.test(nextChar)) {
        cursorX += tracking
      }
      globalCharIdx += 1
    }
  }

  return globalCharIdx - (options?.globalCharStart ?? 0)
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
  if (highlightStyle === 'border') return 'swissRule'
  if (highlightStyle === 'marker')
    return isDarkTheme(theme) ? 'darkGlow' : 'warmSwipe'
  return theme.mode === 'sage' ? 'botanicalStroke' : 'softUnderline'
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

  if (treatment === 'editorMark') {
    ctx.fillStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightMarkerAlpha, 0.28),
    )
    roundRectPath(
      ctx,
      x - 5,
      baselineY - fontSize * 0.6,
      tokenWidth + 10,
      Math.max(17, fontSize * 0.52),
      6,
    )
    ctx.fill()
  } else if (treatment === 'warmSwipe') {
    ctx.globalCompositeOperation = isDarkTheme(theme)
      ? ('screen' as GlobalCompositeOperation)
      : ('multiply' as GlobalCompositeOperation)
    ctx.fillStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightMarkerAlpha, 0.24),
    )
    roundRectPath(
      ctx,
      x - 5,
      baselineY - fontSize * 0.48,
      tokenWidth + 12,
      Math.max(15, fontSize * 0.42),
      8,
    )
    ctx.fill()
  } else if (treatment === 'darkGlow') {
    ctx.globalCompositeOperation = 'screen' as GlobalCompositeOperation
    ctx.shadowColor = hexToRgba(accent, 0.34)
    ctx.shadowBlur = 10
    ctx.fillStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightMarkerAlpha, 0.2),
    )
    roundRectPath(
      ctx,
      x - 4,
      baselineY - fontSize * 0.52,
      tokenWidth + 8,
      Math.max(14, fontSize * 0.46),
      7,
    )
    ctx.fill()
  } else if (treatment === 'botanicalStroke') {
    ctx.strokeStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightUnderlineAlpha, 0.5),
    )
    ctx.lineWidth = Math.max(5, fontSize * 0.16)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 1, baselineY + fontSize * 0.11)
    ctx.bezierCurveTo(
      x + tokenWidth * 0.24,
      baselineY + fontSize * 0.2,
      x + tokenWidth * 0.72,
      baselineY + fontSize * 0.02,
      x + tokenWidth + 2,
      baselineY + fontSize * 0.12,
    )
    ctx.stroke()
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
    ctx.beginPath()
    ctx.moveTo(x - 1, baselineY + Math.max(5, fontSize * 0.12))
    ctx.lineTo(x + tokenWidth + 1, baselineY + Math.max(5, fontSize * 0.12))
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    // softUnderline (default)
    ctx.fillStyle = hexToRgba(
      accent,
      Math.max(theme.components.highlightUnderlineAlpha, 0.44),
    )
    roundRectPath(
      ctx,
      x - 2,
      baselineY - fontSize * 0.25,
      tokenWidth + 5,
      Math.max(8, fontSize * 0.22),
      4,
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
 * Recursively handles text, code, table, math, and mermaid blocks.
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
    } else if (block.kind === 'mathBlock') {
      const m = measureMathBlock(block, metrics.bodySize)
      drawMathBlock(ctx, block, x, cursorY, metrics.bodySize)
      cursorY += m.height
      prevBlock = { kind: 'body', raw: '' }
    } else if (block.kind === 'mermaid') {
      const estH = block.estimatedHeight || 180
      drawMermaidBlock(ctx, block, x, cursorY, metrics.bodySize)
      cursorY += estH + 16
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
    ? lineHeight * 1.02
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

  // Draw each line
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]!
    let cursorX = x + quoteInset
    const textStartY = isQuote ? y + quotePadTop : y
    const baselineY =
      textStartY + activeFontSize * 0.84 + li * activeLineHeight

    for (const token of line.tokens) {
      const tokenWidth = getBodyTokenWidth(token, activeFontSize)

      // Draw highlight mark behind text
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
      const weight = isSubheading
        ? SUBHEADING_TEXT_WEIGHT
        : token.bold
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
// 9. Footer
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
 *   6. Inner frame
 *   7. Cover ornament + title (cover pages only)
 *   8. Body paragraphs (with highlights + quotes)
 *   9. Footer
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

  ctx.restore()

  // ── 6.5 Decor ornaments ──
  drawDecor(ctx, theme, metrics.titleStartY + metrics.titleLineHeight * metrics.titleLines.length)

  // ── 7. Cover title ──
  if (page.kind === 'cover' && page.title.trim()) {
    const accentRanges = metrics.titleAccentRanges
    const titleCustom = settings.titleCustom ?? DEFAULT_TITLE_CUSTOM

    // Title normal color: custom overrides theme
    const titleNormalColor =
      titleCustom.color || theme.palette.text

    // Title accent color: if custom color is set, use it at higher alpha;
    // otherwise mix from theme palette
    const titleAccentColor = titleCustom.color
      ? titleCustom.color
      : mixHexColors(
          theme.palette.text,
          theme.palette.accent,
          theme.surface.titleAccentMix,
        )

    const titleAccentWeight =
      settings.titleFontMode === 'serif'
        ? 600
        : settings.titleFontMode === 'retroSerif' ||
            settings.titleFontMode === 'sans' ||
            settings.titleFontMode === 'puhuiti'
          ? 700
          : 600

    // Compute title X position from alignment
    const alignment = titleCustom.alignment
    drawCoverOrnament(ctx, theme, metrics, settings.titleFontMode, alignment)

    // Gradient title for cyber and glass themes
    if (theme.mode === 'cyber' || theme.mode === 'glass') {
      drawGradientTitle(
        ctx,
        metrics.titleLines,
        metrics.titleSize,
        settings.titleFontMode,
        metrics.titleStartY,
        metrics.titleLineHeight,
        theme.mode === 'cyber'
          ? ['#00f0ff', '#b400ff']
          : ['#6c5ce7', '#a29bfe'],
        alignment,
        titleCustom,
      )
      ctx.restore()
      // Skip normal title rendering below
    } else {

    ctx.save()
    ctx.globalCompositeOperation = isDarkTheme(theme)
      ? ('screen' as GlobalCompositeOperation)
      : ('multiply' as GlobalCompositeOperation)

    if (theme.mode === 'paper') {
      ctx.shadowColor = 'rgba(255,255,255,0.34)'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 1
    } else if (theme.mode === 'archive') {
      ctx.shadowColor = 'rgba(0,0,0,0.24)'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 1
    }

    // Pre-measure total title width for center/right alignment
    let totalTitleWidth = 0
    if (alignment !== 'left') {
      for (const line of metrics.titleLines) {
        const w = measureTitleTextForLine(line, metrics.titleSize, settings.titleFontMode, titleCustom)
        if (w > totalTitleWidth) totalTitleWidth = w
      }
    }

    const titleBaseX =
      alignment === 'center'
        ? (PAGE_WIDTH - totalTitleWidth) / 2
        : alignment === 'right'
          ? CONTENT_RIGHT - totalTitleWidth
          : CONTENT_LEFT

    let titleCharOffset = 0
    for (let li = 0; li < metrics.titleLines.length; li++) {
      const line = metrics.titleLines[li]!
      // For left alignment: use CONTENT_LEFT; for center/right: use computed base
      const lineX = alignment === 'left' ? CONTENT_LEFT : titleBaseX
      titleCharOffset += drawTitleLine(
        ctx,
        line,
        lineX,
        metrics.titleStartY + li * metrics.titleLineHeight,
        metrics.titleSize,
        settings.titleFontMode,
        titleCustom,
        {
          globalCharStart: titleCharOffset,
          accentRanges,
          normalColor: titleNormalColor,
          accentColor: titleAccentColor,
          accentWeight: titleAccentWeight,
        },
      )
    }
    ctx.restore()
    } // end else (non-gradient title path)
  }

  // ── 8. Body blocks (dispatched by block kind) ──
  let paragraphY = metrics.bodyTopY
  let previousBlock: ParagraphBlock | null = null
  let firstBodyDrawn = false

  for (let bi = 0; bi < page.blocks.length; bi++) {
    const paragraph = page.blocks[bi]!
    const blockTopWithGap = paragraphY + (previousBlock
      ? getGapBetweenBlocks(previousBlock, { kind: 'body', raw: '' }, metrics)
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

      // Drop cap for first body paragraph in luxe / botanical / ink-wash themes
      if (!firstBodyDrawn && block.kind === 'body' && block.raw.length > 0 &&
          (isLuxeTheme(theme) || theme.id === 'botanical-field' || theme.id === 'ink-wash')) {
        const firstChar = Array.from(block.raw)[0] ?? ''
        const restText = block.raw.length > 1 ? block.raw.slice(Array.from(block.raw)[0]!.length) : ''
        if (firstChar && !/\s/.test(firstChar)) {
          drawDropCap(ctx, firstChar, restText.slice(0, 40),
            CONTENT_LEFT, paragraphY, metrics.bodySize, metrics.bodyLineHeight, theme)
        }
        firstBodyDrawn = true
      }

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

    // ── Math blocks ───────────────────────────────────────────────
    if (paragraph.kind === 'mathBlock') {
      const m = measureMathBlock(paragraph, metrics.bodySize)
      const blockBottom = blockTopWithGap + m.height
      if (blockBottom > metrics.bodyBottomY && page.blocks.indexOf(paragraph) > 0) break
      paragraphY = blockTopWithGap
      const drawnH = drawMathBlock(ctx, paragraph, CONTENT_LEFT, paragraphY, metrics.bodySize)
      paragraphY += drawnH
      previousBlock = { kind: 'body', raw: '' }
      continue
    }

    // ── Mermaid blocks ────────────────────────────────────────────
    if (paragraph.kind === 'mermaid') {
      const estH = paragraph.estimatedHeight || 180
      const blockBottom = blockTopWithGap + estH + 16
      if (blockBottom > metrics.bodyBottomY && page.blocks.indexOf(paragraph) > 0) break
      paragraphY = blockTopWithGap
      const drawnH = drawMermaidBlock(ctx, paragraph, CONTENT_LEFT, paragraphY, metrics.bodySize)
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

  // ── 9. Footer ──
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
