<template>
  <ThemeProvider :theme-id="cardTheme">
  <div class="h-screen flex flex-col overflow-hidden bg-base-200">
    <!-- ═══ Navbar (minimal: title + window controls) ═══════════════════ -->
    <div class="navbar bg-base-100 border-b border-base-300/60 z-20 shrink-0 min-h-0 py-0 h-11">
      <div class="navbar-start">
        <span class="text-primary font-bold text-lg ml-2 tracking-tight">Markdown Card</span>
      </div>

      <div class="navbar-center"><!-- deliberately empty --></div>

      <div class="navbar-end">
        <!-- Window controls (frameless) -->
        <div class="flex items-center h-full win-controls" role="group" :aria-label="isMaximized ? '还原' : '最大化'">
          <button
            class="win-btn"
            aria-label="最小化"
            title="最小化"
            @click="handleMinimize"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="5.5" width="10" height="1" fill="currentColor"/></svg>
          </button>
          <button
            class="win-btn"
            :aria-label="isMaximized ? '还原' : '最大化'"
            :title="isMaximized ? '还原' : '最大化'"
            @click="handleToggleMaximize"
          >
            <svg v-if="!isMaximized" class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><rect x="3" y="0.5" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="0.5" y="3" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <button
            class="win-btn win-btn-close"
            aria-label="关闭"
            title="关闭"
            @click="handleCloseRequest"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Document tabs ═══════════════════════════════════════════════ -->
    <DocumentTabs />

    <!-- ═══ Three-panel body ════════════════════════════════════════════ -->
    <div class="flex-1 flex overflow-hidden">
      <!-- ── LEFT: Editor panel ────────────────────────────────────── -->
      <div
        class="flex flex-col overflow-hidden border-r border-base-300 min-w-[200px]"
        :style="{ flexBasis: split + '%' }"
      >
        <EditorToolbar
          :highlightStyle="highlightStyle"
          @update:highlightStyle="highlightStyle = $event"
          @insert="onToolbarInsert"
          @command="onToolbarCommand"
        />
        <div class="flex-1 min-h-0">
          <MarkdownEditor
            ref="editorRef"
            :modelValue="source"
            @update:modelValue="onSourceUpdate"
            :theme="editorTheme"
            @ready="onEditorReady"
          />
        </div>
        <!-- Stats bar at bottom of editor -->
        <div class="h-7 shrink-0 flex items-center gap-3 px-3 text-xs text-base-content/60 bg-base-200/80 border-t border-base-300/60 select-none tabular-nums">
          <span>字数: {{ wordCount }}</span>
          <span>行数: {{ lineCount }}</span>
          <template v-if="activeTags.length > 0">
            <span v-for="tag in activeTags" :key="tag" class="badge badge-xs badge-ghost">{{ tag }}</span>
          </template>
        </div>
      </div>

      <!-- ── LEFT DRAG BAR ──────────────────────────────────────────── -->
      <div
        class="w-1 cursor-col-resize select-none shrink-0 z-10 transition-colors duration-200 drag-bar"
        :class="dragging ? 'bg-primary' : 'bg-base-300'"
        @mousedown="onDragStart"
      ></div>

      <!-- ── MIDDLE: Preview panel ──────────────────────────────────── -->
      <div
        class="flex flex-col min-w-[200px] min-h-0 overflow-hidden"
        :style="{ flexBasis: (100 - split - rightSplit) + '%' }"
      >
        <div class="bg-base-200/70 px-4 py-2 border-b border-base-300/60 text-xs font-medium shrink-0 flex items-center justify-between">
          <span class="opacity-50">Ctrl + 滚轮缩放预览</span>
          <span class="opacity-40 tabular-nums">{{ Math.round(previewScale * 100) }}%</span>
        </div>
        <div
          ref="previewContainerRef"
          class="flex-1 min-h-0 overflow-auto bg-base-200/60 bg-dot-pattern"
          @wheel="onPreviewWheel"
        >
          <CardPreview
            ref="cardPreviewRef"
            v-model:current-page="currentPage"
            :source="source"
            :theme-id="cardTheme"
            :typography="typography"
            :highlight-style="highlightStyle"
            :footer-enabled="footerEnabled"
            :gradient-config="gradientConfig"
            :preview-scale="previewScale"
            :heading-overrides="headingOverrides"
          />
        </div>
      </div>

      <!-- ── RIGHT DRAG BAR ─────────────────────────────────────────── -->
      <div
        class="w-1 cursor-col-resize select-none shrink-0 z-10 transition-colors duration-200 drag-bar"
        :class="draggingRight ? 'bg-primary' : 'bg-base-300'"
        @mousedown="onDragStartRight"
      ></div>

      <!-- ── RIGHT: Control panel ───────────────────────────────────── -->
      <div
        class="min-w-[220px] overflow-hidden"
        :style="{ flexBasis: rightSplit + '%' }"
      >
        <ControlPanel
          :app-theme="appTheme"
          @update:app-theme="(v: 'light' | 'dark') => { appTheme = v; applyAppTheme() }"
          :card-theme="cardTheme"
          @update:card-theme="cardTheme = $event"
          :body-font-mode="bodyFontMode"
          @update:body-font-mode="(v: string) => bodyFontMode = v as BodyFontMode"
          :body-font-size="bodyFontSize"
          @update:body-font-size="bodyFontSize = $event"
          :highlight-style="highlightStyle"
          @update:highlight-style="(v: string) => highlightStyle = v as HighlightStyle"
          :footer-enabled="footerEnabled"
          @update:footer-enabled="footerEnabled = $event"
          :gradient-config="gradientConfig"
          @update:gradient-config="gradientConfig = $event"
          :preview-scale="previewScale"
          @update:preview-scale="previewScale = $event"
          :font-options="BODY_FONT_OPTIONS"
          :is-exporting="isExporting"
          :progress="progress"
          @export-png="handleBatchExportPNG"
          @export-jpg="handleBatchExportJPG"
          @export-pdf="handleExportPDF"
        />
      </div>
    </div>

    <!-- ═══ Draft recovery modal ═══════════════════════════════════════ -->
    <DraftRecoveryModal
      v-if="showDraftModal"
      @restore="onDraftRestore"
      @discard="onDraftDiscard"
    />

    <!-- ═══ Close confirmation dialog ══════════════════════════════════ -->
    <dialog
      ref="closeDialogRef"
      class="modal"
      aria-label="确认关闭"
      @close="onCloseDialogDismiss"
    >
      <div class="modal-box w-96 max-w-[90vw]">
        <h3 id="close-dialog-title" class="font-bold text-base mb-3">确认关闭</h3>
        <p class="text-sm text-base-content/80 mb-5">确定要关闭窗口吗？未保存的更改将丢失。</p>
        <div class="modal-action mt-0 gap-2">
          <button
            ref="cancelBtnRef"
            class="btn btn-sm btn-ghost"
            @click="handleCancelClose"
          >取消</button>
          <button
            ref="confirmBtnRef"
            class="btn btn-sm btn-error"
            @click="handleConfirmClose"
          >确定关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>取消</button>
      </form>
    </dialog>
  </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { EditorView } from '@codemirror/view'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import type { ToolbarItem } from '@/components/editor/EditorToolbar.vue'
