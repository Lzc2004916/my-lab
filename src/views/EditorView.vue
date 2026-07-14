<template>
  <ThemeProvider :theme-id="settings.cardTheme.value">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-base-content mb-1">Markdown Editor</h1>
        <p class="text-base text-black/70">Write your content in Markdown with live preview</p>
      </div>

      <div class="panel rounded-xl overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-base-300/60">
          <!-- Editor Panel -->
          <div class="flex flex-col h-[75dvh]">
            <div class="bg-base-200/70 px-4 py-2.5 border-b border-base-300/60 text-sm font-medium shrink-0 flex items-center justify-between">
              <span>Editor</span>
              <span class="text-sm text-black/70 font-normal tabular-nums">
                {{ lineCount }} lines &middot; {{ wordCount }} words
              </span>
            </div>
            <EditorToolbar :current-heading-level="currentHeadingLevel" @insert="onToolbarInsert" />
            <div class="flex-1 min-h-0">
              <MarkdownEditor
                ref="markdownEditorRef"
                v-model="source"
                :theme="editorTheme"
                @scroll="onEditorScroll"
                @ready="onEditorReady"
                @heading-change="onHeadingChange"
              />
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="flex flex-col h-[75dvh]">
            <div class="bg-base-200/70 px-4 py-2.5 border-b border-base-300/60 text-sm font-medium shrink-0 flex items-center justify-between">
              <span>Preview</span>
              <span class="text-xs opacity-50 font-normal">Ctrl + 滚轮缩放</span>
            </div>
            <div class="flex-1 min-h-0 flex flex-row">
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
                  :heading-overrides="headingOverrides"
                />
              </div>
              <!-- Right toolbar: heading style panel -->
              <div class="shrink-0 w-56 border-l border-base-300/60 overflow-y-auto bg-base-100/50">
                <HeadingStylePanel />
              </div>
            </div>
          </div>
        </div>

        <!-- Export toolbar -->
        <div class="flex items-center gap-2 px-4 py-3 border-t border-base-300/60 bg-base-200/50">
          <button class="btn btn-sm btn-primary h-8 min-h-0 text-sm" @click="handleExportPNG">
            Export PNG
          </button>
          <button class="btn btn-sm btn-ghost h-8 min-h-0 text-sm" @click="handleExportJPG">
            Export JPG
          </button>
          <button class="btn btn-sm btn-ghost h-8 min-h-0 text-sm" @click="handleExportPDF">
            Export PDF (All)
          </button>
          <span v-if="isExporting" class="text-sm text-black/80 ml-2">
            Exporting... {{ progress }}%
          </span>
        </div>
      </div>
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EditorView } from '@codemirror/view'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import HeadingStylePanel from '@/components/editor/HeadingStylePanel.vue'
import type { ToolbarItem } from '@/components/editor/EditorToolbar.vue'
import CardPreview from '@/components/CardPreview.vue'
import ThemeProvider from '@/components/ThemeProvider.vue'
import { useMarkdown } from '@/composables/useMarkdown'
import { useSettings } from '@/composables/useSettings'
import { useExport } from '@/composables/useExport'
import { PAGE_WIDTH, PAGE_HEIGHT, getTheme } from '@/card'
import type { TypographySettings, HeadingStyleOverrides } from '@/card'

// ── Settings ─────────────────────────────────────────────────────────────

const settings = useSettings()

// ── Source ───────────────────────────────────────────────────────────────

const source = ref(`# Welcome to Rich Text Editor

## Getting Started

This is a Markdown editor with live preview.

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
`)

// ── Typography (derived from theme + user settings) ──────────────────────

const typography = computed<TypographySettings>(() => {
  const theme = getTheme(settings.cardTheme.value)
  return {
    bodySize: settings.bodyFontSize.value,
    lineHeight: 1.84,
    bodyFontMode: settings.bodyFontMode.value || (theme.editor.bodyFontMode ?? 'wenkai'),
    subheadingStyle: settings.subheadingStyle.value || (theme.editor.subheadingStyle ?? 'large'),
  }
})

// ── Heading style overrides (from user settings) ────────────────────────

const headingOverrides = computed<HeadingStyleOverrides>(() => ({
  h1Size: settings.headingH1Size.value,
  h2Size: settings.headingH2Size.value,
  h3Size: settings.headingH3Size.value,
  h4Size: settings.headingH4Size.value,
  h5Size: settings.headingH5Size.value,
  h6Size: settings.headingH6Size.value,
  h1Align: settings.headingH1Align.value,
  h1Shadow: settings.headingH1Shadow.value,
  h2Shadow: settings.headingH2Shadow.value,
  h3Shadow: settings.headingH3Shadow.value,
  h4Shadow: settings.headingH4Shadow.value,
  h5Shadow: settings.headingH5Shadow.value,
  h6Shadow: settings.headingH6Shadow.value,
  h1Stroke: settings.headingH1Stroke.value,
  h2Stroke: settings.headingH2Stroke.value,
  h3Stroke: settings.headingH3Stroke.value,
  h4Stroke: settings.headingH4Stroke.value,
  h5Stroke: settings.headingH5Stroke.value,
  h6Stroke: settings.headingH6Stroke.value,
  h1StrokeWidth: settings.headingH1StrokeWidth.value,
  h2StrokeWidth: settings.headingH2StrokeWidth.value,
  h3StrokeWidth: settings.headingH3StrokeWidth.value,
  h4StrokeWidth: settings.headingH4StrokeWidth.value,
  h5StrokeWidth: settings.headingH5StrokeWidth.value,
  h6StrokeWidth: settings.headingH6StrokeWidth.value,
}))

/** CodeMirror 编辑器主题：暗色卡牌 → one-dark，浅色 → light。 */
const editorTheme = computed<string>(() => {
  const theme = getTheme(settings.cardTheme.value)
  return theme.category === 'dark' ? 'one-dark' : 'light'
})

// 主题切换时将正文字体、高亮样式同步到主题默认值
watch(() => settings.cardTheme.value, (newThemeId) => {
  const theme = getTheme(newThemeId)
  if (theme.editor.bodyFontMode) {
    settings.bodyFontMode.value = theme.editor.bodyFontMode
  }
  // 将高亮样式同步到主题的原生样式
  settings.highlightStyle.value = theme.editor.highlightStyle
})

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
  setCurrentLineHeading: (level: number) => void
  getCurrentLineHeadingLevel: () => number
  focus: () => void
}

const markdownEditorRef = ref<MarkdownEditorAPI | null>(null)
const editorView = ref<EditorView | null>(null)

function onEditorReady(view: EditorView): void {
  editorView.value = view
}

// ── Heading level tracking ──────────────────────────────────────────────

/** 光标所在行的当前标题级别（0 = 非标题，1-6 = H1-H6）。 */
const currentHeadingLevel = ref(0)

function onHeadingChange(level: number): void {
  currentHeadingLevel.value = level
}

// ── Toolbar integration ──────────────────────────────────────────────────

function onToolbarInsert(item: ToolbarItem): void {
  if (item.id === 'heading') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specificLevel = (item as any).headingLevel as number | undefined
    // 应用工具栏已选中的标题级别（下拉选择 → 主按钮点击）
    markdownEditorRef.value?.setCurrentLineHeading(specificLevel ?? 2)
  } else if (item.wrap) {
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