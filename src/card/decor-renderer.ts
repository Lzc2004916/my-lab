// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 装饰性点缀渲染器
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
 * Swiss/luxe 风格角括号。
 * 在内容区域的四个角绘制细 L 形括号。
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
    // 左上
    { x: CONTENT_LEFT + inset, y: inset + 20, dx1: 1, dy1: 0, dx2: 0, dy2: 1 },
    // 右上
    { x: CONTENT_RIGHT - inset, y: inset + 20, dx1: -1, dy1: 0, dx2: 0, dy2: 1 },
    // 左下
    { x: CONTENT_LEFT + inset, y: PAGE_HEIGHT - inset - 20, dx1: 1, dy1: 0, dx2: 0, dy2: -1 },
    // 右下
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
 * 标题区域下方的粗装饰分隔线。
 * 用于暗色/luxe 主题作为视觉分隔符。
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

  // 主分隔线
  ctx.beginPath()
  ctx.moveTo(CONTENT_LEFT, y)
  ctx.lineTo(CONTENT_RIGHT, y)
  ctx.stroke()

  // 下方细强调色线
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
 * 水晶几何图案 — 菱形/六边形网格。
 * 用于 frost 和 cyber 主题。
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

  // 菱形网格
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
 * 赛博/科技电路板走线。
 * 带有终端点的角度路径。
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

  // 角部电路走线
  const traces = [
    // 右上角
    [
      [PAGE_WIDTH - 10, 52], [PAGE_WIDTH - 42, 52],
      [PAGE_WIDTH - 42, 62], [PAGE_WIDTH - 32, 62],
      [PAGE_WIDTH - 32, 72],
    ],
    // 左下角
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

    // 末端终止点
    const end = trace[trace.length - 1]!
    ctx.beginPath()
    ctx.arc(end[0]!, end[1]!, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ── Watermark ──────────────────────────────────────────────────────────────

/**
 * 微妙的背景水印或印章标记。
 * 用于 ink-wash 和 midnight-ink 主题。
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

  // 右下角大幅微妙的印章标记
  const size = 140 * scale
  const x = PAGE_WIDTH - 72
  const y = PAGE_HEIGHT - 72

  ctx.font = `${size}px serif`
  ctx.fillText('印', x, y)

  ctx.restore()
}

// ── Gold foil specks ───────────────────────────────────────────────────────

/**
 * 随机金箔粒子，用于 luxe 主题。
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

  // 确定性伪随机布局
  const seed = 137
  for (let i = 0; i < 45; i++) {
    const px = ((seed * (i + 1) * 23 + i * 7) % (PAGE_WIDTH - 80)) + 40
    const py = ((seed * (i + 1) * 41 + i * 13) % (PAGE_HEIGHT - 120)) + 60
    const size = 0.6 + (i % 5) * 0.5
    const particleAlpha = alpha * (0.5 + (i % 3) * 0.25)

    ctx.fillStyle = hexToRgba(color, particleAlpha)
    ctx.beginPath()
    // 不规则金箔形状
    if (i % 4 === 0) {
      // 菱形
      ctx.moveTo(px, py - size)
      ctx.lineTo(px + size * 0.7, py)
      ctx.lineTo(px, py + size)
      ctx.lineTo(px - size * 0.7, py)
    } else {
      // 圆形
      ctx.arc(px, py, size, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  ctx.restore()
}

// ── Leaf motif ─────────────────────────────────────────────────────────────

/**
 * 边距中的植物叶子插图。
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

  // 在页边距中绘制 2-3 片简单的叶子形状
  const leaves = [
    { x: 22, y: 180, angle: -0.3, size: 14 * scale },
    { x: 24, y: 340, angle: 0.2, size: 11 * scale },
    { x: 20, y: 500, angle: -0.15, size: 12 * scale },
  ]

  for (const leaf of leaves) {
    ctx.save()
    ctx.translate(leaf.x, leaf.y)
    ctx.rotate(leaf.angle)

    // 叶子形状（贝塞尔曲线）
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

    // 中心叶脉
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
 * 北极光/极光渐变效果，用于 frost 主题。
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

  // 极光带 1
  const aurora1 = ctx.createLinearGradient(0, 0, PAGE_WIDTH, 0)
  aurora1.addColorStop(0, 'rgba(58, 200, 220, 0)')
  aurora1.addColorStop(0.3, `rgba(58, 200, 220, ${alpha * 0.6})`)
  aurora1.addColorStop(0.5, `rgba(120, 220, 180, ${alpha})`)
  aurora1.addColorStop(0.7, `rgba(180, 200, 240, ${alpha * 0.5})`)
  aurora1.addColorStop(1, 'rgba(200, 220, 255, 0)')
  ctx.fillStyle = aurora1
  ctx.fillRect(0, 80, PAGE_WIDTH, 40)

  // 极光带 2
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
 * Art Deco 放射状扇形/日出图案。
 * 从角落辐射的线条 — 经典克莱斯勒大厦主题。
 * 用于 art-deco 主题。
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

/** 从原点绘制一组放射状射线。 */
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

    // 交错长度 — 阶梯几何节奏（Ziggurat 效果）
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

    // 选中射线末端的小点（星点效果）
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

// ── macOS window chrome ─────────────────────────────────────────────────────

/**
 * macOS 窗口风格装饰 — 左上角三色控制按钮 + 淡紫色弧形装饰线。
 *
 * 根据 UI.md「极简柔光卡片」提示词：
 *   • 左上角三颗小圆控制按钮：🔴关闭 🟡最小化 🟢最大化
 *   • 按钮旁有纤细淡紫色弧形装饰线条
 *
 * 在卡片顶部绘制，不依赖标题是否存在。
 */
export function drawMacosWindow(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'macosWindow') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  // ── 布局参数 ──────────────────────────────────────────────────────────
  const topY = 26 * scale           // 按钮圆心 Y
  const startX = CONTENT_LEFT + 2  // 第一个按钮圆心 X
  const btnRadius = 6.5 * scale     // 按钮半径
  const btnGap = 18 * scale         // 按钮圆心间距

  // macOS 三色按钮
  const buttons = [
    { color: '#ff5f57', label: 'close' },
    { color: '#febc2e', label: 'minimize' },
    { color: '#28c840', label: 'maximize' },
  ]

  ctx.save()

  // ── 绘制三颗控制按钮 ─────────────────────────────────────────────────
  for (let i = 0; i < buttons.length; i++) {
    const cx = startX + i * btnGap
    const cy = topY
    const btn = buttons[i]!

    // 按钮底色（实心圆）
    ctx.fillStyle = btn.color
    ctx.globalAlpha = alpha * 0.92
    ctx.beginPath()
    ctx.arc(cx, cy, btnRadius, 0, Math.PI * 2)
    ctx.fill()

    // 微弱的内部高光（模拟玻璃质感）
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.globalAlpha = alpha * 0.45
    ctx.beginPath()
    ctx.arc(cx - btnRadius * 0.25, cy - btnRadius * 0.3, btnRadius * 0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  }

  // ── 淡紫色弧形装饰线 ─────────────────────────────────────────────────
  // 从第三个按钮右侧开始，向右上方轻挑后回落
  const arcStartX = startX + 2 * btnGap + btnRadius + 8 * scale
  const arcStartY = topY

  ctx.strokeStyle = hexToRgba(color, alpha * 0.55)
  ctx.lineWidth = 1.1 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(arcStartX, arcStartY)
  // 贝塞尔曲线：先向上微挑，再向右平缓延伸
  ctx.bezierCurveTo(
    arcStartX + 16 * scale, arcStartY - 10 * scale,   // CP1: 右上方
    arcStartX + 44 * scale, arcStartY - 4 * scale,    // CP2: 更右，接近水平
    arcStartX + 62 * scale, arcStartY + 2 * scale,     // 终点: 平缓回落
  )
  ctx.stroke()

  // 第二段更细的弧线，略下方
  ctx.strokeStyle = hexToRgba(color, alpha * 0.35)
  ctx.lineWidth = 0.7 * scale

  ctx.beginPath()
  ctx.moveTo(arcStartX + 4 * scale, arcStartY + 5 * scale)
  ctx.bezierCurveTo(
    arcStartX + 20 * scale, arcStartY - 3 * scale,
    arcStartX + 48 * scale, arcStartY + 1 * scale,
    arcStartX + 64 * scale, arcStartY + 6 * scale,
  )
  ctx.stroke()

  ctx.restore()
}

// ── Desert sun (canyon sunset) ──────────────────────────────────────────────

/**
 * 日落峡谷装饰 — 地平线 + 太阳 + 飞鸟剪影。
 * 用于 canyon-sunset 主题。
 */
export function drawDesertSun(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'desertSun') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.globalAlpha = alpha

  // ── 太阳（半圆，从地平线升起/落下）──────────────────────────────────
  const sunCx = PAGE_WIDTH * 0.72
  const sunCy = PAGE_HEIGHT - 148 * scale
  const sunR = 42 * scale

  // 太阳光晕
  const glowGrad = ctx.createRadialGradient(sunCx, sunCy, sunR * 0.5, sunCx, sunCy, sunR * 2.2)
  glowGrad.addColorStop(0, hexToRgba(color, 0.75))
  glowGrad.addColorStop(0.5, hexToRgba(color, 0.32))
  glowGrad.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(sunCx, sunCy, sunR * 2.2, 0, Math.PI * 2)
  ctx.fill()

  // 太阳本体
  ctx.fillStyle = hexToRgba(color, 0.88)
  ctx.beginPath()
  ctx.arc(sunCx, sunCy, sunR, 0, Math.PI * 2)
  ctx.fill()

  // ── 地平线（柔和起伏的 mesa 轮廓）───────────────────────────────────
  const horizonY = sunCy + 4 * scale
  ctx.strokeStyle = hexToRgba(color, 0.70)
  ctx.lineWidth = 2.0 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(CONTENT_LEFT - 10, horizonY + 14 * scale)
  // 平缓起伏的山脊线
  ctx.lineTo(CONTENT_LEFT + 60 * scale, horizonY - 6 * scale)
  ctx.lineTo(CONTENT_LEFT + 140 * scale, horizonY + 8 * scale)
  ctx.lineTo(CONTENT_LEFT + 240 * scale, horizonY - 2 * scale)
  ctx.lineTo(CONTENT_LEFT + 340 * scale, horizonY + 10 * scale)
  ctx.lineTo(CONTENT_LEFT + 420 * scale, horizonY - 4 * scale)
  ctx.lineTo(CONTENT_RIGHT + 10, horizonY + 6 * scale)
  ctx.stroke()

  // 第二条更远的地平线（更淡）
  ctx.strokeStyle = hexToRgba(color, 0.40)
  ctx.lineWidth = 1.1 * scale
  ctx.beginPath()
  ctx.moveTo(CONTENT_LEFT - 10, horizonY + 32 * scale)
  ctx.lineTo(CONTENT_LEFT + 100 * scale, horizonY + 22 * scale)
  ctx.lineTo(CONTENT_LEFT + 200 * scale, horizonY + 28 * scale)
  ctx.lineTo(CONTENT_LEFT + 320 * scale, horizonY + 18 * scale)
  ctx.lineTo(CONTENT_LEFT + 460 * scale, horizonY + 26 * scale)
  ctx.lineTo(CONTENT_RIGHT + 10, horizonY + 20 * scale)
  ctx.stroke()

  // ── 飞鸟剪影（V 形标记）─────────────────────────────────────────────
  ctx.strokeStyle = hexToRgba(color, 0.60)
  ctx.lineWidth = 1.5 * scale
  const birds = [
    { x: sunCx - 80 * scale, y: sunCy - 28 * scale, s: 1.0 },
    { x: sunCx - 55 * scale, y: sunCy - 36 * scale, s: 0.7 },
    { x: sunCx - 30 * scale, y: sunCy - 22 * scale, s: 0.85 },
  ]
  for (const b of birds) {
    const bs = 5 * scale * b.s
    ctx.beginPath()
    ctx.moveTo(b.x - bs, b.y - bs * 0.5)
    ctx.lineTo(b.x, b.y)
    ctx.lineTo(b.x + bs, b.y - bs * 0.5)
    ctx.stroke()
  }

  ctx.restore()
}

// ── Sakura petals ───────────────────────────────────────────────────────────

/**
 * 樱花花瓣装饰 — 散落的五瓣樱花。
 * 用于 sakura-blizzard 主题。
 */
export function drawSakuraPetal(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'sakuraPetal') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.globalAlpha = alpha

  // 确定性花瓣布局（伪随机种子）
  const seed = 271
  const petalCount = 14
  for (let i = 0; i < petalCount; i++) {
    const px = ((seed * (i + 1) * 37 + i * 19) % (PAGE_WIDTH - 120)) + 40
    const py = ((seed * (i + 1) * 53 + i * 31) % (PAGE_HEIGHT - 160)) + 40
    const petalSize = (3.5 + (i % 4) * 2.2) * scale
    const rotation = ((i * 47 + 13) % 360) * (Math.PI / 180)
    const petalAlpha = 0.60 + (i % 3) * 0.22

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(rotation)

    // 五瓣樱花
    ctx.fillStyle = hexToRgba(color, petalAlpha * 0.80)
    ctx.strokeStyle = hexToRgba(color, petalAlpha * 0.92)
    ctx.lineWidth = 0.7 * scale
    ctx.beginPath()

    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2 - Math.PI / 2
      const tipX = Math.cos(angle) * petalSize
      const tipY = Math.sin(angle) * petalSize

      // 花瓣两侧控制点
      const spreadAngle = 0.38
      const cp1x = Math.cos(angle - spreadAngle) * petalSize * 0.45
      const cp1y = Math.sin(angle - spreadAngle) * petalSize * 0.45
      const cp2x = Math.cos(angle + spreadAngle) * petalSize * 0.45
      const cp2y = Math.sin(angle + spreadAngle) * petalSize * 0.45

      if (p === 0) {
        ctx.moveTo(0, petalSize * 0.18)
      }
      ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY)
      ctx.quadraticCurveTo(cp2x, cp2y, 0, petalSize * 0.18)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 花蕊小点
    ctx.fillStyle = hexToRgba(color, petalAlpha * 0.95)
    ctx.beginPath()
    ctx.arc(0, 0, petalSize * 0.14, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  ctx.restore()
}

// ── Coral branch ────────────────────────────────────────────────────────────

/**
 * 深海珊瑚枝装饰 — 有机分支结构 + 水螅体小点。
 * 用于 abyssal-coral 主题。
 */
export function drawCoralBranch(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'coralBranch') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.globalAlpha = alpha

  type Branch = { x: number; y: number; angle: number; length: number; depth: number }
  const branches: Branch[] = []

  // 从两个角生长的珊瑚枝
  const origins: Branch[] = [
    // 左下角
    { x: CONTENT_LEFT + 10, y: PAGE_HEIGHT - 30, angle: -0.8, length: 80 * scale, depth: 0 },
    { x: CONTENT_LEFT + 10, y: PAGE_HEIGHT - 30, angle: -0.35, length: 55 * scale, depth: 0 },
    // 右上角
    { x: CONTENT_RIGHT - 10, y: 30, angle: Math.PI + 0.8, length: 70 * scale, depth: 0 },
    { x: CONTENT_RIGHT - 10, y: 30, angle: Math.PI + 0.35, length: 48 * scale, depth: 0 },
  ]

  // 递归生成分支（用确定性"随机数"代替 Math.random）
  function pseudoRand(seed: number): number {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
  }

  function growBranchDeterministic(b: Branch, maxDepth: number, seedBase: number): void {
    if (b.depth >= maxDepth) return
    branches.push(b)

    const childCount = b.depth === 0 ? 3 : 2
    for (let i = 0; i < childCount; i++) {
      const spread = 0.4
      const childAngle = b.angle + (i - (childCount - 1) / 2) * spread
      const r = pseudoRand(seedBase + b.depth * 100 + i)
      const childLength = b.length * (0.5 + r * 0.25)
      const t = 0.35 + (i / childCount) * 0.55
      growBranchDeterministic(
        {
          x: b.x + Math.cos(b.angle) * b.length * t,
          y: b.y + Math.sin(b.angle) * b.length * t,
          angle: childAngle,
          length: childLength,
          depth: b.depth + 1,
        },
        maxDepth,
        seedBase + i * 13,
      )
    }
  }

  for (const origin of origins) {
    growBranchDeterministic(origin, 3, Math.round(origin.x * 100 + origin.y))
  }

  // 绘制珊瑚枝
  for (const b of branches) {
    const endX = b.x + Math.cos(b.angle) * b.length
    const endY = b.y + Math.sin(b.angle) * b.length

    ctx.strokeStyle = hexToRgba(color, 0.60 + b.depth * 0.10)
    ctx.lineWidth = (2.4 - b.depth * 0.35) * scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(b.x, b.y)

    // 微弯曲线
    const midX = (b.x + endX) / 2 + Math.cos(b.angle + 0.3) * b.length * 0.15
    const midY = (b.y + endY) / 2 + Math.sin(b.angle + 0.3) * b.length * 0.15
    ctx.quadraticCurveTo(midX, midY, endX, endY)
    ctx.stroke()

    // 末端水螅体小点
    ctx.fillStyle = hexToRgba(color, 0.78 + b.depth * 0.10)
    ctx.beginPath()
    ctx.arc(endX, endY, (2.5 - b.depth * 0.3) * scale, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ── Crystal facets ──────────────────────────────────────────────────────────

/**
 * 紫水晶晶簇装饰 — 角部聚集的三角形水晶切面。
 * 用于 amethyst-geode 主题。
 */
export function drawCrystalFacet(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'crystalFacet') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.globalAlpha = alpha

  // 左上角晶簇
  drawCrystalCluster(ctx, 8, 8, -0.25, 1.0, color, scale)
  // 右下角晶簇（镜像）
  drawCrystalCluster(ctx, PAGE_WIDTH - 8, PAGE_HEIGHT - 8, Math.PI - 0.25, 0.85, color, scale)

  ctx.restore()
}

/** 在指定原点绘制一组晶体切面。 */
function drawCrystalCluster(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  baseAngle: number,
  clusterAlpha: number,
  color: string,
  scale: number,
): void {
  const facets: { angle: number; length: number; width: number; a: number }[] = [
    { angle: baseAngle,           length: 64 * scale, width: 14 * scale, a: 0.55 },
    { angle: baseAngle + 0.22,    length: 48 * scale, width: 10 * scale, a: 0.42 },
    { angle: baseAngle - 0.18,    length: 55 * scale, width: 12 * scale, a: 0.48 },
    { angle: baseAngle + 0.5,     length: 38 * scale, width: 8 * scale,  a: 0.35 },
    { angle: baseAngle - 0.45,    length: 42 * scale, width: 9 * scale,  a: 0.38 },
    { angle: baseAngle + 0.15,    length: 72 * scale, width: 4 * scale,  a: 0.30 },
  ]

  for (const f of facets) {
    const tipX = ox + Math.cos(f.angle) * f.length
    const tipY = oy + Math.sin(f.angle) * f.length
    const perpAngle = f.angle + Math.PI / 2

    // 三角形切面：底边两个角 + 尖端
    const bx1 = ox + Math.cos(perpAngle) * f.width
    const by1 = oy + Math.sin(perpAngle) * f.width
    const bx2 = ox - Math.cos(perpAngle) * f.width
    const by2 = oy - Math.sin(perpAngle) * f.width

    // 填充
    ctx.fillStyle = hexToRgba(color, f.a * clusterAlpha)
    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(bx1, by1)
    ctx.lineTo(bx2, by2)
    ctx.closePath()
    ctx.fill()

    // 描边（晶体棱线）
    ctx.strokeStyle = hexToRgba(color, (f.a + 0.30) * clusterAlpha)
    ctx.lineWidth = 0.9 * scale
    ctx.stroke()

    // 内部高光线
    const hlX = ox + Math.cos(f.angle) * f.length * 0.55
    const hlY = oy + Math.sin(f.angle) * f.length * 0.55
    const hlPerp = Math.cos(perpAngle) * f.width * 0.3
    ctx.strokeStyle = hexToRgba('#ffffff', f.a * clusterAlpha * 0.32)
    ctx.lineWidth = 0.7 * scale
    ctx.beginPath()
    ctx.moveTo(hlX - hlPerp, hlY - Math.sin(perpAngle) * f.width * 0.3)
    ctx.lineTo(hlX + hlPerp, hlY + Math.sin(perpAngle) * f.width * 0.3)
    ctx.stroke()
  }
}

// ── Sketch hatch ────────────────────────────────────────────────────────────

/**
 * 素描排线装饰 — 艺术家炭笔交叉排线。
 * 用于 charcoal-sketch 主题。
 */
export function drawSketchHatch(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'sketchHatch') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = hexToRgba(color, 0.78)
  ctx.lineCap = 'round'

  // 右上角排线区域
  drawHatchGroup(ctx, PAGE_WIDTH - 120 * scale, 18 * scale, -0.7, 20, 48 * scale, 58 * scale, color, scale)

  // 左下角排线区域
  drawHatchGroup(ctx, CONTENT_LEFT + 10 * scale, PAGE_HEIGHT - 80 * scale, 0.55, 16, 42 * scale, 54 * scale, color, scale)

  ctx.restore()
}

/** 在指定原点绘制一组排线。 */
function drawHatchGroup(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angle: number,
  lineCount: number,
  maxLen: number,
  areaH: number,
  color: string,
  scale: number,
): void {
  // 第一方向排线
  for (let i = 0; i < lineCount; i++) {
    const t = i / (lineCount - 1)
    const sx = ox + Math.cos(angle + Math.PI / 2) * areaH * t
    const sy = oy + Math.sin(angle + Math.PI / 2) * areaH * t
    const len = maxLen * (0.5 + 0.5 * (1 - Math.abs(t - 0.5) * 2)) // 中间长，两端短

    ctx.lineWidth = (0.85 + (i % 3 === 0 ? 0.5 : 0)) * scale
    ctx.strokeStyle = hexToRgba(color, 0.55 + (i % 4) * 0.07)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len)
    ctx.stroke()
  }

  // 第二方向排线（交叉，更稀疏）
  const angle2 = angle + 0.9
  for (let i = 0; i < lineCount * 0.6; i++) {
    const t = i / (lineCount * 0.6 - 1)
    const sx = ox + Math.cos(angle + Math.PI / 2) * areaH * (t + 0.1)
    const sy = oy + Math.sin(angle + Math.PI / 2) * areaH * (t + 0.1)
    const len = maxLen * 0.55 * (0.6 + 0.4 * (1 - Math.abs(t - 0.5) * 2))

    ctx.lineWidth = 0.55 * scale
    ctx.strokeStyle = hexToRgba(color, 0.35 + (i % 5) * 0.05)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + Math.cos(angle2) * len, sy + Math.sin(angle2) * len)
    ctx.stroke()
  }
}

