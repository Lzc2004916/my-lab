import { watch } from 'vue'
import { useDocumentsStore, type Document } from '@/stores/documents'

const STORAGE_KEY = 'md2card:drafts'

// ── Types ─────────────────────────────────────────────────────────────

/** 所有可在重启后保留的用户自定义 UI 设置。 */
export interface AppSettings {
  cardTheme: string
  bodyFontMode: string
  bodyFontSize: number
  highlightStyle: string
  footerEnabled: boolean
  split: number
  rightSplit: number
  previewScale: number
  /** 正文字重 (100–900)，默认 400。 */
  bodyFontWeight: number
  gradientConfig?: { enabled: boolean; color1: string; color2: string; angle: number }
}

interface DraftPayload {
  documents: Document[]
  settings: AppSettings | null
}

// ── Default settings ──────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  cardTheme: 'moss-paper',
  bodyFontMode: 'wenkai',
  bodyFontSize: 30,
  highlightStyle: 'underline',
  footerEnabled: true,
  split: 50,
  rightSplit: 22,
  previewScale: 1.0,
  bodyFontWeight: 400,
  gradientConfig: { enabled: false, color1: '#6c5ce7', color2: '#a29bfe', angle: 135 },
}

// ── Helpers ───────────────────────────────────────────────────────────

/** 将文档 + 设置序列化到 localStorage。 */
function persist(docs: Document[], settings: AppSettings | null): void {
  try {
    const payload: DraftPayload = { documents: docs, settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 存储已满或不可用 — 静默跳过
  }
}

/** 从 localStorage 读取并解析草稿。如果没有则返回 null。 */
function readPayload(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.documents) || parsed.documents.length === 0) return null
    return parsed as DraftPayload
  } catch {
    return null
  }
}

/** 从 localStorage 清除草稿。 */
function clearDrafts(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ── Singleton flag ────────────────────────────────────────────────────

/** 本次会话是否已提示过用户。 */
let promptedThisSession = false

// ── Composable ─────────────────────────────────────────────────────────

export function useDrafts(): {
  /** 检查是否存在未保存的草稿。 */
  hasDrafts: () => boolean
  /** 恢复草稿并返回保存的设置（如果没有则返回默认值）。 */
  restore: () => AppSettings
  /** 丢弃草稿。 */
  discard: () => void
  /** 标记恢复提示已显示（本次会话不再询问）。 */
  dismissPrompt: () => void
  /** 持久化当前设置（调用方应使用防抖）。 */
  saveSettings: (settings: AppSettings) => void
} {
  const store = useDocumentsStore()

  // ── Auto-save: watch documents + settings → debounce persist ──
  // 使用浅层 watcher 组合，而不是对整个文档数组使用 deep: true — 避免每次
// 按键都产生依赖追踪开销，同时仍能捕获所有有意义的变更。

  let timer: ReturnType<typeof setTimeout> | null = null
  let latestSettings: AppSettings | null = null

  function schedulePersist(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      persist(store.documents, latestSettings)
    }, 1000) // 1s debounce
  }

  // 监听结构性变化：文档数量 + 当前文档 ID
  watch(
    () => [store.documents.length, store.activeId] as const,
    () => schedulePersist(),
  )

  // 监听当前文档内容（覆盖常见编辑场景）
  watch(
    () => store.activeDocument?.content,
    () => schedulePersist(),
  )

  // ── Final save on tab close ────────────────────────────────────

  window.addEventListener('beforeunload', () => {
    if (store.documents.length > 0) persist(store.documents, latestSettings)
  })

  // ── Public API ─────────────────────────────────────────────────

  function hasDrafts(): boolean {
    return !promptedThisSession && readPayload() !== null
  }

  function saveSettings(settings: AppSettings): void {
    latestSettings = { ...settings }
    schedulePersist()
  }

  function restore(): AppSettings {
    const payload = readPayload()
    if (!payload) return { ...DEFAULT_SETTINGS }

    store.documents = payload.documents
    // 激活第一个文档
    if (payload.documents.length > 0) {
      store.activeId = payload.documents[0].id
    }

    // 将保存的设置与默认值合并（处理未来版本新增的设置项）
    return payload.settings
      ? { ...DEFAULT_SETTINGS, ...payload.settings }
      : { ...DEFAULT_SETTINGS }
  }

  function discard(): void {
    clearDrafts()
  }

  function dismissPrompt(): void {
    promptedThisSession = true
  }

  return { hasDrafts, restore, discard, dismissPrompt, saveSettings }
}