import CardPreview from '@/components/CardPreview.vue'
import ThemeProvider from '@/components/ThemeProvider.vue'
import DocumentTabs from '@/components/DocumentTabs.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import { useMarkdown } from '@/composables/useMarkdown'
import { useExport } from '@/composables/useExport'
import { useDocumentsStore } from '@/stores/documents'
import { useDrafts, type AppSettings } from '@/composables/useDrafts'
import { BODY_FONT_MODES, getTheme, type BodyFontMode } from '@/card'
import DraftRecoveryModal from '@/components/DraftRecoveryModal.vue'
import type { GradientConfig } from '@/card'
import type { TypographySettings, HighlightStyle, SubheadingStyle, HeadingStyleOverrides } from '@/card'
import { useSettings } from '@/composables/useSettings'

// ── App theme (light/dark) toggle ──────────────────────────────────────

const appTheme = ref<'light' | 'dark'>(
  (localStorage.getItem('app-theme') as 'light' | 'dark') || 'light',
)

function applyAppTheme(): void {
  document.documentElement.setAttribute('data-theme', appTheme.value)
}

onMounted(() => {
  applyAppTheme()
})

// ── Document store ──────────────────────────────────────────────────────

const store = useDocumentsStore()

// ── Draft recovery ──────────────────────────────────────────────────────

const { hasDrafts, restore, discard, dismissPrompt, saveSettings } = useDrafts()
const showDraftModal = ref<boolean>(false)