// ── Matcha rings ────────────────────────────────────────────────────────────

/**
 * 抹茶禅意装饰 — 同心涟漪圈 + 散落茶粉末。
 * 用于 matcha-zen 主题。
 */
export function drawMatchaRing(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
): void {
  const decor = theme.decor
  if (!decor || decor.kind !== 'matchaRing') return

  const alpha = decor.opacity
  const color = decor.color ?? theme.palette.accent
  const scale = decor.scale ?? 1

  ctx.save()
  ctx.globalAlpha = alpha

  // ── 右下角同心涟漪 ──────────────────────────────────────────────────
  const cx = PAGE_WIDTH - 100 * scale
  const cy = PAGE_HEIGHT - 90 * scale
  const ringCount = 6

  for (let i = 0; i < ringCount; i++) {
    const radius = (18 + i * 12) * scale
    const ringAlpha = 0.64 - i * 0.05

    // 不完全闭合的椭圆弧
    ctx.strokeStyle = hexToRgba(color, ringAlpha)
    ctx.lineWidth = (1.0 + (i === 0 ? 0.5 : 0)) * scale
    ctx.beginPath()
    // 椭圆 — 稍微压扁
    ctx.ellipse(cx, cy, radius, radius * 0.85, 0.15, 0.2, Math.PI * 1.75)
    ctx.stroke()

    // 每隔一圈画得更完整
    if (i % 2 === 0) {
      ctx.strokeStyle = hexToRgba(color, ringAlpha * 0.72)
      ctx.lineWidth = 0.60 * scale
      ctx.beginPath()
      ctx.ellipse(cx, cy, radius * 0.92, radius * 0.78, -0.1, Math.PI * 0.5, Math.PI * 2.1)
      ctx.stroke()
    }
  }

  // ── 散落茶粉末小点 ──────────────────────────────────────────────────
  const seed = 419
  const dotCount = 22
  for (let i = 0; i < dotCount; i++) {
    const dx = ((seed * (i + 1) * 31 + i * 17) % 160 - 40) * scale
    const dy = ((seed * (i + 1) * 43 + i * 23) % 140 - 30) * scale
    const dotSize = 0.7 + (i % 4) * 0.42 * scale

    const dotAlpha = 0.36 + (i % 6) * 0.08
    ctx.fillStyle = hexToRgba(color, dotAlpha)
    ctx.beginPath()
    ctx.arc(cx + dx, cy + dy, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── 左上角更淡的涟漪 ─────────────────────────────────────────────────
  const cx2 = CONTENT_LEFT + 55 * scale
  const cy2 = 48 * scale
  for (let i = 0; i < 3; i++) {
    const radius = (12 + i * 10) * scale
    ctx.strokeStyle = hexToRgba(color, 0.32 - i * 0.04)
    ctx.lineWidth = 0.7 * scale
    ctx.beginPath()
    ctx.ellipse(cx2, cy2, radius, radius * 0.82, -0.25, 0.3, Math.PI * 1.6)
    ctx.stroke()
  }

  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// 主装饰分发
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 为给定主题绘制所有装饰性点缀。
 * 在氛围效果之后、正文内容之前调用。
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
    case 'macosWindow':
      drawMacosWindow(ctx, theme)
      break
    case 'desertSun':
      drawDesertSun(ctx, theme)
      break
    case 'sakuraPetal':
      drawSakuraPetal(ctx, theme)
      break
    case 'coralBranch':
      drawCoralBranch(ctx, theme)
      break
    case 'crystalFacet':
      drawCrystalFacet(ctx, theme)
      break
    case 'sketchHatch':
      drawSketchHatch(ctx, theme)
      break
    case 'matchaRing':
      drawMatchaRing(ctx, theme)
      break
  }
}