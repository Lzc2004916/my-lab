<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold tracking-tight text-base-content mb-1">Markdown Editor</h1>
      <p class="text-sm text-base-content/60">Write your content in Markdown with live preview</p>
    </div>

    <div class="border border-base-300/60 bg-base-100/60 rounded-xl overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-base-300/60">
        <!-- Editor Panel -->
        <div class="flex flex-col h-[75dvh]">
          <div class="bg-base-200/70 px-4 py-2.5 border-b border-base-300/60 text-sm font-medium shrink-0 flex items-center justify-between">
            <span>Editor</span>
            <span class="text-xs text-base-content/40 font-normal tabular-nums">
              {{ lineCount }} lines &middot; {{ wordCount }} words
            </span>
          </div>
          <EditorToolbar @insert="onToolbarInsert" />
          <div class="flex-1 min-h-0">
            <MarkdownEditor
              ref="markdownEditorRef"
              v-model="source"
              @scroll="onEditorScroll"
              @ready="onEditorReady"
            />
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="flex flex-col h-[75dvh]">
          <div class="bg-base-200/70 px-4 py-2.5 border-b border-base-300/60 text-sm font-medium shrink-0">
            Preview
          </div>
          <div
            ref="previewRef"
            class="flex-1 min-h-0 overflow-auto p-4"
          >
            <CardPreview
              ref="cardPreviewRef"
              v-model:current-page="currentPage"
              :source="source"
              :theme-id="settings.cardTheme.value"
              :typography="typography"
              :highlight-style="settings.highlightStyle.value"
              :footer-left="settings.footerLeft.value"
              :footer-right-mode="settings.footerRightMode.value"
              :footer-enabled="settings.footerEnabled.value"
              :card-corner-mode="settings.cardCornerMode.value"
            />
          </div>
        </div>
      </div>

      <!-- Export toolbar -->
      <div class="flex items-center gap-2 px-4 py-3 border-t border-base-300/60 bg-base-200/50">
        <button class="btn btn-sm btn-primary h-8 min-h-0 text-xs" @click="handleExportPNG">
          Export PNG
        </button>
        <button class="btn btn-sm btn-ghost h-8 min-h-0 text-xs" @click="handleExportJPG">
          Export JPG
        </button>
        <button class="btn btn-sm btn-ghost h-8 min-h-0 text-xs" @click="handleExportPDF">
          Export PDF (All)
        </button>
        <span v-if="isExporting" class="text-xs text-base-content/60 ml-2">
          Exporting... {{ progress }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EditorView } from '@codemirror/view'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import type { ToolbarItem } from '@/components/editor/EditorToolbar.vue'
import CardPreview from '@/components/CardPreview.vue'
import { useMarkdown } from '@/composables/useMarkdown'
import { useSettings } from '@/composables/useSettings'
import { useExport } from '@/composables/useExport'
import { PAGE_WIDTH, PAGE_HEIGHT } from '@/card'
import type { TypographySettings } from '@/card'

// ── Settings ─────────────────────────────────────────────────────────────

const settings = useSettings()

// ── Source ───────────────────────────────────────────────────────────────

const source = ref(`# Welcome to Rich Text Editor

## Getting Started

This is a **Markdown editor** with live preview.

### Features

- Real-time preview
- Syntax highlighting
- Math support: $E = mc^2$

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
| Math | ✅ |
| Diagrams | ✅ |

Enjoy writing! 😊
`)

// ── Typography (derived from settings) ───────────────────────────────────

const typography = computed<TypographySettings>(() => ({
  titleSize: settings.titleFontSize.value,
  bodySize: settings.bodyFontSize.value,
  lineHeight: 1.84,
  titleFontMode: settings.titleFontMode.value,
  bodyFontMode: 'wenkai' as const,
  subheadingStyle: settings.subheadingStyle.value,
  titleCustom: {
    color: settings.titleColor.value,
    alignment: settings.titleAlignment.value,
    fontWeight: settings.titleCustomWeight.value,
    letterSpacing: settings.titleCustomSpacing.value,
  },
}))

// ── Markdown processing ─────────────────────────────────────────────────

const { currentPage } = useMarkdown(source)

// ── Editor stats ─────────────────────────────────────────────────────────

const lineCount = computed(() => source.value.split(/\r?\n/).length)
const wordCount = computed(() => {
  const text = source.value.trim()
  if (!text) return 0
  return text.split(/\s+/).length
})

// ── Editor reference ─────────────────────────────────────────────────────

interface MarkdownEditorAPI {
  insertAtCursor: (text: string) => void
  wrapSelectionOrInsert: (prefix: string, suffix: string, placeholder: string) => void
  focus: () => void
}

const markdownEditorRef = ref<MarkdownEditorAPI | null>(null)
const editorView = ref<EditorView | null>(null)

function onEditorReady(view: EditorView): void {
  editorView.value = view
}

// ── Toolbar integration ──────────────────────────────────────────────────

function onToolbarInsert(item: ToolbarItem): void {
  if (item.wrap) {
    markdownEditorRef.value?.wrapSelectionOrInsert(
      item.wrap.prefix,
      item.wrap.suffix,
      item.wrap.placeholder,
    )
  } else {
    markdownEditorRef.value?.insertAtCursor(item.template)
  }
  markdownEditorRef.value?.focus()
}

// ── Scroll sync ──────────────────────────────────────────────────────────

const previewRef = ref<HTMLDivElement | null>(null)

function onEditorScroll(ratio: number): void {
  const preview = previewRef.value
  if (!preview) return
  const maxScroll = preview.scrollHeight - preview.clientHeight
  if (maxScroll <= 0) return
  preview.scrollTop = ratio * maxScroll
}

// ── Export ───────────────────────────────────────────────────────────────

const cardPreviewRef = ref<{
  getActiveCanvas: () => HTMLCanvasElement | null
  getAllCanvases: () => HTMLCanvasElement[]
  getPageCount: () => number
  forceRender: () => void
} | null>(null)

const { isExporting, progress, exportPNG, exportJPG, exportMultiPDF } = useExport()

async function handleExportPNG(): Promise<void> {
  const canvas = cardPreviewRef.value?.getActiveCanvas()
  if (!canvas) return
  try {
    await exportPNG(canvas)
  } catch (e) {
    console.error('PNG export failed:', e)
  }
}

async function handleExportJPG(): Promise<void> {
  const canvas = cardPreviewRef.value?.getActiveCanvas()
  if (!canvas) return
  try {
    await exportJPG(canvas)
  } catch (e) {
    console.error('JPG export failed:', e)
  }
}

async function handleExportPDF(): Promise<void> {
  const canvases = cardPreviewRef.value?.getAllCanvases()
  if (!canvases || canvases.length === 0) return
  try {
    await exportMultiPDF(canvases, {
      w: PAGE_WIDTH,
      h: PAGE_HEIGHT,
    })
  } catch (e) {
    console.error('PDF export failed:', e)
  }
}
</script>
