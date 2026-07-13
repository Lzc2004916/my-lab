<template>
  <div ref="editorRef" class="markdown-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorState, EditorSelection, Compartment, type Extension } from '@codemirror/state'
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  keymap,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, undo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { highlightDecorations } from './highlight-decorations'

// ── Props ───────────────────────────────────────────────────────────

interface Props {
  modelValue: string
  /** CodeMirror 主题标识符。'one-dark'（默认） | 'light'。 */
  theme?: string
}

const props = defineProps<Props>()

// ── Emits ───────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', view: EditorView): void
  (e: 'headingChange', level: number): void
}>()

// ── Refs & state ────────────────────────────────────────────────────

const editorRef = ref<HTMLDivElement | null>(null)

/** 单例 CodeMirror EditorView 实例。 */
let editorView: EditorView | null = null

/**
 * 防止 emit 循环的守卫标志。
 * 当编辑器内部派发变更时设置为 `true`，
 * 使外部 modelValue watcher 跳过同步。
 */
let isInternalChange = false

/**
 * Compartment，使主题可以在运行时替换，而无需
 * 重新创建整个编辑器状态。
 */
const themeCompartment = new Compartment()

/** 将主题 prop 值映射为 Extension。 */
function resolveThemeExtension(name: string): Extension {
  switch (name) {
    case 'light':
      return []
    case 'one-dark':
    default:
      return oneDark
  }
}

// ── Extension factory ───────────────────────────────────────────────

/**
 * 为 EditorState 构建扩展数组。
 *
 * 提取为独立函数，以便将来添加额外扩展（自动补全、Vim、Emacs、
 * AI 补全、搜索/替换、自定义快捷键）而不需要改变组件的核心逻辑。
 */
function createExtensions(): Extension[] {
  return [
    // 行号栏
    lineNumbers(),

    // 当前行高亮
    highlightActiveLine(),

    // Markdown 语言支持
    markdown(),

    // 自定义高亮 / 下划线装饰层（==text== 和 ^text^）
    highlightDecorations,

    // 撤销 / 重做历史（defaultKeymap 所需）
    history(),

    // 默认 PC 键盘绑定（Enter、Backspace 等）
    keymap.of(defaultKeymap),

    // 撤销 / 重做键盘绑定（Ctrl-Z、Ctrl-Y、Ctrl-Shift-Z）
    keymap.of(historyKeymap),

    // 主题 — 通过 Compartment 管理以支持热切换
    themeCompartment.of(resolveThemeExtension(props.theme ?? 'one-dark')),

    // 软换行
    EditorView.lineWrapping,

    // ── Content sync: editor -> model ──
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        isInternalChange = true
        const value = update.state.doc.toString()
        emit('update:modelValue', value)
        isInternalChange = false
      }
      if (update.selectionSet || update.docChanged) {
        emit('headingChange', detectHeadingAtCursor(update.state))
      }
    }),
  ]
}

// ── Lifecycle ───────────────────────────────────────────────────────

onMounted(() => {
  const container = editorRef.value
  if (!container) return

  // 使用当前 modelValue 构建初始状态
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions(),
  })

  // 创建单例 EditorView
  editorView = new EditorView({
    state,
    parent: container,
  })

  // 通知父组件编辑器已就绪
  emit('ready', editorView)
})

/**
 * 监听主题变更 -> 通过 Compartment 热替换，避免重新创建 
 * 整个 EditorState。
 */
watch(
  () => props.theme,
  (newTheme) => {
    const view = editorView
    if (!view) return
    view.dispatch({
      effects: themeCompartment.reconfigure(
        resolveThemeExtension(newTheme ?? 'one-dark'),
      ),
    })
  },
)

/**
 * 监听外部 modelValue 变更并同步到编辑器中。
 */
watch(
  () => props.modelValue,
  (newValue) => {
    const view = editorView
    if (!view || isInternalChange) return

    const currentValue = view.state.doc.toString()
    if (newValue !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: newValue,
        },
      })
    }
  },
  { flush: 'sync' },
)

onBeforeUnmount(() => {
  // 销毁编辑器、DOM 和所有监听器
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})

// ── Heading helpers ──────────────────────────────────────────────────

/**
 * 检测光标所在行的标题级别。
 *
 * 返回 0-6 之间的数字，表示光标所在行的 `#` 数量。
 * 返回 0 表示该行不是标题（不以 `#{1,6} ` 开头）。
 */
function detectHeadingAtCursor(state: EditorState): number {
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const match = line.text.match(/^(#{1,6})\s/)
  return match ? match[1].length : 0
}

/**
 * 设置光标所在行的标题级别。
 *
 * `level` 为 0 表示移除标题标记；1-6 表示设置对应级别的标题。
 * 操作保留该行的非前缀内容（标题文本），且保留撤销历史。
 */
function setCurrentLineHeading(level: number): void {
  const view = editorView
  if (!view) return

  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)

  // 移除现有的标题标记
  const stripped = line.text.replace(/^#{1,6}\s*/, '')

  // 构建新行
  const newLine = level > 0 ? '#'.repeat(level) + ' ' + stripped : stripped

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newLine },
    scrollIntoView: true,
  })
}

/**
 * 获取光标所在行的标题级别（供外部调用）。
 */
function getCurrentLineHeadingLevel(): number {
  const view = editorView
  if (!view) return 0
  return detectHeadingAtCursor(view.state)
}

// ── Exposed API ─────────────────────────────────────────────────────

/**
 * 在当前光标位置插入文本。
 * 支持多行文本。光标移动到插入文本的末尾。
 * 保留撤销历史。
 */
