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

// ─── 环境 ───────────────────────────────────────────────
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

// ─── 窗口边界持久化 ────────────────────────────────

const BOUNDS_PATH = path.join(app.getPath('userData'), 'window-bounds.json')

interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

function loadWindowBounds(): WindowBounds | null {
  try {
    if (fs.existsSync(BOUNDS_PATH)) {
      const raw = fs.readFileSync(BOUNDS_PATH, 'utf-8')
      return JSON.parse(raw) as WindowBounds
    }
  } catch {
    // 文件损坏 — 忽略并使用默认值
  }
  return null
}

function saveWindowBounds(): void {
  if (!win || win.isMaximized() || win.isMinimized()) return
  const bounds = win.getBounds()
  try {
    fs.writeFileSync(BOUNDS_PATH, JSON.stringify(bounds), 'utf-8')
  } catch {
    // 非关键 — 静默忽略写入失败
  }
}

// ─── 窗口 ────────────────────────────────────────────────────

/** 默认窗口尺寸 — 仅在首次启动时使用。 */
const DEFAULT_BOUNDS: WindowBounds = { x: 0, y: 0, width: 1400, height: 900 }

function createWindow(): void {
  const saved = loadWindowBounds()
  const bounds = saved ?? DEFAULT_BOUNDS

  win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 900,
    minHeight: 600,
    center: !saved,           // 仅在首次启动时居中
    title: 'Markdown Card',
    icon: ICON_PATH,
    frame: false,             // 无边框窗口 — 去掉系统标题栏
    useContentSize: true,     // width/height 代表渲染进程内容区域
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

  // 快捷键拦截（无边框窗口没有原生菜单）
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return

    // Ctrl+F / Cmd+F → 转发给渲染进程的自定义搜索
    if ((input.control || input.meta) && input.key === 'f') {
      event.preventDefault()
      win?.webContents.send('window:search-open')
      return
    }

    // F12 → 切换 DevTools
    if (input.key === 'F12') {
      win?.webContents.toggleDevTools()
    }
  })

  // ── 窗口状态变化 → 通知渲染进程 ─────────────────────
  win.on('maximize', () => {
    win?.webContents.send('window:state-changed', { isMaximized: true })
  })
  win.on('unmaximize', () => {
    win?.webContents.send('window:state-changed', { isMaximized: false })
  })

  // ── 移动/调整大小时保存边界（防抖） ──────────────────
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const debouncedSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveWindowBounds, 300)
  }
  win.on('resize', debouncedSave)
  win.on('move', debouncedSave)

  // ── 关闭拦截，用于未保存更改提示 ─────────────
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

// ─── 平台 ──────────────────────────────────────────────────
const isMac = process.platform === 'darwin'

// ─── 移除原生菜单栏 ────────────────────────────────────
Menu.setApplicationMenu(null)

// ─── 系统托盘 ───────────────────────────────────────────────
function createTray(): void {
  try {
    // 回退：如果图标文件不存在，创建一个简单的 16×16 托盘图标
    const trayIcon = fs.existsSync(ICON_PATH)
      ? ICON_PATH
      : undefined

    if (!trayIcon) return // 如果没有图标，跳过托盘

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
    // 托盘创建在某些 Linux 桌面环境上可能失败 — 非关键
  }
}

// ─── 全局快捷键 ──────────────────────────────────────────
function registerGlobalShortcuts(): void {
  // Ctrl+Shift+M — 将窗口置顶
  globalShortcut.register('CmdOrCtrl+Shift+M', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
}

// ─── IPC: 窗口控制 ────────────────────────────────────────

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

// ─── IPC: 保存图片到磁盘 ───────────────────────────────────
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

// ─── IPC: 批量保存图片到文件夹 ────────────────────────
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

// ─── IPC: 打开 Markdown 文件 ───────────────────────────────────
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

// ─── IPC: 保存 Markdown 文件 ───────────────────────────────────
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

// ─── 应用生命周期 ─────────────────────────────────────────────
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
