import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ── 类型 ────────────────────────────────────────────────────────────

export interface Document {
  id: string
  title: string
  content: string
  savedAt: string
  /** 从 YAML 中提取的前置元数据标签（如果有）。 */
  tags: string[]
}

// ── 前置元数据解析器 ──────────────────────────────────────────────

interface Frontmatter {
  title?: string
  description?: string
  date?: string
  tags?: string[]
  image?: string
}

/**
 * 简单的 YAML 前置元数据解析器。
 * 处理 `key: value`、`key: "带引号的值"` 和 `key: [a, b, c]`。
 * 如果内容不以 `---` 开头，返回 `null`。
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

    // 移除周围的引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // 数组值：[a, b, c]
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
 * 从 Markdown 内容中提取可读标题。
 * 优先级：前置元数据 `title` → 第一个 `# Heading` → `'Untitled'`。
 */
export function extractTitle(content: string): string {
  const fm = parseFrontmatter(content)
  if (fm?.title) return fm.title

  // 回退：第一个 # 标题
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim()

  return '' // 调用方应处理回退到 i18n 的 'Untitled'
}

/** 从前置元数据中提取标签，或返回空数组。 */
export function extractTags(content: string): string[] {
  const fm = parseFrontmatter(content)
  return fm?.tags ?? []
}

// ── 辅助函数 ─────────────────────────────────────────────────────────

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

// ── 欢迎内容 ─────────────────────────────────────────────────

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
  // ── 状态 ───────────────────────────────────────────────────

  const documents = ref<Document[]>([])
  const activeId = ref<string>('')

  // ── 获取器 ─────────────────────────────────────────────────

  const activeDocument = computed<Document | null>(() => {
    return documents.value.find((d) => d.id === activeId.value) ?? null
  })

  const documentCount = computed(() => documents.value.length)

  // ── 操作 ─────────────────────────────────────────────────

  /** 初始化 store。如果为空则创建欢迎文档。 */
  function init(): void {
    if (documents.value.length > 0) return
    const doc = defaultDoc()
    doc.content = WELCOME_CONTENT
    doc.title = extractTitle(WELCOME_CONTENT)
    doc.tags = extractTags(WELCOME_CONTENT)
    documents.value.push(doc)
    activeId.value = doc.id
  }

  /** 创建一个新的空白文档并切换到它。 */
  function addDocument(content: string = ''): string {
    const doc = defaultDoc()
    doc.content = content
    doc.title = extractTitle(content)
    doc.tags = extractTags(content)
    documents.value.push(doc)
    activeId.value = doc.id
    return doc.id
  }

  /** 通过 ID 移除文档。拒绝移除最后一个文档。 */
  function removeDocument(id: string): void {
    if (documents.value.length <= 1) {
      // 用新的空白文档替换而不是删除
      const doc = defaultDoc()
      documents.value = [doc]
      activeId.value = doc.id
      return
    }

    const idx = documents.value.findIndex((d) => d.id === id)
    if (idx === -1) return

    documents.value.splice(idx, 1)

    // 如果活动文档被移除，切换到相邻文档
    if (activeId.value === id) {
      const newIdx = Math.min(idx, documents.value.length - 1)
      activeId.value = documents.value[newIdx].id
    }
  }

  /** 切换活动文档。 */
  function setActive(id: string): void {
    if (documents.value.some((d) => d.id === id)) {
      activeId.value = id
    }
  }

  /** 更新内容 + 自动提取标题和标签。 */
  function updateContent(id: string, content: string): void {
    const doc = documents.value.find((d) => d.id === id)
    if (!doc) return
    doc.content = content
    doc.title = extractTitle(content)
    doc.tags = extractTags(content)
    doc.savedAt = new Date().toISOString()
  }

  // ── 返回 ──────────────────────────────────────────────────

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