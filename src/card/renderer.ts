// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — Canvas 渲染管线
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
  ListBlock,
  ListStyleConfig,
  HeadingStyleOverrides,
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
  COLUMN_GAP,
  DEFAULT_LIST_STYLE,
  resolveHeadingSize,
  resolveHeadingLineHeight,
  resolveHeadingColor,
  resolveHeadingFontWeight,
  resolveHeadingStroke,
  resolveHeadingStrokeWidth,
  resolveHeadingShadow,
} from './types'
import {
  getPosterMetrics,
  getGapBetweenBlocks,
  measureParagraphBlock,
  measureListBlock,
  getBodyTokenWidth,
  parseInlineMarkdown,
  wrapInlineTokensByWidth,
  getParagraphVisualHeight,
  getQuoteBoxMetrics,
} from './measure'
import { drawCodeBlock, measureCodeBlock } from './code-renderer'
import { drawTableBlock, measureTableBlock } from './table-renderer'
import { hexToRgba, hexToRgb, gradientAngleToPoints } from './color-utils'
import { drawDecor } from './decor-renderer'

// ═══════════════════════════════════════════════════════════════════════════
// 种子伪随机数发生器 (mulberry32) — 快速、确定性、避免 Math.random() 开销
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
// 预生成的噪声纹理缓存
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
 * 将噪声纹理和纸张纤维预渲染到离屏画布上。
 * 仅在主题更改时重新生成 — 跨渲染重复使用。
 * 使用种子 PRNG 以获得一致、确定性的结果。
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

  // 构建预渲染的噪声画布
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

  // 缓存过大时清理（保留最后 12 个条目）
  if (_noiseCache.size > 12) {
    const firstKey = _noiseCache.keys().next().value
    if (firstKey !== undefined) _noiseCache.delete(firstKey)
  }

  return canvas
}

// ═══════════════════════════════════════════════════════════════════════════
// 亮度缓存 — 避免渲染时重复解析颜色
// ═══════════════════════════════════════════════════════════════════════════

const _luminanceCache = new Map<string, number>()

// ═══════════════════════════════════════════════════════════════════════════
// 主题辅助函数
// ═══════════════════════════════════════════════════════════════════════════

function isDarkTheme(theme: ThemeDefinition): boolean {
  // 基于模式的快速路径
  if (theme.mode === 'obsidian' || theme.mode === 'archive' || theme.mode === 'cyber') return true
  // 基于亮度的检测 — 捕获暗色 luxe/glass/brutal 主题
  return getPageLuminance(theme) < 0.35
}