if (hasDrafts()) {
  showDraftModal.value = true
} else {
  store.init()
}

function onDraftRestore(): void {
  const settings = restore()
  applySettings(settings)
  showDraftModal.value = false
}

function onDraftDiscard(): void {
  discard()
  dismissPrompt()
  showDraftModal.value = false
  store.init()
}

// ── Source content ──────────────────────────────────────────────────────

const source = computed<string>({
  get: () => store.activeDocument?.content ?? '',
  set: (value: string) => {
    if (store.activeId) store.updateContent(store.activeId, value)
  },
})

const activeTags = computed<string[]>(() => store.activeDocument?.tags ?? [])

const cardTheme = ref<string>('moss-paper')
const bodyFontMode = ref<BodyFontMode>('wenkai')

/** CodeMirror 编辑器主题：暗色卡牌 → one-dark，浅色 → light。 */
const editorTheme = computed<string>(() => {
  const theme = getTheme(cardTheme.value)
  return theme.category === 'dark' ? 'one-dark' : 'light'
})

// Theme change → sync font ref + gradient to theme defaults
watch(cardTheme, (newThemeId) => {
  const theme = getTheme(newThemeId)
  if (theme.editor.bodyFontMode) {
    bodyFontMode.value = theme.editor.bodyFontMode
  }
  highlightStyle.value = theme.editor.highlightStyle
  if (theme.gradient) {
    gradientConfig.value = {
      enabled: gradientConfig.value.enabled,
      color1: theme.gradient.color1,
      color2: theme.gradient.color2,
      angle: theme.gradient.angle ?? 135,
    }
  }
})

const BODY_FONT_OPTIONS = Object.entries(BODY_FONT_MODES).map(([id, def]) => ({
  id,
  label: def.label,
  family: def.family,
}))

// ── UI state ─────────────────────────────────────────────────────────────

// ── Card rendering settings ─────────────────────────────────────────────

const settings = useSettings()
const bodyFontSize = ref<number>(30)
const highlightStyle = ref<HighlightStyle>('underline' as HighlightStyle)
const footerEnabled = ref<boolean>(true)
const gradientConfig = ref<GradientConfig>({
  enabled: false,
  color1: '#6c5ce7',
  color2: '#a29bfe',
  angle: 135,
})
const previewScale = ref<number>(1.0)
const previewContainerRef = ref<HTMLDivElement | null>(null)

// ── Ctrl + mouse wheel → preview zoom ──────────────────────────────────

function onPreviewWheel(e: WheelEvent): void {
  if (!e.ctrlKey && !e.metaKey) return  // 无 Ctrl 时正常滚动
  e.preventDefault()
  const step = 0.05
  const delta = e.deltaY < 0 ? step : -step
  const newScale = Math.max(0.25, Math.min(2.5, previewScale.value + delta))
  previewScale.value = Math.round(newScale * 100) / 100
}

// ── Layout state ─────────────────────────────────────────────────────────

const split = ref<number>(32)
const rightSplit = ref<number>(22)
const dragging = ref<boolean>(false)
const draggingRight = ref<boolean>(false)

// ── Window controls ──────────────────────────────────────────────────────

const isMaximized = ref(false)
const showCloseDialog = ref(false)
const closeDialogRef = ref<HTMLDialogElement | null>(null)
const cancelBtnRef = ref<HTMLButtonElement | null>(null)
const confirmBtnRef = ref<HTMLButtonElement | null>(null)
const windowControlCleanups: (() => void)[] = []

function initWindowControls(): void {
  if (!window.electronAPI) return

  window.electronAPI.getWindowState().then((state: { isMaximized: boolean }) => {
    isMaximized.value = state.isMaximized
  })

  windowControlCleanups.push(
    window.electronAPI.onWindowStateChanged((state: { isMaximized: boolean }) => {
      isMaximized.value = state.isMaximized
    }),
  )

  windowControlCleanups.push(
    window.electronAPI.onCloseRequest(() => {
      showCloseDialog.value = true
    }),
  )
}

watch(showCloseDialog, (visible) => {
  if (!closeDialogRef.value) return
  if (visible) {
    closeDialogRef.value.showModal()
    requestAnimationFrame(() => confirmBtnRef.value?.focus())
  } else {
    closeDialogRef.value.close()
  }
})

