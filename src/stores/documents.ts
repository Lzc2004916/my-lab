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

  // ── 撤销 / 重做栈（按文档 ID 索引） ──────────────────────

  const MAX_HISTORY = 100

  /** 每个文档的撤销快照栈（最近的在末尾）。 */
  const undoStacks = ref<Map<string, string[]>>(new Map())

  /** 每个文档的重做快照栈（最近的在末尾）。 */
  const redoStacks = ref<Map<string, string[]>>(new Map())

  /** 每个文档最后一次入栈的时间戳，用于合并快速连续的编辑。 */
  const lastPushTime = new Map<string, number>()

  /** 在此时间窗口（毫秒）内的连续编辑会合并为一个撤销步骤。 */
  const COALESCE_WINDOW_MS = 500

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
    // 清理被移除文档的撤销/重做历史
    clearHistory(id)

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

  // ── 撤销 / 重做操作 ──────────────────────────────────

  /** 将内容快照推入指定文档的撤销栈。 */
  function pushUndo(id: string, content: string): void {
    let stack = undoStacks.value.get(id)
    if (!stack) {
      stack = []
      undoStacks.value.set(id, stack)
    }

    // 合并快速连续的编辑：如果在合并窗口内，替换栈顶而不是追加
    const now = Date.now()
    const last = lastPushTime.get(id) ?? 0
    if (now - last < COALESCE_WINDOW_MS && stack.length > 0) {
      stack[stack.length - 1] = content
    } else {
      if (stack.length >= MAX_HISTORY) stack.shift() // 驱逐最旧的
      stack.push(content)
    }
    lastPushTime.set(id, now)

    // 新编辑 → 清空该文档的重做栈
    redoStacks.value.delete(id)
  }

  /** 撤销指定文档的最后一步操作。返回要恢复的内容，或 null。 */
  function undo(id: string): string | null {
    const doc = documents.value.find((d) => d.id === id)
    if (!doc) return null

    const stack = undoStacks.value.get(id)
    if (!stack || stack.length === 0) return null

    // 将当前内容推入重做栈
    let redoStack = redoStacks.value.get(id)
    if (!redoStack) {
      redoStack = []
      redoStacks.value.set(id, redoStack)
    }
    redoStack.push(doc.content)

    // 弹出上一个快照
    const previous = stack.pop()!
    if (stack.length === 0) undoStacks.value.delete(id)

    return previous
  }

  /** 重做指定文档的最后一次撤销。返回要恢复的内容，或 null。 */
  function redo(id: string): string | null {
    const doc = documents.value.find((d) => d.id === id)
    if (!doc) return null

    const stack = redoStacks.value.get(id)
    if (!stack || stack.length === 0) return null

    // 将当前内容推入撤销栈
    let undoStack = undoStacks.value.get(id)
    if (!undoStack) {
      undoStack = []
      undoStacks.value.set(id, undoStack)
    }
    undoStack.push(doc.content)

    // 弹出上一个重做快照
    const next = stack.pop()!
    if (stack.length === 0) redoStacks.value.delete(id)

    return next
  }

  /** 指定文档是否可以撤销。 */
  function canUndo(id: string): boolean {
    const stack = undoStacks.value.get(id)
    return (stack?.length ?? 0) > 0
  }

  /** 指定文档是否可以重做。 */
  function canRedo(id: string): boolean {
    const stack = redoStacks.value.get(id)
    return (stack?.length ?? 0) > 0
  }

  /** 清除指定文档的所有撤销/重做历史。 */
  function clearHistory(id: string): void {
    undoStacks.value.delete(id)
    redoStacks.value.delete(id)
    lastPushTime.delete(id)
  }

  // ── 操作 ─────────────────────────────────────────────────（续）

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
    pushUndo,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  }
})