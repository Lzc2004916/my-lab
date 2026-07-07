import { watch } from 'vue'
import { useDocumentsStore, type Document } from '@/stores/documents'

const STORAGE_KEY = 'md2card:drafts'

// ── Helpers ─────────────────────────────────────────────────────────

/** Serialize all documents to localStorage. */
function persist(docs: Document[]): void {
  try {
    const payload = JSON.stringify(docs)
    localStorage.setItem(STORAGE_KEY, payload)
  } catch {
    // Storage full or unavailable — silently skip
  }
}

/** Read and parse drafts from localStorage. Returns null if none. */
function readDrafts(): Document[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed as Document[]
  } catch {
    return null
  }
}

/** Clear drafts from localStorage. */
function clearDrafts(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ── Singleton flag ──────────────────────────────────────────────────

/** Whether the user has already been prompted this session. */
let promptedThisSession = false

// ── Composable ───────────────────────────────────────────────────────

export function useDrafts(): {
  /** Check whether unsaved drafts exist. */
  hasDrafts: () => boolean
  /** Restore drafts into the store. */
  restore: () => void
  /** Discard drafts. */
  discard: () => void
  /** Mark the recovery prompt as shown (don't ask again this session). */
  dismissPrompt: () => void
} {
  const store = useDocumentsStore()

  // ── Auto-save: watch documents → debounce persist ────────────

  let timer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => store.documents,
    (docs) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => persist(docs), 1000) // 1s debounce
    },
    { deep: true },
  )

  // ── Final save on tab close ──────────────────────────────────

  window.addEventListener('beforeunload', () => {
    if (store.documents.length > 0) persist(store.documents)
  })

  // ── Public API ───────────────────────────────────────────────

  function hasDrafts(): boolean {
    return !promptedThisSession && readDrafts() !== null
  }

  function restore(): void {
    const drafts = readDrafts()
    if (!drafts) return

    store.documents = drafts
    // Activate the first document
    if (drafts.length > 0) {
      store.activeId = drafts[0].id
    }
  }

  function discard(): void {
    clearDrafts()
  }

  function dismissPrompt(): void {
    promptedThisSession = true
  }

  return { hasDrafts, restore, discard, dismissPrompt }
}