function handleMinimize(): void {
  window.electronAPI?.minimizeWindow()
}

function handleToggleMaximize(): void {
  window.electronAPI?.toggleMaximize()
}

function handleCloseRequest(): void {
  showCloseDialog.value = true
}

function handleConfirmClose(): void {
  showCloseDialog.value = false
  window.electronAPI?.confirmClose()
}

function handleCancelClose(): void {
  showCloseDialog.value = false
}

function onCloseDialogDismiss(): void {
  showCloseDialog.value = false
}

onMounted(() => {
  initWindowControls()
})

const typography = computed<TypographySettings>(() => {
  const theme = getTheme(cardTheme.value)
  return {
    bodySize: bodyFontSize.value,
    lineHeight: 1.84,
    bodyFontMode: bodyFontMode.value,
    subheadingStyle: (theme.editor.subheadingStyle ?? 'large') as SubheadingStyle,
  }
})

// ── Heading style overrides ─────────────────────────────────────────────

const headingOverrides = computed<HeadingStyleOverrides>(() => ({
  h1Size: settings.headingH1Size.value,
  h2Size: settings.headingH2Size.value,
  h3Size: settings.headingH3Size.value,
  h4Size: settings.headingH4Size.value,
  h5Size: settings.headingH5Size.value,
  h6Size: settings.headingH6Size.value,
  h1Align: settings.headingH1Align.value,
  h1VerticalCenter: settings.headingH1VerticalCenter.value,
}))

// ── Markdown / page state ──────────────────────────────────────────────

const { currentPage } = useMarkdown(source)

// ── Stats ───────────────────────────────────────────────────────────────

const lineCount = computed(() => source.value.split(/\r?\n/).length)
const wordCount = computed(() => {
  const text = source.value.trim()
  if (!text) return 0
  return text.split(/\s+/).length
})

// ── Left drag-to-resize (editor ↔ preview) ──────────────────────────────