/** 页面背景的感知亮度（0–1，0 = 黑色）。 */
function getPageLuminance(theme: ThemeDefinition): number {
  const raw = theme.palette.page
  // 先检查缓存
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
// 形状 / 裁剪
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
    // 纯色背景 — brutalist 不使用渐变
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
    // 分层对角渐变，产生玻璃效果
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
 * 在整个卡片上绘制柔和的双色渐变叠加层。
 * 使用低透明度 screen/multiply 与现有背景混合。
 * 使用 CSS 渐变角度约定（0deg = 底部→顶部）。
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

  // 强调色水平线
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

  // 顶部淡色层
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

  // 侧边淡色层
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

  // 标题区域淡色层
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

  // 底部强调色淡色层
  const bottomWash = ctx.createRadialGradient(94, 820, 0, 94, 820, 124)
  bottomWash.addColorStop(0, theme.palette.accentSoft)
  bottomWash.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = bottomWash
  ctx.beginPath()
  ctx.arc(94, 820, 124, 0, Math.PI * 2)
  ctx.fill()

  // 复古胶片扫描效果
  if (theme.mode === 'vintage') {
    const filmSweep = ctx.createLinearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    filmSweep.addColorStop(0, hexToRgba(theme.palette.accent, 0.08))
    filmSweep.addColorStop(0.4, 'rgba(255,255,255,0)')
    filmSweep.addColorStop(1, hexToRgba(theme.palette.pageAlt, 0.18))
    ctx.fillStyle = filmSweep
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  }

  // 数字编辑器网格
  if (isDigitalEditorTheme(theme)) {
    drawDigitalGrid(ctx, theme)
  }

  // 纸张光晕
  if (theme.mode === 'paper' && !isDigitalEditorTheme(theme)) {
    const bloom = ctx.createLinearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    bloom.addColorStop(0, hexToRgba(theme.palette.pageAlt, 0.08))
    bloom.addColorStop(0.35, 'rgba(255,255,255,0)')
    bloom.addColorStop(1, hexToRgba(theme.palette.accent, 0.04))
    ctx.fillStyle = bloom
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  }

  // 暗色渐晕
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

  // 赛博扫描线
  if (theme.mode === 'cyber') {
    ctx.globalAlpha = 0.04
    for (let y = 0; y < PAGE_HEIGHT; y += 4) {
      ctx.fillStyle = '#00f0ff'
      ctx.fillRect(0, y, PAGE_WIDTH, 2)
    }
    ctx.globalAlpha = theme.surface.washStrength
  }

  // 霜结晶微光效果
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

  // 奢华金箔斑点
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

  // 玻璃叠加层 — 柔和半透明渐变
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

  // 渐晕效果（所有主题）
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
  // brutalist 和 glass 主题完全跳过纹理
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
  highlightColor?: string | null,
): void {
  const treatment = resolveHighlightTreatment(theme, highlightStyle)
  const accent = highlightColor ?? theme.palette.accent

  ctx.save()

  if (treatment === 'boldAccent') {
    // 无背景标记 — 文本样式（粗体 + 强调色）由 drawInlineParagraph 处理
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
  // Use accent color for fill on light themes (paper & callout) so the
  // quote background is visibly tinted rather than a near-invisible dark wash.
  // Dark themes and 'code' treatment keep text-color fill for contrast.
  const quoteBaseColor =
    !isDarkTheme(theme) && treatment !== 'code'
      ? theme.palette.accent
      : theme.palette.text
  const fillAlpha =
    treatment === 'callout'
      ? Math.max(theme.components.quoteFillAlpha, 0.07)
      : Math.max(theme.components.quoteFillAlpha, 0.03)

  // 背景填充
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

  // 边框
  ctx.strokeStyle = hexToRgba(
    quoteBaseColor,
    theme.components.quoteStrokeAlpha,
  )
  ctx.lineWidth = treatment === 'code' ? 1.2 : 1
  ctx.stroke()
  ctx.restore()

  // 强调色边条
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
// 列表绘制
// ═══════════════════════════════════════════════════════════════════════════

/** 获取有序列表的编号字符串。 */
function getOrderedListNumber(index: number, start = 1): string {
  return `${start + index}.`
}

/** 在画布上绘制列表块，返回消耗的总高度。 */
function drawListBlock(
  ctx: CanvasRenderingContext2D,
  block: ListBlock,
  x: number,
  y: number,
  fontSize: number,
  bodyLineHeight: number,
  maxWidth: number,
  theme: ThemeDefinition,
  fontFamily?: string,
  bodyFontWeight?: number,
): number {
  const listStyle: ListStyleConfig = theme.editor.list ?? DEFAULT_LIST_STYLE
  const resolvedWeight = bodyFontWeight ?? theme.editor.bodyFontWeight ?? BODY_TEXT_WEIGHT
  const isDark = isDarkTheme(theme)

  const bulletSize = Math.round(fontSize * listStyle.bulletSizeRatio)
  const bulletGap = Math.max(4, Math.round(fontSize * 0.22))

  const { itemHeights, totalHeight } = measureListBlock(
    block, fontSize, bodyLineHeight, maxWidth, theme, fontFamily, resolvedWeight,
  )

  let cursorY = y + 12 // top padding

  for (let ii = 0; ii < block.items.length; ii++) {
    const item = block.items[ii]!
    const indent = item.indent * listStyle.indentPerLevel
    // 有序列表 100% 正文；无序列表至少 90% 正文兜底
    const isOrdered = block.kind === 'orderedList'
    const effectiveMarkerSize = isOrdered
      ? fontSize
      : Math.max(bulletSize, Math.round(fontSize * 0.9))
    const textWidth = Math.max(60, maxWidth - indent - effectiveMarkerSize - bulletGap)
    const itemX = x + indent
    const markerX = itemX
    const textX = itemX + effectiveMarkerSize + bulletGap

    // Parse and wrap the item text
    const tokens = parseInlineMarkdown(item.text)
    const lines = wrapInlineTokensByWidth(
      tokens, fontSize, textWidth, fontFamily, bodyFontWeight,
    )

    const itemHeight = itemHeights[ii]!

    // Draw marker (bullet or number)
    ctx.save()
    ctx.globalCompositeOperation = isDark
      ? ('screen' as GlobalCompositeOperation)
      : ('multiply' as GlobalCompositeOperation)

    // 无序列表符号至少 88% 正文大小兜底
    const ulMarkerSize = Math.max(bulletSize, Math.round(fontSize * 0.9))
    const markerFont = `500 ${ulMarkerSize}px ${fontFamily ?? BODY_FONT_FAMILY}`
    ctx.font = markerFont
    ctx.fillStyle = theme.palette.accent
    ctx.textBaseline = 'alphabetic'

    // Align marker with first line of text
    const markerBaselineY = cursorY + fontSize * 0.84

    if (block.kind === 'orderedList') {
      const numText = getOrderedListNumber(ii, block.start ?? 1)
      // 有序列表编号统一 100% 正文大小
      const olFont = `600 ${fontSize}px ${fontFamily ?? BODY_FONT_FAMILY}`

      if (listStyle.orderedMarkerBox) {
        // 圆角边框编号 — 无后缀点号
        const numClean = numText.replace(/\.$/, '')
        const markerSize = fontSize
        ctx.textAlign = 'center'
        ctx.font = olFont
        const numWidth = ctx.measureText(numClean).width
        // 正方形盒子 = 正圆形边框，取宽高中较大者保证编号完整可见
        const pad = Math.round(markerSize * 0.32)
        const boxSide = Math.max(numWidth, markerSize) + pad * 2
        const boxW = boxSide
        const boxH = boxSide
        const boxRadius = Math.round(boxSide / 2) // 正方形 → 正圆

        // 盒子整体左移 pad*2，避免与正文重叠
        const numRight = textX - Math.round(bulletGap * 0.4) - pad * 2
        const numCenterX = numRight - numWidth / 2
        const visualCenterY = markerBaselineY - markerSize * 0.3

        const boxX = numCenterX - boxW / 2
        const boxY = visualCenterY - boxH / 2

        // 描边圆角矩形
        ctx.strokeStyle = theme.palette.accent
        ctx.lineWidth = Math.max(1.4, Math.round(markerSize * 0.1))
        roundRectPath(ctx, boxX, boxY, boxW, boxH, boxRadius)
        ctx.stroke()

        // 编号文字使用 accent 色（无点号）
        ctx.fillStyle = theme.palette.accent
        ctx.fillText(numClean, numCenterX, markerBaselineY)
      } else {
        // 无框有序列表 — 同样 100% 正文字号
        ctx.font = olFont
        ctx.textAlign = 'right'
        ctx.fillText(numText, textX - Math.round(bulletGap * 0.4), markerBaselineY)
      }
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(listStyle.bulletChar, markerX + bulletSize / 2, markerBaselineY)
    }

    ctx.restore()

    // Draw each line of text
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]!
      let cursorX = textX
      const baselineY = cursorY + fontSize * 0.84 + li * bodyLineHeight

      for (const token of line.tokens) {
        const tokenWidth = getBodyTokenWidth(token, fontSize)

        ctx.save()
        ctx.globalCompositeOperation = isDark
          ? ('screen' as GlobalCompositeOperation)
          : ('multiply' as GlobalCompositeOperation)

        const weight = token.bold ? BODY_BOLD_WEIGHT : resolvedWeight
        const fontStyle = token.italic ? 'italic ' : ''
        ctx.font = `${fontStyle}${weight} ${fontSize}px ${fontFamily ?? BODY_FONT_FAMILY}`
        ctx.fillStyle = theme.palette.text

        ctx.fillText(token.text, cursorX, baselineY)

        // Draw underline for ^underline^ tokens
        if (token.underline) {
          const ulineY = baselineY + Math.max(2, fontSize * 0.08)
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = Math.max(1, fontSize * 0.05)
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

    cursorY += itemHeight + listStyle.itemGap
  }

  return totalHeight
}

// ═══════════════════════════════════════════════════════════════════════════
// 列容器绘制
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 在 canvas 上绘制列容器（:::left / :::right）。
 * 左右并排渲染块，然后返回总高度
 * 给布局引擎。consumed (max of the two columns).
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
  headingOverrides?: HeadingStyleOverrides | null,
  highlightColor?: string | null,
): number {
  const halfWidth = (CONTENT_WIDTH - COLUMN_GAP) / 2
  const leftX = x
  const rightX = x + halfWidth + COLUMN_GAP

  // 保存/恢复裁剪区域，防止列之间相互渗透
  ctx.save()
  drawColumnBlocks(ctx, colBlock.leftBlocks, leftX, y, halfWidth, metrics, theme, settings, highlightStyle, headingOverrides, highlightColor)
  const leftHeight = _colDrawnHeight
  ctx.restore()

  ctx.save()
  drawColumnBlocks(ctx, colBlock.rightBlocks, rightX, y, halfWidth, metrics, theme, settings, highlightStyle, headingOverrides, highlightColor)
  const rightHeight = _colDrawnHeight
  ctx.restore()

  // 返回较高列的高度 + 底部内边距
  return Math.max(leftHeight, rightHeight) + 12
}

/** 可变的追踪器，用于记录 drawColumnBlocks 绘制的高度。 */
let _colDrawnHeight = 0

/**
 * 在受限列宽内绘制块列表。
 * 递归处理文本、代码和表格块。
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
  headingOverrides?: HeadingStyleOverrides | null,
  highlightColor?: string | null,
): void {
  const colBodyWeight = settings.bodyFontWeight ?? theme.editor.bodyFontWeight ?? BODY_TEXT_WEIGHT
  let cursorY = y
  let prevBlock: ParagraphBlock | null = null

  for (const block of blocks) {
    const gap = prevBlock
      ? getGapBetweenBlocks(prevBlock, { kind: 'body', raw: '' }, metrics, headingOverrides, theme, false) * 0.7
      : 0
    cursorY += gap

    if (block.kind === 'body' || block.kind === 'quote' ||
        block.kind === 'subheading' || block.kind === 'divider') {
      const paraBlock = block
      const { height } = measureParagraphBlock(
        paraBlock, metrics.bodySize, metrics.bodyLineHeight,
        maxWidth, theme, settings.subheadingStyle,
        metrics.bodyFontFamily,
        false, // columns are never cover pages
        headingOverrides,
        colBodyWeight,
      )
      drawInlineParagraph(
        ctx, paraBlock, x, cursorY,
        metrics.bodySize, metrics.bodyLineHeight, maxWidth,
        theme, highlightStyle, settings.subheadingStyle, metrics.bodyFontFamily,
        false, // columns are never cover pages
        headingOverrides,
        colBodyWeight,
        highlightColor,
      )
      cursorY += height
      prevBlock = paraBlock
    } else if (block.kind === 'code') {
      const m = measureCodeBlock(block, metrics.bodySize)
      // 将代码块缩放至列宽
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
    } else if (block.kind === 'orderedList' || block.kind === 'unorderedList') {
      const listBlock = block as ListBlock
      const scaleFactor = Math.min(1, maxWidth / CONTENT_WIDTH)
      ctx.save()
      if (scaleFactor < 1) {
        ctx.scale(scaleFactor, 1)
        cursorY += drawListBlock(ctx, listBlock, x / scaleFactor, cursorY,
          metrics.bodySize, metrics.bodyLineHeight, maxWidth / scaleFactor,
          theme, metrics.bodyFontFamily, colBodyWeight)
      } else {
        cursorY += drawListBlock(ctx, listBlock, x, cursorY,
          metrics.bodySize, metrics.bodyLineHeight, maxWidth,
          theme, metrics.bodyFontFamily, colBodyWeight)
      }
      ctx.restore()
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
  /** 封面页（首张拆分卡片）— H1 使用大字报效果。 */
  isCover = false,
  headingOverrides?: HeadingStyleOverrides | null,
  bodyFontWeight?: number,
  highlightColor?: string | null,
): number {
  if (block.kind === 'divider') {
    const h = getDividerBlockHeight(fontSize)
    drawDividerBlock(ctx, theme, x, y, maxWidth, h)
    return 0
  }

  const isQuote = block.kind === 'quote'
  const isSubheading = block.kind === 'subheading'
  // 使用标题级别进行尺寸区分（H1-H6）— 优先级：用户覆盖 > per-theme heading config
  const headingLevel = (block as any).headingLevel as number | undefined
  const activeFontSize = isSubheading
    ? resolveHeadingSize(headingLevel || 2, fontSize, theme, headingOverrides, isCover && headingLevel === 1)
    : fontSize
  const activeLineHeight = isSubheading
    ? Math.round(activeFontSize * resolveHeadingLineHeight(headingLevel || 2, theme, isCover && headingLevel === 1))
    : lineHeight
  const quoteMetrics = isQuote
    ? getQuoteBoxMetrics(theme, activeFontSize, maxWidth)
    : null
  const quoteInset = quoteMetrics?.textInset ?? 0
  const quoteWidth = quoteMetrics?.textWidth ?? maxWidth

  // 标题块使用标题字重换行，避免 body 字重（400）与渲染字重（最高 900）
  // 不一致导致换行位置和字符间距计算错误，造成文字叠加。
  const wrapWeight = isSubheading && headingLevel
    ? resolveHeadingFontWeight(headingLevel, theme)
    : (bodyFontWeight ?? theme.editor.bodyFontWeight)
  const lines = wrapInlineTokensByWidth(
    parseInlineMarkdown(block.raw),
    activeFontSize,
    quoteWidth,
    fontFamily,
    wrapWeight,
  )
  // 标题高度与 measureParagraphBlock 保持一致：lineHeight × 行数，
  // H1 强制最小块高度 ≥ fontSize × 1.2，防止紧行高主题文字溢出。
  const textHeight = isSubheading
    ? (headingLevel === 1
        ? Math.max(lines.length * activeLineHeight, Math.round(activeFontSize * 1.2))
        : lines.length * activeLineHeight)
    : getParagraphVisualHeight(
        lines.length,
        activeFontSize,
        activeLineHeight,
      )
  const quotePadTop = quoteMetrics?.paddingTop ?? 0
  const quotePadBottom = quoteMetrics?.paddingBottom ?? 0
  const blockHeight = isQuote
    ? quotePadTop + textHeight + quotePadBottom
    : textHeight

  // 绘制引用框背景
  if (isQuote && quoteMetrics) {
    drawQuoteBlock(ctx, theme, x, y, maxWidth, blockHeight, quoteMetrics)
  }

  // 为该段落一次性解析高亮处理方式
  const treatment = resolveHighlightTreatment(theme, highlightStyle)

  // H1 文本对齐：计算行级偏移量
  const h1Align = isSubheading && headingLevel === 1
    ? (headingOverrides?.h1Align ?? 'left')
    : 'left'

  // 绘制每一行
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]!
    let cursorX = x + quoteInset
    const textStartY = isQuote ? y + quotePadTop : y
    const baselineY =
      textStartY + activeFontSize * 0.84 + li * activeLineHeight

    // H1 居中对齐 / 右对齐：计算整行宽度后调整起始 X
    if (h1Align !== 'left') {
      let totalLineWidth = 0
      for (const token of line.tokens) {
        totalLineWidth += getBodyTokenWidth(token, activeFontSize, fontFamily, wrapWeight)
      }
      if (h1Align === 'center') {
        cursorX = x + (maxWidth - totalLineWidth) / 2
      } else if (h1Align === 'right') {
        cursorX = x + maxWidth - totalLineWidth
      }
    }

    for (const token of line.tokens) {
      const tokenWidth = getBodyTokenWidth(token, activeFontSize, fontFamily, wrapWeight)

      // 为 ==mark== 标记绘制高亮背景（'boldAccent' 不绘制）
      if (token.mark) {
        drawHighlightMark(
          ctx,
          theme,
          highlightStyle,
          cursorX,
          baselineY,
          tokenWidth,
          activeFontSize,
          highlightColor,
        )
      }

      ctx.save()
      // 'boldAccent' treatment: marked text is rendered bold + accent color
      const markBoldAccent = token.mark && treatment === 'boldAccent'
      const headingFontWeight = isSubheading && headingLevel
        ? resolveHeadingFontWeight(headingLevel, theme)
        : SUBHEADING_TEXT_WEIGHT
      const bodyTextWeight = bodyFontWeight ?? theme.editor.bodyFontWeight ?? BODY_TEXT_WEIGHT
      const weight = isSubheading
        ? headingFontWeight
        : (token.bold || markBoldAccent)
          ? BODY_BOLD_WEIGHT
          : isQuote
            ? QUOTE_TEXT_WEIGHT
            : bodyTextWeight

      const fontStyle = token.italic ? 'italic ' : ''

      ctx.globalCompositeOperation = isDarkTheme(theme)
        ? ('screen' as GlobalCompositeOperation)
        : ('multiply' as GlobalCompositeOperation)
      ctx.font = `${fontStyle}${weight} ${activeFontSize}px ${fontFamily ?? BODY_FONT_FAMILY}`

      // 标题颜色：用户覆盖 > per-theme heading color > subheading accent > 默认文本
      const headingColor = isSubheading && headingLevel
        ? resolveHeadingColor(headingLevel, theme, headingOverrides)
        : undefined
      ctx.fillStyle =
        headingColor
          ? headingColor
          : isSubheading && subheadingStyle === 'accent'
            ? theme.palette.accent
            : markBoldAccent
              ? (highlightColor ?? theme.palette.accent)
              : theme.palette.text

      // ── 标题阴影（仅 subheading 块） ──────────────────────────────
      if (isSubheading && headingLevel) {
        const headingShadow = resolveHeadingShadow(headingLevel, theme, headingOverrides)
        if (headingShadow) {
          ctx.shadowColor = headingShadow
          ctx.shadowBlur = 4
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2
        }
      }

      // ── 标题描边（仅 subheading 块） ──────────────────────────────
      if (isSubheading && headingLevel) {
        const headingStroke = resolveHeadingStroke(headingLevel, theme, headingOverrides)
        if (headingStroke) {
          const sw = resolveHeadingStrokeWidth(headingLevel, theme, headingOverrides)
          ctx.strokeStyle = headingStroke
          ctx.lineWidth = sw
          ctx.lineJoin = 'miter'
          ctx.miterLimit = 2
          ctx.strokeText(token.text, cursorX, baselineY)
        }
      }

      ctx.fillText(token.text, cursorX, baselineY)

      // Reset shadow after drawing (to avoid affecting other elements)
      if (isSubheading && headingLevel) {
        const headingShadow = resolveHeadingShadow(headingLevel, theme, headingOverrides)
        if (headingShadow) {
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }
      }

      // 为 ^underline^ token 绘制下划线
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

  // 水平分隔线
  ctx.strokeStyle = hexToRgba(
    theme.palette.text,
    theme.surface.footerLineAlpha * 0.72,
  )
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(FOOTER_LINE_LEFT, FOOTER_LINE_Y)
  ctx.lineTo(FOOTER_LINE_RIGHT, FOOTER_LINE_Y)
  ctx.stroke()

  // 左侧文本
  ctx.fillStyle = hexToRgba(theme.palette.text, textAlpha)
  ctx.font = `500 13px ${FOOTER_FONT_FAMILY}`
  ctx.textBaseline = 'alphabetic'
  if (leftText) ctx.fillText(leftText, CONTENT_LEFT, FOOTER_TEXT_Y)

  // 右侧文本
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
// 主渲染函数
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 将单个卡片页面渲染到 Canvas 元素。
 *
 * 管线顺序：
 *   1. 创建 canvas（2x 分辨率）
 *   2. 背景渐变
 *   3. 形状裁剪（圆角或方形）
 *   4. 氛围（水洗、渐晕、网格）
 *   5. 纹理（噪声、纤维）
 *   6. 正文段落（含高亮和引用）
 *   7. 页脚
 *
 * 返回渲染完成的卡片 canvas。
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
    highlightColor,
  } = opts

  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH * CANVAS_SCALE
  canvas.height = PAGE_HEIGHT * CANVAS_SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')
  ctx.scale(CANVAS_SCALE, CANVAS_SCALE)

  const metrics = getPosterMetrics(page, settings, footerEnabled)
  const bodyFontWeight = settings.bodyFontWeight ?? theme.editor.bodyFontWeight ?? BODY_TEXT_WEIGHT

  // ── 1-3. Background + shape + clip ──
  if (isBrutalTheme(theme)) {
    // Brutalist：无阴影，填充后绘制粗边框
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  } else if (isGlassTheme(theme)) {
    // Glass：额外发光
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

  // Brutalist：绘制粗边框描边
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

  // ── 5.6 Decor ornaments ──
  drawDecor(ctx, theme)

  ctx.restore()

  // ── 6. Body blocks (dispatched by block kind) ──
  let paragraphY = metrics.bodyTopY
  let previousBlock: ParagraphBlock | null = null
  for (let bi = 0; bi < page.blocks.length; bi++) {
    const paragraph = page.blocks[bi]!
    const blockTopWithGap = paragraphY + (previousBlock
      ? getGapBetweenBlocks(previousBlock, paragraph as ParagraphBlock, metrics, opts.headingOverrides, theme, page.kind === 'cover')
      : 0)

    // ── Text blocks (body / quote / subheading / divider) ──────────
    if (paragraph.kind === 'body' || paragraph.kind === 'quote' ||
        paragraph.kind === 'subheading' || paragraph.kind === 'divider') {
      const block: ParagraphBlock = paragraph
      paragraphY = blockTopWithGap
      const isCover = page.kind === 'cover'
      const { height } = measureParagraphBlock(
        block,
        metrics.bodySize,
        metrics.bodyLineHeight,
        metrics.bodyWidth,
        theme,
        settings.subheadingStyle,
        metrics.bodyFontFamily,
        isCover,
        opts.headingOverrides,
        bodyFontWeight,
      )
      const blockBottom = paragraphY + height
      if (blockBottom > metrics.bodyBottomY) return canvas

      drawInlineParagraph(
        ctx, block, CONTENT_LEFT, paragraphY,
        metrics.bodySize, metrics.bodyLineHeight, metrics.bodyWidth,
        theme, highlightStyle, settings.subheadingStyle, metrics.bodyFontFamily,
        isCover,
        opts.headingOverrides,
        bodyFontWeight,
        highlightColor,
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

    // ── List blocks ────────────────────────────────────────────
    if (paragraph.kind === 'orderedList' || paragraph.kind === 'unorderedList') {
      const listBlock = paragraph as ListBlock
      const { totalHeight } = measureListBlock(
        listBlock, metrics.bodySize, metrics.bodyLineHeight,
        metrics.bodyWidth, theme, metrics.bodyFontFamily,
        bodyFontWeight,
      )
      const blockBottom = blockTopWithGap + totalHeight
      if (blockBottom > metrics.bodyBottomY && page.blocks.indexOf(paragraph) > 0) break
      paragraphY = blockTopWithGap
      const drawnH = drawListBlock(
        ctx, listBlock,
        CONTENT_LEFT, paragraphY,
        metrics.bodySize, metrics.bodyLineHeight, metrics.bodyWidth,
        theme, metrics.bodyFontFamily,
        bodyFontWeight,
      )
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
        opts.headingOverrides,
        highlightColor,
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