/// <reference types="vite/client" />

/**
 * `saveImage` IPC 调用返回的结果。
 */
interface SaveImageResult {
  success: boolean
  /**
   * 保存文件的绝对路径。仅在 success 为 true 时存在。
   */
  path?: string
}

/**
 * `openMarkdown` IPC 调用返回的结果。
 */
interface OpenMarkdownResult {
  /** 打开文件的绝对路径。 */
  path: string
  /** 文件的 UTF-8 文本内容。 */
  content: string
}

/**
 * 通过 `window.electronAPI` 暴露给渲染进程的公共 API。
 *
 * 所有系统交互都必须通过这些方法 — 渲染进程
 * 无法直接访问 Node.js 或 Electron 内部 API。
 */
interface ElectronAPI {
  /**
   * 打开原生保存对话框并将 PNG 图片持久化到本地文件系统。
   */
  saveImage: (dataUrl: string, defaultName: string) => Promise<SaveImageResult>

  /**
   * 打开文件夹选择器，将多张图片批量保存到所选目录中。
   */
  saveImagesToFolder: (images: { dataUrl: string; filename: string }[]) => Promise<{ success: boolean; folder?: string; count?: number }>

  /**
   * 打开原生文件选择器，过滤 `.md` / `.markdown` 文件，返回所选文件的路径和内容。
   */
  openMarkdown: () => Promise<OpenMarkdownResult | null>

  /**
   * 将 Markdown 内容保存到用户选择的文件。
   */
  saveMarkdown: (content: string, defaultName: string) => Promise<boolean>

  /**
   * 注册菜单 → 渲染进程通知的回调。
   * 支持的通道：'menu:new-doc', 'menu:open-file', 'menu:save-file', 'menu:export-png'
   * 返回取消订阅函数。
   */
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void) => () => void

  /**
   * 监听菜单"打开"操作的结果。
   */
  onFileOpened: (callback: (payload: { path: string; content: string }) => void) => () => void

  // ── 窗口控制（无边框标题栏） ──────────────────────

  /** 将窗口最小化到任务栏。 */
  minimizeWindow: () => Promise<void>

  /** 在最大化和还原窗口状态之间切换。 */
  toggleMaximize: () => Promise<void>

  /** 查询当前窗口最大化状态。 */
  getWindowState: () => Promise<{ isMaximized: boolean }>

  /** 在用户确认未保存更改对话框后确认关闭。 */
  confirmClose: () => Promise<void>

  /**
   * 监听窗口状态变化（最大化/还原）。
   * 返回取消订阅函数。
   */
  onWindowStateChanged: (callback: (state: { isMaximized: boolean }) => void) => () => void

  /**
   * 监听来自主进程的关闭请求事件（例如 Alt+F4 或无边框窗口上的系统级关闭）。
   * 返回取消订阅函数。
   */
  onCloseRequest: (callback: () => void) => () => void

  /**
   * 监听来自主进程的 Ctrl+F 搜索快捷键事件。
   * 返回取消订阅函数。
   */
  onSearchOpen: (callback: () => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}

// ── 第三方模块声明（没有 @types 的包） ──────────

declare module 'prismjs' {
  const Prism: {
    languages: Record<string, unknown>
    tokenize: (code: string, grammar: unknown) => Array<{
      type: string
      content: string | Array<{ type: string; content: unknown }>
    }>
    highlight: (code: string, grammar: unknown, lang: string) => string
  }
  export default Prism
}