function onDragStart(event: MouseEvent): void {
  event.preventDefault()
  dragging.value = true
  const onMouseMove = (e: MouseEvent): void => {
    const pct = (e.clientX / window.innerWidth) * 100
    // Ensure middle panel (preview) gets at least 18% and right panel remains intact
    const maxLeft = Math.min(60, 100 - rightSplit.value - 18)
    split.value = Math.max(16, Math.min(maxLeft, Math.round(pct)))
  }
  const onMouseUp = (): void => {
    dragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// ── Right drag-to-resize (preview ↔ control panel) ──────────────────────

function onDragStartRight(event: MouseEvent): void {
  event.preventDefault()
  draggingRight.value = true
  const onMouseMove = (e: MouseEvent): void => {
    const rightEdgePct = ((window.innerWidth - e.clientX) / window.innerWidth) * 100
    // Ensure middle panel (preview) gets at least 18% and right panel is between 16-40%
    const maxRight = Math.min(40, 100 - split.value - 18)
    rightSplit.value = Math.max(16, Math.min(maxRight, Math.round(rightEdgePct)))
  }
  const onMouseUp = (): void => {
    draggingRight.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// ── Settings persistence ───────────────────────────────────────────────

/** 将所有当前 UI 设置快照为纯对象以持久化。 */
function collectSettings(): AppSettings {
  return {
    cardTheme: cardTheme.value,
    bodyFontMode: bodyFontMode.value,
    bodyFontSize: bodyFontSize.value,
    highlightStyle: highlightStyle.value,
    footerEnabled: footerEnabled.value,
    split: split.value,
    rightSplit: rightSplit.value,
    previewScale: previewScale.value,
    gradientConfig: { ...gradientConfig.value },
  }
}

/** 将持久化的设置应用到所有响应式 ref。 */
function applySettings(s: AppSettings): void {
  cardTheme.value = s.cardTheme
  bodyFontMode.value = (s.bodyFontMode as BodyFontMode) || 'wenkai'
  bodyFontSize.value = s.bodyFontSize
  highlightStyle.value = s.highlightStyle as HighlightStyle
  footerEnabled.value = s.footerEnabled
  split.value = s.split
  rightSplit.value = s.rightSplit ?? 22
  previewScale.value = s.previewScale ?? 1.0
  if (s.gradientConfig) {
    gradientConfig.value = { ...s.gradientConfig }
  }
}

// 任何设置变更时自动持久化（saveSettings 内部有 1 秒防抖）。
watch(
  [
    cardTheme, bodyFontMode, bodyFontSize,
    highlightStyle, footerEnabled, split, rightSplit, previewScale, gradientConfig,
  ],
  () => saveSettings(collectSettings()),
  { deep: false },
)

// ── Editor refs ─────────────────────────────────────────────────────────

interface MarkdownEditorAPI {
  insertAtCursor: (text: string) => void
  wrapSelectionOrInsert: (prefix: string, suffix: string, placeholder: string) => void
  focus: () => void
  undo: () => void
}

const editorRef = ref<MarkdownEditorAPI | null>(null)

function onSourceUpdate(value: string): void {
  source.value = value
}

function onEditorReady(_view: EditorView): void {}

// ── Toolbar → editor ────────────────────────────────────────────────────

function onToolbarInsert(item: ToolbarItem): void {
  if (item.wrap) {
    editorRef.value?.wrapSelectionOrInsert(item.wrap.prefix, item.wrap.suffix, item.wrap.placeholder)
  } else {
    editorRef.value?.insertAtCursor(item.template)
  }
  editorRef.value?.focus()
}

function onToolbarCommand(action: 'undo'): void {
  if (action === 'undo') editorRef.value?.undo()
  editorRef.value?.focus()
}

// ── Export ──────────────────────────────────────────────────────────────

interface CardPreviewAPI {
  getActiveCanvas: () => HTMLCanvasElement | null
  getAllCanvases: () => HTMLCanvasElement[]
  getPageCount: () => number
  forceRender: () => void
}

const cardPreviewRef = ref<CardPreviewAPI | null>(null)

const { isExporting, progress, exportBatchPNG, exportBatchJPG, exportMultiPDF } =
  useExport()

async function handleBatchExportPNG(): Promise<void> {
  const canvases = cardPreviewRef.value?.getAllCanvases()
  if (!canvases || canvases.length === 0) return
  try { await exportBatchPNG(canvases) } catch (e) { console.error('Batch PNG export failed:', e) }
}

async function handleBatchExportJPG(): Promise<void> {
  const canvases = cardPreviewRef.value?.getAllCanvases()
  if (!canvases || canvases.length === 0) return
  try { await exportBatchJPG(canvases) } catch (e) { console.error('Batch JPG export failed:', e) }
}

async function handleExportPDF(): Promise<void> {
  const canvases = cardPreviewRef.value?.getAllCanvases()
  if (!canvases || canvases.length === 0) return
  try {
    await exportMultiPDF(canvases, { w: 720, h: 960 })
  } catch (e) {
    console.error('PDF export failed:', e)
  }
}

// ── Keyboard shortcuts ──────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault()
    store.addDocument()
  }
}

window.addEventListener('keydown', onKeydown)

// ── Cleanup ─────────────────────────────────────────────────────────────

onBeforeUnmount(() => {
  dragging.value = false
  draggingRight.value = false
  window.removeEventListener('keydown', onKeydown)
  windowControlCleanups.forEach((fn) => fn())
})
</script>

<style scoped>
/* ═══ Window control buttons (Electron frameless title bar) ═══════════════ */

.win-btn {
  @apply relative inline-flex items-center justify-center border-none bg-transparent cursor-pointer shrink-0;
  height: 44px;
  width: 40px;
  color: oklch(var(--bc) / 0.55);
  transition: background-color 0.12s ease, color 0.12s ease;
  -webkit-app-region: no-drag;
}

.win-btn:hover {
  background-color: oklch(var(--bc) / 0.08);
  color: oklch(var(--bc) / 0.85);
}

.win-btn:active {
  background-color: oklch(var(--bc) / 0.12);
}

.win-btn:focus-visible {
  outline: 2px solid oklch(0.55 0.22 252);
  outline-offset: -2px;
}

/* ── Close button: Electron convention red ──────────────────────────── */

.win-btn-close:hover {
  background-color: #e81123;
  color: #fff;
}

.win-btn-close:active {
  background-color: #bf0f1b;
  color: #fff;
}

/* ── Drag bar: wider hit area via negative-margin pseudo-elements ──── */

.drag-bar {
  position: relative;
}

.drag-bar::before,
.drag-bar::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
}

.drag-bar::before {
  right: 100%;
}

.drag-bar::after {
  left: 100%;
}
</style>
