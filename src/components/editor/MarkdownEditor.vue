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
  /** CodeMirror theme identifier. 'one-dark' (default) | 'light'. */
  theme?: string
}

const props = defineProps<Props>()

// ── Emits ───────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', view: EditorView): void
}>()

// ── Refs & state ────────────────────────────────────────────────────

const editorRef = ref<HTMLDivElement | null>(null)

/** The singleton CodeMirror EditorView instance. */
let editorView: EditorView | null = null

/**
 * Guard flag to prevent emit loops.
 * Set to `true` when the editor dispatches a change internally,
 * so the external modelValue watcher skips syncing back.
 */
let isInternalChange = false

/**
 * Compartment so the theme can be swapped at runtime without
 * recreating the entire EditorState.
 */
const themeCompartment = new Compartment()

/** Map theme prop value → Extension. */
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
 * Build the extension array for EditorState.
 *
 * Extracted so additional extensions (autocompletion, Vim, Emacs,
 * AI completions, search/replace, custom keybindings) can be added
 * without touching the component's core logic.
 */
function createExtensions(): Extension[] {
  return [
    // Gutter
    lineNumbers(),

    // Active line highlight
    highlightActiveLine(),

    // Markdown language support
    markdown(),

    // Custom highlight / underline decoration layer (==text== and ^text^)
    highlightDecorations,

    // Undo / redo history (required by defaultKeymap)
    history(),

    // Default PC keybindings (Enter, Backspace, etc.)
    keymap.of(defaultKeymap),

    // Undo / Redo keybindings (Ctrl-Z, Ctrl-Y, Ctrl-Shift-Z)
    keymap.of(historyKeymap),

    // Theme — managed via Compartment for hot-swapping
    themeCompartment.of(resolveThemeExtension(props.theme ?? 'one-dark')),

    // Soft line wrapping
    EditorView.lineWrapping,

    // ── Content sync: editor → model ──
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        isInternalChange = true
        const value = update.state.doc.toString()
        emit('update:modelValue', value)
        isInternalChange = false
      }
    }),
  ]
}

// ── Lifecycle ───────────────────────────────────────────────────────

onMounted(() => {
  const container = editorRef.value
  if (!container) return

  // Build initial state with the current modelValue
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions(),
  })

  // Create the singleton EditorView
  editorView = new EditorView({
    state,
    parent: container,
  })

  // Notify parent that the editor is ready
  emit('ready', editorView)
})

/**
 * Watch for theme changes → hot-swap via Compartment so we don't
 * have to recreate the entire EditorState.
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
 * Watch for external modelValue changes and sync into the editor.
 *
 * 🔧 Uses `flush: 'sync'` so the watcher fires synchronously during the
 * reactive update.  This is required for the `isInternalChange` guard to
 * work: with the default `flush: 'pre'` the callback runs in a microtask,
 * after `isInternalChange` has already been reset to `false`, defeating
 * the guard.  Synchronous flush ensures the guard sees `isInternalChange`
 * as `true` during the emit → parent-update → watcher chain.
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
  // Destroy editor, DOM, and all listeners
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})

// ── Exposed API ─────────────────────────────────────────────────────

/**
 * Insert text at the current cursor position.
 * Supports multi-line text. Cursor moves to the end of inserted text.
 * Preserves undo history.
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
 * Wrap selected text with markdown syntax markers, or insert a placeholder
 * when nothing is selected.
 *
 * - If text IS selected: wraps it with `prefix + selectedText + suffix`,
 *   then places the cursor AFTER the closing suffix marker.
 * - If nothing is selected: inserts `prefix + placeholder + suffix`,
 *   then SELECTS the placeholder text so the user can type immediately.
 *
 * Uses `changeByRange` so it works correctly with multiple selections.
 * Preserves undo history.
 */
function wrapSelectionOrInsert(prefix: string, suffix: string, placeholder: string): void {
  const view = editorView
  if (!view) return

  const { state } = view
  const changeSet = state.changeByRange((range) => {
    const selectedText = state.doc.sliceString(range.from, range.to)

    if (selectedText) {
      // ── Case 1: text is selected → wrap it ──
      const wrapped = prefix + selectedText + suffix
      const cursorPos = range.from + wrapped.length
      return {
        changes: { from: range.from, to: range.to, insert: wrapped },
        range: EditorSelection.range(cursorPos, cursorPos),
      }
    }

    // ── Case 2: no selection → insert template with placeholder selected ──
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
 * Return the currently selected text, or an empty string.
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

/** Focus the editor. */
function focus(): void {
  editorView?.focus()
}

/** Blur the editor. */
function blur(): void {
  editorView?.contentDOM.blur()
}

/** Return the full document content as a string. */
function getValue(): string {
  return editorView ? editorView.state.doc.toString() : ''
}

/** Replace the entire document content. */
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

/** Return the underlying EditorView for advanced use cases. */
function getEditorView(): EditorView | null {
  return editorView
}

/** Undo the last edit (CodeMirror history). */
function undoEdit(): void {
  const view = editorView
  if (!view) return
  undo(view)
}

defineExpose({
  insertAtCursor,
  wrapSelectionOrInsert,
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

/* ── Custom inline marks (==highlight== and ^underline^) ────────────────── */

.markdown-editor :deep(.cm-mark) {
  background: rgba(255, 200, 0, 0.22);
  border-radius: 3px;
  padding: 1px 2px;
  margin: 0 -1px;
}

/* In one-dark: slightly warmer / lighter to stay readable on dark bg */
.markdown-editor :deep(.cm-theme-dark .cm-mark),
.cm-theme-dark .markdown-editor :deep(.cm-mark) {
  background: rgba(255, 210, 50, 0.18);
}

.markdown-editor :deep(.cm-underline) {
  text-decoration: underline;
  text-decoration-color: oklch(0.62 0.19 250);
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
</style>
