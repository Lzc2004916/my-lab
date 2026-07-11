import { watch } from 'vue'
import { useDocumentsStore, type Document } from '@/stores/documents'

const STORAGE_KEY = 'md2card:drafts'

// ── Types ─────────────────────────────────────────────────────────────

/** All user-customisable UI settings that survive restarts. */
export interface AppSettings {
  editorTheme: string
  cardTheme: string
  bodyFontMode: string
  bodyFontSize: number
  highlightStyle: string
  footerEnabled: boolean
  showThemePanel: boolean
  split: number
  gradientConfig?: { enabled: boolean; color1: string; color2: string; angle: number }
}

interface DraftPayload {
  documents: Document[]
  settings: AppSettings | null
}

// ── Default settings ──────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  editorTheme: 'one-dark',
  cardTheme: 'moss-paper',
  bodyFontMode: 'wenkai',
  bodyFontSize: 30,
  highlightStyle: 'underline',
  footerEnabled: true,
  showThemePanel: false,
  split: 50,
  gradientConfig: { enabled: false, color1: '#6c5ce7', color2: '#a29bfe', angle: 135 },
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Serialize documents + settings to localStorage. */
function persist(docs: Document[], settings: AppSettings | null): void {
  try {
    const payload: DraftPayload = { documents: docs, settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage full or unavailable — silently skip
  }
}

/** Read and parse drafts from localStorage. Returns null if none. */
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

/** Clear drafts from localStorage. */
function clearDrafts(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ── Singleton flag ────────────────────────────────────────────────────

/** Whether the user has already been prompted this session. */
let promptedThisSession = false

// ── Composable ─────────────────────────────────────────────────────────

export function useDrafts(): {
  /** Check whether unsaved drafts exist. */
  hasDrafts: () => boolean
  /** Restore drafts and return saved settings (or defaults if none). */
  restore: () => AppSettings
  /** Discard drafts. */
  discard: () => void
  /** Mark the recovery prompt as shown (don't ask again this session). */
  dismissPrompt: () => void
  /** Persist the current settings (caller should debounce). */
  saveSettings: (settings: AppSettings) => void
} {
  const store = useDocumentsStore()

  // ── Auto-save: watch documents + settings → debounce persist ──
  // Use a combination of shallow watchers instead of deep: true on the
  // entire documents array — avoids dependency-tracking overhead on every
  // keystroke while still catching all meaningful changes.

  let timer: ReturnType<typeof setTimeout> | null = null
  let latestSettings: AppSettings | null = null

  function schedulePersist(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      persist(store.documents, latestSettings)
    }, 1000) // 1s debounce
  }

  // Watch structural changes: doc count + active doc ID
  watch(
    () => [store.documents.length, store.activeId] as const,
    () => schedulePersist(),
  )

  // Watch active document content (covers the common editing case)
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
    // Activate the first document
    if (payload.documents.length > 0) {
      store.activeId = payload.documents[0].id
    }

    // Merge saved settings with defaults (handles new settings added in future versions)
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