function insertAtCursor(text: string): void {
  const view = editorView
  if (!view) return

  const { state } = view
  const changeSet = state.changeByRange((range) => ({
    changes: { from: range.from, to: range.to, insert: text },
    range: EditorSelection.range(range.from + text.length, range.from + text.length),
  }))

  view.dispatch({
    changes: changeSet.changes,
    selection: changeSet.selection,
    scrollIntoView: true,
  })
}

/**
 * 去除文本中的内联 Markdown 格式化标记。
 *
 * 移除应用内联解析器（==highlight==, ^underline^）
 * 所识别的标记。
 *
 * 剥离在循环中运行，以便嵌套格式化
 * 能被逐步解开
 * from the outside in.
 */
function stripInlineMarkdown(text: string): string {
  let result = text
  let changed = true

  while (changed) {
    changed = false
    const before = result

    // 1. ==highlight== (longest marker — strip first)
    result = result.replace(/==([\s\S]+?)==/g, '$1')

    // 2. ^underline^
    result = result.replace(/\^([^^\n]+?)\^/g, '$1')

    if (result !== before) changed = true
  }

  return result
}

/**
 * 用 markdown 语法标记包裹选中的文本，或在没有选中时插入占位符。
 *
 * - 如果选中了文本：**先去除选中文本中已有的内联 Markdown 格式**，
 *   然后用 `prefix + 清理后的文本 + suffix` 包裹，
 *   并将光标放在关闭后缀标记之后。这确保重新样式化
 *   已格式化的文本能产生预期结果，而不是堆叠标记
 *   （例如选中 **hello** 并点击斜体生成 *hello*，而不是 ***hello***）。
 * - 如果没有选中：插入 `prefix + 占位符 + suffix`，
 *   然后选中占位符文本，以便用户可以直接输入。
 *
 * 使用 `changeByRange` 使其在多选情况下也能正常工作。
 * 保留撤销历史。
 */
function wrapSelectionOrInsert(prefix: string, suffix: string, placeholder: string): void {
  const view = editorView
  if (!view) return

  const { state } = view
  const changeSet = state.changeByRange((range) => {
    const selectedText = state.doc.sliceString(range.from, range.to)

    if (selectedText) {
      // 情况 1：已选中文本 — 先去除现有格式，再包裹
      const cleaned = stripInlineMarkdown(selectedText)
      const wrapped = prefix + cleaned + suffix
      const cursorPos = range.from + wrapped.length
      return {
        changes: { from: range.from, to: range.to, insert: wrapped },
        range: EditorSelection.range(cursorPos, cursorPos),
      }
    }

    // 情况 2：无选中 — 插入带占位符选中的模板
    const insertText = prefix + placeholder + suffix
    const placeholderStart = range.from + prefix.length
    const placeholderEnd = placeholderStart + placeholder.length
    return {
      changes: { from: range.from, to: range.to, insert: insertText },
      range: EditorSelection.range(placeholderStart, placeholderEnd),
    }
  })

  view.dispatch({
    changes: changeSet.changes,
    selection: changeSet.selection,
    scrollIntoView: true,
  })
}

/**
 * 返回当前选中的文本，或空字符串。
 */
function getSelectedText(): string {
  const view = editorView
  if (!view) return ''

  const { state } = view
  let selected = ''
  state.changeByRange((range) => {
    selected = state.doc.sliceString(range.from, range.to)
    return { range } // no-op
  })
  return selected
}

/** 聚焦编辑器。 */
function focus(): void {
  editorView?.focus()
}

/** 使编辑器失去焦点。 */
function blur(): void {
  editorView?.contentDOM.blur()
}

/** 返回完整文档内容作为字符串。 */
function getValue(): string {
  return editorView ? editorView.state.doc.toString() : ''
}

/** 替换整个文档内容。 */
function setValue(text: string): void {
  const view = editorView
  if (!view) return

  const currentValue = view.state.doc.toString()
  if (text !== currentValue) {
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: text },
    })
  }
}

/** 返回底层的 EditorView 供高级用例使用。 */
function getEditorView(): EditorView | null {
  return editorView
}

/** 撤销上一次编辑（CodeMirror 历史）。 */
function undoEdit(): void {
  const view = editorView
  if (!view) return
  undo(view)
}

defineExpose({
  insertAtCursor,
  wrapSelectionOrInsert,
  setCurrentLineHeading,
  getCurrentLineHeadingLevel,
  getSelectedText,
  focus,
  blur,
  getValue,
  setValue,
  getEditorView,
  undo: undoEdit,
})
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  width: 100%;
  overflow: clip;
}

.markdown-editor :deep(.cm-editor) {
  height: 100%;
  width: 100%;
}

.markdown-editor :deep(.cm-scroller) {
  overflow: auto;
  font-family:
    'JetBrains Mono',
    'Cascadia Code',
    'SF Mono',
    'Fira Code',
    'Consolas',
    monospace;
  font-size: 14px;
  line-height: 1.6;
}

/* Code blocks: break long tokens (URLs, strings, long identifiers)
   that would otherwise overflow the editor panel.
   `anywhere` ensures wrapping at any character when necessary,
   while normal text still wraps at word boundaries first. */
.markdown-editor :deep(.cm-content) {
  overflow-wrap: anywhere;
}

.markdown-editor :deep(.cm-editor:focus),
.markdown-editor :deep(.cm-editor.cm-focused) {
  outline: none;
}

/* Custom inline marks (==highlight== and ^underline^) */

.markdown-editor :deep(.cm-mark) {
  background: var(--card-highlight-marker-bg, rgba(255, 210, 0, 0.38));
  border-radius: 3px;
  padding: 1px 2px;
  margin: 0 -1px;
}

.markdown-editor :deep(.cm-underline) {
  text-decoration: underline;
  text-decoration-color: var(--card-highlight-underline-color, oklch(0.62 0.19 250));
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
</style>