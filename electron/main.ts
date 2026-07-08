import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  Menu,
  Tray,
  globalShortcut,
} from 'electron'
import path from 'node:path'
import fs from 'node:fs'

// ─── Environment ───────────────────────────────────────────────
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const PRELOAD_PATH = path.join(__dirname, 'preload.js')
const ICON_PATH = path.join(process.env.VITE_PUBLIC!, 'icon.png')

let win: BrowserWindow | null = null
let tray: Tray | null = null
let forceClose = false

// ─── Window ────────────────────────────────────────────────────
function createWindow(): void {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    center: true,
    title: 'Markdown Card',
    icon: ICON_PATH,
    frame: false,            // 无边框窗口 — 去掉系统标题栏
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // F12 toggles DevTools (frameless window has no native menu)
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win?.webContents.toggleDevTools()
    }
  })

  // ── Window state change → notify renderer ─────────────────────
  win.on('maximize', () => {
    win?.webContents.send('window:state-changed', { isMaximized: true })
  })
  win.on('unmaximize', () => {
    win?.webContents.send('window:state-changed', { isMaximized: false })
  })

  // ── Close interception for unsaved-changes prompt ─────────────
  win.on('close', (e: Electron.Event) => {
    if (!forceClose) {
      e.preventDefault()
      win?.webContents.send('window:close-request')
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

// ─── Platform ──────────────────────────────────────────────────
const isMac = process.platform === 'darwin'

// ─── Remove native menu bar ────────────────────────────────────
Menu.setApplicationMenu(null)

// ─── System Tray ───────────────────────────────────────────────
function createTray(): void {
  try {
    // Fallback: create a simple 16×16 tray icon if no icon file exists
    const trayIcon = fs.existsSync(ICON_PATH)
      ? ICON_PATH
      : undefined

    if (!trayIcon) return // skip tray if no icon

    tray = new Tray(trayIcon)
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Window', click: () => win?.show() },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        },
      },
    ])
    tray.setToolTip('Markdown Card')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => win?.show())
  } catch {
    // Tray creation may fail on some Linux DEs — non-critical
  }
}

// ─── Global Shortcuts ──────────────────────────────────────────
function registerGlobalShortcuts(): void {
  // Ctrl+Shift+M — bring window to front
  globalShortcut.register('CmdOrCtrl+Shift+M', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
}

// ─── IPC: Window controls ────────────────────────────────────────

ipcMain.handle('window:minimize', () => {
  win?.minimize()
})

ipcMain.handle('window:toggle-maximize', () => {
  if (!win) return
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.handle('window:get-state', () => ({
  isMaximized: win?.isMaximized() ?? false,
}))

ipcMain.handle('window:confirm-close', () => {
  forceClose = true
  win?.close()
})

// ─── IPC: Save image to disk ───────────────────────────────────
ipcMain.handle(
  'export:save-image',
  async (
    _event,
    args: { dataUrl: string; defaultName: string },
  ): Promise<{ success: boolean; path?: string }> => {
    const { dataUrl, defaultName } = args

    const result = await dialog.showSaveDialog(win!, {
      title: 'Save Image',
      defaultPath: defaultName,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false }
    }

    try {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64, 'base64')
      fs.writeFileSync(result.filePath, buffer)
      return { success: true, path: result.filePath }
    } catch (error) {
      console.error('Failed to save image:', error)
      return { success: false }
    }
  },
)

// ─── IPC: Batch save images to a folder ────────────────────────
ipcMain.handle(
  'export:batch-save-images',
  async (
    _event,
    args: { images: { dataUrl: string; filename: string }[] },
  ): Promise<{ success: boolean; folder?: string; count?: number }> => {
    const { images } = args

    const result = await dialog.showOpenDialog(win!, {
      title: 'Select Export Folder',
      properties: ['openDirectory', 'createDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false }
    }

    const folder = result.filePaths[0]!

    try {
      for (const img of images) {
        const base64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64, 'base64')
        const filePath = path.join(folder, img.filename)
        fs.writeFileSync(filePath, buffer)
      }
      return { success: true, folder, count: images.length }
    } catch (error) {
      console.error('Failed to batch save images:', error)
      return { success: false }
    }
  },
)

// ─── IPC: Open markdown file ───────────────────────────────────
ipcMain.handle('file:open', async (): Promise<{
  path: string
  content: string
} | null> => {
  const result = await dialog.showOpenDialog(win!, {
    title: 'Open Markdown File',
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    properties: ['openFile'],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { path: filePath, content }
  } catch (error) {
    console.error('Failed to read markdown file:', error)
    return null
  }
})

// ─── IPC: Save markdown file ───────────────────────────────────
ipcMain.handle(
  'file:save',
  async (_event, args: { content: string; defaultName: string }): Promise<boolean> => {
    const result = await dialog.showSaveDialog(win!, {
      title: 'Save Markdown File',
      defaultPath: args.defaultName,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    })

    if (result.canceled || !result.filePath) return false

    try {
      fs.writeFileSync(result.filePath, args.content, 'utf-8')
      return true
    } catch (error) {
      console.error('Failed to save markdown:', error)
      return false
    }
  },
)

// ─── App lifecycle ─────────────────────────────────────────────
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerGlobalShortcuts()
})
