/**
 * 运行时平台检测 — 无需构建时标志。
 *
 * 支持四种运行环境：
 * - `electron`  — Electron 桌面应用（window.electronAPI 由 preload.ts 注入）
 * - `ios`       — Capacitor iOS（window.Capacitor 由原生运行时注入）
 * - `android`   — Capacitor Android
 * - `web`       — 纯浏览器（无原生运行时）
 */

export type Platform = 'electron' | 'ios' | 'android' | 'web'

/**
 * 检测当前运行时平台。
 * Capacitor 原生平台会在 window 上注入 Capacitor 对象；
 * Electron 通过 preload.ts 注入 electronAPI；
 * 如果两者都没有，则为纯浏览器环境。
 */
export function detectPlatform(): Platform {
  const win = window as unknown as Record<string, unknown>

  // Capacitor 原生平台检测
  if (win.Capacitor && typeof win.Capacitor === 'object') {
    const cap = win.Capacitor as { isNativePlatform?: () => boolean; getPlatform?: () => string }
    if (cap.isNativePlatform?.()) {
      const p = cap.getPlatform?.()
      if (p === 'ios' || p === 'android') return p
    }
  }

  // Electron — preload.ts 已注入 electronAPI
  if (win.electronAPI) {
    return 'electron'
  }

  return 'web'
}

/** 当前是否为桌面 Electron 环境。 */
export function isDesktop(): boolean {
  return detectPlatform() === 'electron'
}

/** 当前是否为移动端原生环境（iOS / Android）。 */
export function isMobile(): boolean {
  const p = detectPlatform()
  return p === 'ios' || p === 'android'
}

/** 当前平台标识符。 */
export const platform = detectPlatform()
