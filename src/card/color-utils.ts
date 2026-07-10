// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — color utility functions
// ═══════════════════════════════════════════════════════════════════════════

/** Convert a hex color string to an rgba() string with the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return `rgba(36,52,70,${alpha})`
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Convert a hex color string to an [r, g, b] tuple. */
export function hexToRgb(hex: string): readonly [number, number, number] {
  const value = hex.replace('#', '')
  if (value.length !== 6) return [36, 52, 70]
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

/** Linear-interpolate between two hex colors by ratio (0–1). */
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
 * Convert a CSS gradient angle (0deg = bottom→top) to canvas
 * linearGradient endpoints for a rectangle of size w x h.
 *
 * Returns { x0, y0, x1, y1 } suitable for ctx.createLinearGradient().
 */
export function gradientAngleToPoints(
  angleDeg: number,
  w: number,
  h: number,
): { x0: number; y0: number; x1: number; y1: number } {
  // CSS gradient angle: 0deg = bottom→top, 90deg = left→right
  // Convert to radians: subtract 90° so 0deg maps to pointing "up" on canvas
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
