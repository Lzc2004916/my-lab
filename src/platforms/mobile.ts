/**
 * Capacitor 移动端 API 桥接层。
 *
 * 实现与 electron/preload.ts 相同的 ElectronAPI 接口，
 * 使用 Capacitor 插件替代 Electron IPC。
 *
 * 注入为 window.electronAPI，使现有代码（useExport.ts、App.vue）
 * 无需修改即可在移动端运行。
 */

import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { ElectronAPI, SaveImageResult } from './types'

// ── 工具函数 ──────────────────────────────────────────────────────────

/** 返回一个空操作取消订阅函数，供事件监听器方法使用。 */
function noopUnsubscribe(): () => void {
  return () => {}
}

/**
 * 从 dataURL 中提取 base64 数据。
 * @param dataUrl - 格式为 `data:image/<fmt>;base64,<data>` 的字符串
 */
function base64FromDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '')
}

// ── API 工厂 ──────────────────────────────────────────────────────────

/**
 * 创建移动端 ElectronAPI 兼容对象。
 *
 * 文件操作使用 Capacitor Filesystem + Share 插件：
 * - 图片/文件保存 → 写入临时目录 → 触发 iOS 分享菜单
 * - 文件打开 → 使用 HTML file input（WKWebView 原生支持）
 *
 * 窗口控制方法在移动端为无操作（no-op）：
 * - 移动端始终全屏，无最小化/最大化/关闭
 * - 通过系统手势切换应用
 */
export function createMobileAPI(): ElectronAPI {
  return {
    // ── 图片导出 ────────────────────────────────────────────

    saveImage: async (dataUrl: string, defaultName: string): Promise<SaveImageResult> => {
      try {
        const base64 = base64FromDataUrl(dataUrl)
        const result = await Filesystem.writeFile({
          path: defaultName,
          data: base64,
          directory: Directory.Cache,
          recursive: true,
        })

        // 触发原生分享菜单（用户可保存到相册/文件/其他应用）
        await Share.share({
          title: '保存图片',
          files: [result.uri],
        })

        return { success: true, path: result.uri }
      } catch (error) {
        // 用户取消分享不算错误
        if (error instanceof Error && error.message.includes('canceled')) {
          return { success: false }
        }
        console.error('Failed to save image:', error)
        return { success: false }
      }
    },

    saveImagesToFolder: async (
      images: { dataUrl: string; filename: string }[],
    ): Promise<{ success: boolean; folder?: string; count?: number }> => {
      try {
        // 将所有图片写入缓存目录
        const uris: string[] = []
        for (const img of images) {
          const base64 = base64FromDataUrl(img.dataUrl)
          const result = await Filesystem.writeFile({
            path: img.filename,
            data: base64,
            directory: Directory.Cache,
            recursive: true,
          })
          uris.push(result.uri)
        }

        // 分享第一张图片（用户可保存全部到文件）
        if (uris.length > 0) {
          await Share.share({
            title: `保存 ${images.length} 张图片`,
            files: [uris[0]!],
          })
        }

        return { success: true, count: images.length }
      } catch (error) {
        if (error instanceof Error && error.message.includes('canceled')) {
          return { success: false }
        }
        console.error('Failed to batch save images:', error)
        return { success: false }
      }
    },

    // ── 文件 I/O ────────────────────────────────────────────

    openMarkdown: async () => {
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.md,.markdown,text/markdown'
        input.style.display = 'none'

        const cleanup = (): void => {
          input.remove()
          // 移除超时
          if (timeoutId) clearTimeout(timeoutId)
        }

        // 超时保护：120 秒后自动取消
        const timeoutId = setTimeout(() => {
          cleanup()
          resolve(null)
        }, 120_000)

        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) {
            cleanup()
            resolve(null)
            return
          }

          try {
            const content = await file.text()
            cleanup()
            resolve({ path: file.name, content })
          } catch {
            cleanup()
            resolve(null)
          }
        }

        // 用户取消选择时触发（某些浏览器可能不触发）
        input.oncancel = () => {
          cleanup()
          resolve(null)
        }

        // iOS Safari 需要在事件循环的下一个 tick 中触发 click
        document.body.appendChild(input)
        setTimeout(() => input.click(), 0)
      })
    },

    saveMarkdown: async (
      content: string,
      defaultName: string,
    ): Promise<boolean> => {
      try {
        const result = await Filesystem.writeFile({
          path: defaultName,
          data: content,
          directory: Directory.Documents,
          recursive: true,
        })

        await Share.share({
          title: '保存 Markdown',
          text: content,
          files: [result.uri],
        })

        return true
      } catch (error) {
        if (error instanceof Error && error.message.includes('canceled')) {
          return false
        }
        console.error('Failed to save markdown:', error)
        return false
      }
    },

    // ── 菜单事件（移动端无原生菜单 — 全部 no-op）───────

    onMenuAction: (_channel: string, _callback: (...args: unknown[]) => void) => {
      return noopUnsubscribe()
    },

    onFileOpened: (_callback: (payload: { path: string; content: string }) => void) => {
      return noopUnsubscribe()
    },

    // ── 窗口控制（移动端全屏 — 全部 no-op）─────────────

    minimizeWindow: async () => {},
    toggleMaximize: async () => {},
    getWindowState: async () => ({ isMaximized: false }),
    confirmClose: async () => {},

    onWindowStateChanged: (
      _callback: (state: { isMaximized: boolean }) => void,
    ) => {
      return noopUnsubscribe()
    },

    onCloseRequest: (_callback: () => void) => {
      return noopUnsubscribe()
    },

    // ── 搜索快捷键 ─────────────────────────────────────

    onSearchOpen: (_callback: () => void) => {
      // 移动端通过 UI 按钮触发搜索，不需要主进程快捷键转发
      return noopUnsubscribe()
    },
  }
}
