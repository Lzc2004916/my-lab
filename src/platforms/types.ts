/**
 * 跨平台类型定义。
 *
 * ElectronAPI 接口是 preload.ts（Electron）和 mobile.ts（Capacitor）
 * 之间的契约 — 两个平台都实现相同的方法签名。
 */

export interface SaveImageResult {
  success: boolean
  /** 保存文件的绝对路径。仅在 success 为 true 时存在。 */
  path?: string
}

export interface OpenMarkdownResult {
  /** 打开文件的路径或名称。 */
  path: string
  /** 文件的 UTF-8 文本内容。 */
  content: string
}

/**
 * 通过 `window.electronAPI` 暴露给渲染进程的公共 API。
 *
 * 所有系统交互都必须通过这些方法 — 渲染进程
 * 无法直接访问 Node.js 或 Capacitor 内部 API。
 */
export interface ElectronAPI {
  /** 打开原生保存对话框并将 PNG 图片持久化到本地文件系统。 */
  saveImage: (dataUrl: string, defaultName: string) => Promise<SaveImageResult>

  /** 打开文件夹选择器，将多张图片批量保存到所选目录中。 */
  saveImagesToFolder: (
    images: { dataUrl: string; filename: string }[],
  ) => Promise<{ success: boolean; folder?: string; count?: number }>

  /** 打开原生文件选择器，过滤 .md / .markdown 文件。 */
  openMarkdown: () => Promise<OpenMarkdownResult | null>

  /** 将 Markdown 内容保存到用户选择的文件。 */
  saveMarkdown: (content: string, defaultName: string) => Promise<boolean>

  /** 注册菜单 → 渲染进程通知的回调。返回取消订阅函数。 */
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void) => () => void

  /** 监听菜单"打开"操作的结果。返回取消订阅函数。 */
  onFileOpened: (callback: (payload: { path: string; content: string }) => void) => () => void

  // ── 窗口控制 ──────────────────────────────────────

  minimizeWindow: () => Promise<void>
  toggleMaximize: () => Promise<void>
  getWindowState: () => Promise<{ isMaximized: boolean }>
  confirmClose: () => Promise<void>

  onWindowStateChanged: (callback: (state: { isMaximized: boolean }) => void) => () => void
  onCloseRequest: (callback: () => void) => () => void

  // ── 搜索 ──────────────────────────────────────────

  onSearchOpen: (callback: () => void) => () => void
}
