/// <reference types="vite/client" />

import type { ElectronAPI } from './platforms/types'

/**
 * 平台类型扩展。
 *
 * window.electronAPI 在以下环境中可用：
 * - Electron（由 electron/preload.ts 通过 contextBridge 注入）
 * - Capacitor 移动端（由 src/platforms/mobile.ts 在启动时注入）
 * - 纯浏览器中为 undefined（现有代码通过 ?. 优雅降级）
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI
    /** Capacitor 原生运行时对象（仅在 Capacitor 平台可用）。 */
    Capacitor?: {
      isNativePlatform: () => boolean
      getPlatform: () => string
    }
  }
}

// ── 第三方模块声明 ──────────────────────────────
// prismjs 声明在项目根目录 env.d.ts 中

