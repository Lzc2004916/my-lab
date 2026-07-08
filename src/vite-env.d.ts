/// <reference types="vite/client" />

/**
 * Result returned by the `saveImage` IPC call.
 */
interface SaveImageResult {
  success: boolean
  /**
   * Absolute path to the saved file. Only present when `success` is true.
   */
  path?: string
}

/**
 * Result returned by the `openMarkdown` IPC call.
 */
interface OpenMarkdownResult {
  /** Absolute path to the opened file. */
  path: string
  /** UTF-8 text content of the file. */
  content: string
}

/**
 * Public API exposed to the renderer process via `window.electronAPI`.
 *
 * All system interactions must go through these methods — the renderer
 * has no direct access to Node.js or Electron internals.
 */
interface ElectronAPI {
  /**
   * Open a native Save dialog and persist a PNG image to the local filesystem.
   */
  saveImage: (dataUrl: string, defaultName: string) => Promise<SaveImageResult>

  /**
   * Open a folder picker and batch-save multiple images into the chosen directory
   * with their specified filenames.
   */
  saveImagesToFolder: (images: { dataUrl: string; filename: string }[]) => Promise<{ success: boolean; folder?: string; count?: number }>

  /**
   * Open a native file picker filtered to `.md` / `.markdown` and return the
   * selected file's path and content.
   */
  openMarkdown: () => Promise<OpenMarkdownResult | null>

  /**
   * Save Markdown content to a user-chosen file.
   */
  saveMarkdown: (content: string, defaultName: string) => Promise<boolean>

  /**
   * Register a callback for menu → renderer notifications.
   * Supported channels: 'menu:new-doc', 'menu:open-file', 'menu:save-file', 'menu:export-png'
   * Returns an unsubscribe function.
   */
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void) => () => void

  /**
   * Listen for the menu "Open" action result.
   */
  onFileOpened: (callback: (payload: { path: string; content: string }) => void) => () => void

  // ── Window controls (frameless title bar) ──────────────────────

  /** Minimize the window to the taskbar. */
  minimizeWindow: () => Promise<void>

  /** Toggle between maximized and restored window state. */
  toggleMaximize: () => Promise<void>

  /** Query the current window maximize state. */
  getWindowState: () => Promise<{ isMaximized: boolean }>

  /** Confirm close after user acknowledges the unsaved-changes dialog. */
  confirmClose: () => Promise<void>

  /**
   * Listen for window state changes (maximize / restore).
   * Returns an unsubscribe function.
   */
  onWindowStateChanged: (callback: (state: { isMaximized: boolean }) => void) => () => void

  /**
   * Listen for close-request events from the main process
   * (e.g. Alt+F4 or OS-level close on a frameless window).
   * Returns an unsubscribe function.
   */
  onCloseRequest: (callback: () => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}

// ── Third-party module declarations (packages without @types) ──────────

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

declare module 'mermaid' {
  interface MermaidAPI {
    initialize: (config: Record<string, unknown>) => void
    render: (id: string, code: string) => Promise<{ svg: string }>
    run: (options?: Record<string, unknown>) => Promise<void>
  }
  const mermaid: MermaidAPI
  export default mermaid
}
