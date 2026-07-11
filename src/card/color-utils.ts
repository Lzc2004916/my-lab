// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 颜色工具函数
// ═══════════════════════════════════════════════════════════════════════════

/** 将十六进制颜色字符串转换为指定透明度的 rgba() 字符串。 */
export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return `rgba(36,52,70,${alpha})`
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 将十六进制颜色字符串转换为 [r, g, b] 元组。 */
export function hexToRgb(hex: string): readonly [number, number, number] {
  const value = hex.replace('#', '')
  if (value.length !== 6) return [36, 52, 70]
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

/** 在两个十六进制颜色之间按比例（0–1）线性插值。 */
export function mixHexColors(fromHex: string, toHex: string, ratio: number): string {
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

/**
 * 将 CSS 渐变角度（0deg = 底部→顶部）转换为
 * 尺寸为 w x h 的矩形的 canvas linearGradient 端点。
 *
 * 返回适用于 ctx.createLinearGradient() 的 { x0, y0, x1, y1 }。
 */
export function gradientAngleToPoints(
  angleDeg: number,
  w: number,
  h: number,
): { x0: number; y0: number; x1: number; y1: number } {
  // CSS 渐变角度：0deg = 下→上，90deg = 左→右
// 转换为弧度：减去 90°，使 0deg 映射为 Canvas 上指向"上"
  const rad = (angleDeg - 90) * (Math.PI / 180)
  const cx = w / 2
  const cy = h / 2
  const halfDiag = Math.sqrt(w * w + h * h) / 2
  return {
    x0: cx - Math.cos(rad) * halfDiag,
    y0: cy - Math.sin(rad) * halfDiag,
    x1: cx + Math.cos(rad) * halfDiag,
    y1: cy + Math.sin(rad) * halfDiag,
  }
}