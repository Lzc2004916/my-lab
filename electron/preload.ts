import { contextBridge, ipcRenderer } from 'electron'

// ── 类型 ────────────────────────────────────────────────────────

interface SaveImageResult {
  success: boolean
  path?: string
}

interface OpenMarkdownResult {
  path: string
  content: string
}

/**
 * 通过菜单或对话框打开文件的事件载荷。
 */
interface FileOpenedPayload {
  path: string
  content: string
}

/**
 * 通过 contextBridge 向渲染进程暴露受保护的 API。
 *
 * 只有此处定义的方法可以在 `window.electronAPI` 中访问。
 * 渲染进程无法直接访问 ipcRenderer、fs、path 或任何 Node.js API。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── 图片导出 ────────────────────────────────────────────
  /**
   * 打开原生保存对话框并将图片写入磁盘。
   * @param dataUrl     - 图片的 Base64 DataURL。
   * @param defaultName - 建议的文件名。
   */
  saveImage: (dataUrl: string, defaultName: string): Promise<SaveImageResult> => {
    return ipcRenderer.invoke('export:save-image', { dataUrl, defaultName })
  },

  /**
   * 打开原生文件夹选择器，将多张图片批量保存到所选目录中。
   * @param images - { dataUrl, filename } 对象数组。
   * @returns 成功状态、目标文件夹路径和文件数量。
   */
  saveImagesToFolder: (
    images: { dataUrl: string; filename: string }[],
  ): Promise<{ success: boolean; folder?: string; count?: number }> => {
    return ipcRenderer.invoke('export:batch-save-images', { images })
  },

  // ── 文件 I/O ────────────────────────────────────────────────
  /**
   * 打开原生文件选择器，过滤 .md / .markdown 文件。
   * @returns 文件路径和 UTF-8 内容，如果取消则返回 null。
   */
  openMarkdown: (): Promise<OpenMarkdownResult | null> => {
    return ipcRenderer.invoke('file:open')
  },

  /**
   * 将 Markdown 内容保存到用户选择的文件。
   * @param content     - 要写入的 Markdown 文本。
   * @param defaultName - 建议的文件名。
   * @returns 保存成功返回 true，否则返回 false。
   */
  saveMarkdown: (content: string, defaultName: string): Promise<boolean> => {
    return ipcRenderer.invoke('file:save', { content, defaultName })
  },

  // ── 菜单事件监听器 ────────────────────────────────────
  /**
   * 注册菜单 → 渲染进程通知的回调。
   *
   * 支持的通道：
   *  - `menu:new-doc`    — Ctrl+N
   *  - `menu:open-file`  — Ctrl+O（通过回调返回 `{ path, content }`）
   *  - `menu:save-file`  — Ctrl+S
   *  - `menu:export-png` — Ctrl+Shift+E
   */
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown): void =>
      callback(payload)
    ipcRenderer.on(channel, handler)
    // 返回取消订阅函数
    return () => ipcRenderer.removeListener(channel, handler)
  },

  // ── 窗口控制 ────────────────────────────────────────
  /**
   * 将窗口最小化到任务栏。
   */
  minimizeWindow: (): Promise<void> => {
    return ipcRenderer.invoke('window:minimize')
  },

  /**
   * 在最大化和还原窗口状态之间切换。
   */
  toggleMaximize: (): Promise<void> => {
    return ipcRenderer.invoke('window:toggle-maximize')
  },

  /**
   * 查询当前窗口状态（是否最大化等）。
   */
  getWindowState: (): Promise<{ isMaximized: boolean }> => {
    return ipcRenderer.invoke('window:get-state')
  },

  /**
   * 在用户确认未保存更改对话框后确认关闭。
   */
  confirmClose: (): Promise<void> => {
    return ipcRenderer.invoke('window:confirm-close')
  },

  /**
   * 监听窗口状态变化（最大化/还原）。
   * 返回取消订阅函数。
   */
  onWindowStateChanged: (
    callback: (state: { isMaximized: boolean }) => void,
  ): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: { isMaximized: boolean }): void =>
      callback(state)
    ipcRenderer.on('window:state-changed', handler)
    return () => ipcRenderer.removeListener('window:state-changed', handler)
  },

  /**
   * 监听来自主进程的关闭请求事件（例如无边框窗口上的 Alt+F4）。
   * 返回取消订阅函数。
   */
  onCloseRequest: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('window:close-request', handler)
    return () => ipcRenderer.removeListener('window:close-request', handler)
  },

  // ── 文件打开回调 ──────────────────────────────────────
  /**
   * 监听菜单"打开"操作。当用户选择文件时，回调会收到 `{ path, content }`。
   */
  onFileOpened: (callback: (payload: FileOpenedPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: FileOpenedPayload): void =>
      callback(payload)
    ipcRenderer.on('file:opened', handler)
    return () => ipcRenderer.removeListener('file:opened', handler)
  },
})