/**
 * 平台初始化入口点。
 *
 * 应在 Vue 应用挂载前调用（src/main.ts 的最顶部）。
 * 当运行在 Capacitor 原生平台时，注入移动端 API 桥接层；
 * Electron / 浏览器环境无需额外操作。
 */

import { detectPlatform } from './detection'

export async function initPlatform(): Promise<void> {
  const platform = detectPlatform()

  if (platform === 'ios' || platform === 'android') {
    // 动态导入移动端桥接层，避免在 Electron/浏览器环境中加载 Capacitor 依赖
    const { createMobileAPI } = await import('./mobile')
    ;(window as unknown as Record<string, unknown>).electronAPI = createMobileAPI()
  }
  // Electron: window.electronAPI 已由 preload.ts 注入 — 无需操作
  // Web: window.electronAPI 为 undefined — 现有代码的 ?. 优雅降级会自动生效
}
