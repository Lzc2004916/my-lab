import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ── Types ────────────────────────────────────────────────────────────

export interface Document {
  id: string
  title: string
  content: string
  savedAt: string
  /** Frontmatter tags extracted from YAML, if any. */
  tags: string[]
}

// ── Frontmatter parser ──────────────────────────────────────────────

interface Frontmatter {
  title?: string
  description?: string
  date?: string
  tags?: string[]
  image?: string
}

/**
 * Naive YAML frontmatter parser.
 * Handles `key: value`, `key: "quoted value"`, and `key: [a, b, c]`.
 * Returns `null` if the content doesn't start with `---`.
 */
function parseFrontmatter(content: string): Frontmatter | null {
  const trimmed = content.trimStart()
  if (!trimmed.startsWith('---')) return null

  const secondDelim = trimmed.indexOf('\n---', 3)
  if (secondDelim === -1) return null

  const fmBlock = trimmed.slice(3, secondDelim)
  const result: Frontmatter = {}

  for (const line of fmBlock.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()

    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Array value: [a, b, c]
    const arrayKeys = new Set<string>(['tags'])
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1)
      const items = inner
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean)
      if (arrayKeys.has(key)) (result as Record<string, unknown>)[key] = items
      continue
    }

    switch (key) {
      case 'title':
        result.title = value
        break
      case 'description':
        result.description = value
        break
      case 'date':
        result.date = value
        break
      case 'tags': {
        const items = value
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean)
        result.tags = items
        break
      }
      case 'image':
        result.image = value
        break
    }
  }

  return result
}

/**
 * Extract a human-readable title from Markdown content.
 * Priority: frontmatter `title` → first `# Heading` → `'Untitled'`.
 */
export function extractTitle(content: string): string {
  const fm = parseFrontmatter(content)
  if (fm?.title) return fm.title

  // Fallback: first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim()

  return '' // caller should handle fallback to i18n 'Untitled'
}

/** Extract tags from frontmatter, or return empty array. */
export function extractTags(content: string): string[] {
  const fm = parseFrontmatter(content)
  return fm?.tags ?? []
}

// ── Helpers ─────────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

function defaultDoc(): Document {
  return {
    id: uid(),
    title: '',
    content: '',
    savedAt: new Date().toISOString(),
    tags: [],
  }
}

// ── Welcome content ─────────────────────────────────────────────────

const WELCOME_CONTENT = `# Welcome to Markdown Card

## Getting Started

This is a **Markdown editor** with live card preview.

### Features

- Real-time preview
- Syntax highlighting

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquote

> The best way to predict the future is to create it.

### Table

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Diagrams | ✅ |

Enjoy writing! 😊
`

// ── Store ────────────────────────────────────────────────────────────

export const useDocumentsStore = defineStore('documents', () => {
  // ── State ───────────────────────────────────────────────────

  const documents = ref<Document[]>([])
  const activeId = ref<string>('')

  // ── Getters ─────────────────────────────────────────────────

  const activeDocument = computed<Document | null>(() => {
    return documents.value.find((d) => d.id === activeId.value) ?? null
  })

  const documentCount = computed(() => documents.value.length)

  // ── Actions ─────────────────────────────────────────────────

  /** Initialise the store. Creates a welcome doc if empty. */
  function init(): void {
    if (documents.value.length > 0) return
    const doc = defaultDoc()
    doc.content = WELCOME_CONTENT
    doc.title = extractTitle(WELCOME_CONTENT)
    doc.tags = extractTags(WELCOME_CONTENT)
    documents.value.push(doc)
    activeId.value = doc.id
  }

  /** Create a new blank document and switch to it. */
  function addDocument(content: string = ''): string {
    const doc = defaultDoc()
    doc.content = content
    doc.title = extractTitle(content)
    doc.tags = extractTags(content)
    documents.value.push(doc)
    activeId.value = doc.id
    return doc.id
  }

  /** Remove a document by id. Refuses to remove the last document. */
  function removeDocument(id: string): void {
    if (documents.value.length <= 1) {
      // Replace with a fresh blank doc instead of deleting
      const doc = defaultDoc()
      documents.value = [doc]
      activeId.value = doc.id
      return
    }

    const idx = documents.value.findIndex((d) => d.id === id)
    if (idx === -1) return

    documents.value.splice(idx, 1)

    // If the active doc was removed, switch to the neighbour
    if (activeId.value === id) {
      const newIdx = Math.min(idx, documents.value.length - 1)
      activeId.value = documents.value[newIdx].id
    }
  }

  /** Switch active document. */
  function setActive(id: string): void {
    if (documents.value.some((d) => d.id === id)) {
      activeId.value = id
    }
  }

  /** Update content + auto-extract title & tags. */
  function updateContent(id: string, content: string): void {
    const doc = documents.value.find((d) => d.id === id)
    if (!doc) return
    doc.content = content
    doc.title = extractTitle(content)
    doc.tags = extractTags(content)
    doc.savedAt = new Date().toISOString()
  }

  // ── Return ──────────────────────────────────────────────────

  return {
    documents,
    activeId,
    activeDocument,
    documentCount,
    init,
    addDocument,
    removeDocument,
    setActive,
    updateContent,
  }
})
