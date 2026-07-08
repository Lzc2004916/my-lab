import { contextBridge, ipcRenderer } from 'electron'

// ── Types ────────────────────────────────────────────────────────

interface SaveImageResult {
  success: boolean
  path?: string
}

interface OpenMarkdownResult {
  path: string
  content: string
}

/**
 * Event payload for a file opened via the menu or dialog.
 */
interface FileOpenedPayload {
  path: string
  content: string
}

/**
 * Expose protected APIs to the renderer process via contextBridge.
 *
 * Only the methods defined here are accessible from `window.electronAPI`.
 * The renderer CANNOT access ipcRenderer, fs, path, or any Node.js API directly.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Image export ────────────────────────────────────────────
  /**
   * Open a native Save dialog and write an image to disk.
   * @param dataUrl     - Base64 DataURL of the image.
   * @param defaultName - Suggested filename.
   */
  saveImage: (dataUrl: string, defaultName: string): Promise<SaveImageResult> => {
    return ipcRenderer.invoke('export:save-image', { dataUrl, defaultName })
  },

  /**
   * Open a native folder picker and batch-save multiple images with
   * sequential filenames into the chosen directory.
   * @param images - Array of { dataUrl, filename } objects.
   * @returns Success status, target folder path, and file count.
   */
  saveImagesToFolder: (
    images: { dataUrl: string; filename: string }[],
  ): Promise<{ success: boolean; folder?: string; count?: number }> => {
    return ipcRenderer.invoke('export:batch-save-images', { images })
  },

  // ── File I/O ────────────────────────────────────────────────
  /**
   * Open a native file picker filtered to .md / .markdown files.
   * @returns The file path and its UTF-8 content, or null if cancelled.
   */
  openMarkdown: (): Promise<OpenMarkdownResult | null> => {
    return ipcRenderer.invoke('file:open')
  },

  /**
   * Save Markdown content to a user-chosen file.
   * @param content     - Markdown text to write.
   * @param defaultName - Suggested filename.
   * @returns true if saved successfully, false otherwise.
   */
  saveMarkdown: (content: string, defaultName: string): Promise<boolean> => {
    return ipcRenderer.invoke('file:save', { content, defaultName })
  },

  // ── Menu event listeners ────────────────────────────────────
  /**
   * Register a callback for menu → renderer notifications.
   *
   * Supported channels:
   *  - `menu:new-doc`    — Ctrl+N
   *  - `menu:open-file`  — Ctrl+O (returns `{ path, content }` via callback)
   *  - `menu:save-file`  — Ctrl+S
   *  - `menu:export-png` — Ctrl+Shift+E
   */
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown): void =>
      callback(payload)
    ipcRenderer.on(channel, handler)
    // Return an unsubscribe function
    return () => ipcRenderer.removeListener(channel, handler)
  },

  // ── Window controls ────────────────────────────────────────
  /**
   * Minimize the window to the taskbar.
   */
  minimizeWindow: (): Promise<void> => {
    return ipcRenderer.invoke('window:minimize')
  },

  /**
   * Toggle between maximized and restored window state.
   */
  toggleMaximize: (): Promise<void> => {
    return ipcRenderer.invoke('window:toggle-maximize')
  },

  /**
   * Query the current window state (maximized, etc.).
   */
  getWindowState: (): Promise<{ isMaximized: boolean }> => {
    return ipcRenderer.invoke('window:get-state')
  },

  /**
   * Confirm close after user acknowledges the unsaved-changes dialog.
   */
  confirmClose: (): Promise<void> => {
    return ipcRenderer.invoke('window:confirm-close')
  },

  /**
   * Listen for window state changes (maximize / restore).
   * Returns an unsubscribe function.
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
   * Listen for close-request events from the main process
   * (e.g. Alt+F4 on a frameless window).
   * Returns an unsubscribe function.
   */
  onCloseRequest: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('window:close-request', handler)
    return () => ipcRenderer.removeListener('window:close-request', handler)
  },

  // ── File open callback ──────────────────────────────────────
  /**
   * Listen for the menu "Open" action. The callback receives
   * `{ path, content }` when the user selects a file.
   */
  onFileOpened: (callback: (payload: FileOpenedPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: FileOpenedPayload): void =>
      callback(payload)
    ipcRenderer.on('file:opened', handler)
    return () => ipcRenderer.removeListener('file:opened', handler)
  },
})
