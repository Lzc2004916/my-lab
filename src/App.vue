<template>
  <ThemeProvider :theme-id="cardTheme">
  <div class="h-screen flex flex-col overflow-hidden bg-base-200">
    <!-- ═══ Navbar (draggable) ═══════════════════════════════════════ -->
    <div class="navbar bg-base-100 border-b border-base-300/60 z-20 shrink-0 min-h-0 py-0 h-11">
      <div class="navbar-start">
        <span class="text-primary font-bold text-lg ml-2 tracking-tight">Markdown Card</span>
      </div>

      <div class="navbar-center flex items-center gap-0.5">
        <!-- App theme toggle (light/dark) -->
        <button
          class="btn btn-ghost btn-sm btn-square h-7 w-7 min-h-0"
          :aria-label="appTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
          :title="appTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
          @click="toggleAppTheme"
        >
          <!-- Sun icon (shown in dark mode → switch to light) -->
          <svg v-if="appTheme === 'dark'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <!-- Moon icon (shown in light mode → switch to dark) -->
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <!-- Editor theme -->
        <div class="dropdown dropdown-hover">
          <label tabindex="0" class="btn btn-sm btn-ghost text-xs h-7 min-h-0">
            {{ editorThemeLabel }}
            <svg class="w-3 h-3 ml-1 opacity-50" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
          </label>
          <ul tabindex="0" class="dropdown-content menu p-1.5 shadow bg-base-200 rounded-box w-36 z-50 text-sm">
            <li v-for="t in EDITOR_THEMES" :key="t.value">
              <a :class="{ active: editorTheme === t.value }" @click="editorTheme = t.value">
                {{ t.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Export -->
        <div class="dropdown">
          <label tabindex="0" class="btn btn-sm btn-ghost text-xs h-7 min-h-0 gap-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出
            <svg class="w-3 h-3 ml-0.5 opacity-50" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
          </label>
          <ul tabindex="0" class="dropdown-content menu p-1.5 shadow bg-base-200 rounded-box w-44 z-50 text-sm">
            <li><a @click="handleBatchExportPNG">批量导出 PNG</a></li>
            <li><a @click="handleBatchExportJPG">批量导出 JPG</a></li>
            <li class="menu-divider" role="separator"></li>
            <li><a @click="handleExportPDF">PDF 文档</a></li>
          </ul>
        </div>
      </div>

      <div class="navbar-end">
        <!-- Window controls (frameless) — Tailwind-driven with scoped CSS only for Electron specifics -->
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

    <!-- ═══ Control bar ═══════════════════════════════════════════════ -->
    <div class="bg-base-100/70 border-b border-base-300/60 select-none shadow-sm">
      <!-- Row 1: Quick settings ────────────────────────────────────── -->
      <div class="ctrl-row">
        <!-- Body font size -->
        <div class="ctrl-group">
          <span class="text-xs text-base-content/50 whitespace-nowrap">正文字号</span>
          <input
            v-model.number="bodyFontSize"
            type="range" min="20" max="40" step="1"
            class="range range-xs range-primary w-14"
          />
          <span class="text-xs tabular-nums w-6 text-right text-base-content/60">{{ bodyFontSize }}</span>
        </div>

        <!-- Footer toggle -->
        <div class="ctrl-group">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="footerEnabled" type="checkbox" class="checkbox checkbox-xs" />
            <span class="text-xs text-base-content/50 whitespace-nowrap">Footer</span>
          </label>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Content Font -->
        <FontPicker v-model="bodyFontMode" :fonts="BODY_FONT_OPTIONS" />

        <!-- Highlight style selector -->
        <div class="ctrl-group">
          <span class="text-xs text-base-content/50 whitespace-nowrap">高亮</span>
          <div class="join">
            <button
              v-for="opt in HIGHLIGHT_STYLE_OPTIONS"
              :key="opt.value"
              class="btn btn-xs join-item h-6 min-h-0 px-1.5 text-xs"
              :class="{ 'btn-active': highlightStyle === opt.value }"
              :title="opt.label"
              @click="highlightStyle = opt.value"
            >{{ opt.short }}</button>
          </div>
        </div>

        <span class="inline-divider"></span>

        <!-- Gradient picker -->
        <GradientPicker v-model="gradientConfig" />

        <!-- Card Theme toggle -->
        <button
          class="btn btn-sm btn-ghost text-base-content/50 gap-1.5 h-7 min-h-0 text-xs"
          @click="showThemePanel = !showThemePanel"
        >
          <span>卡片主题</span>
          <svg
            class="w-3 h-3 transition-transform duration-200"
            :class="{ 'rotate-180': showThemePanel }"
            viewBox="0 0 10 6"
          ><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
        </button>
      </div>

      <!-- Row 1b: Card Theme selector (collapsible) ──────────────────── -->
      <Transition name="collapse">
        <div
          v-show="showThemePanel"
          class="border-t border-base-300/40 bg-base-200/50"
        >
          <div class="px-4 pt-2.5 pb-2.5">
            <ThemeSelector v-model="cardTheme" :themes="THEMES" />
          </div>
        </div>
      </Transition>
    </div>

    <!-- ═══ Document tabs ═══════════════════════════════════════════ -->
    <DocumentTabs />

    <!-- ═══ Body ═════════════════════════════════════════════════════ -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Editor -->
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
      </div>

      <!-- Drag bar — wider hit area via negative margin pseudo-elements prevents cursor flicker -->
      <div
        class="w-1 cursor-col-resize select-none shrink-0 z-10 transition-colors duration-200 drag-bar"
        :class="dragging ? 'bg-primary' : 'bg-base-300'"
        @mousedown="onDragStart"
      ></div>

      <!-- Right: Preview — fills remaining space after left panel + drag bar -->
      <div
        class="flex-1 min-w-[300px] min-h-0 overflow-auto bg-base-200/60 bg-dot-pattern"
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
        />
      </div>
    </div>

    <!-- ═══ Status bar ═══════════════════════════════════════════════ -->
    <div class="h-8 shrink-0 flex items-center justify-between px-4 text-xs bg-base-100/80 backdrop-blur-sm text-base-content/50 border-t border-base-300/60 select-none">
      <span class="tabular-nums flex items-center gap-3">
        <span>字数: {{ wordCount }}</span>
        <span>行数: {{ lineCount }}</span>
        <template v-if="activeTags.length > 0">
          <span v-for="tag in activeTags" :key="tag" class="badge badge-xs badge-ghost">{{ tag }}</span>
        </template>
        <template v-if="isExporting">
          <LoadingSpinner
            variant="progress"
            size="sm"
            :progress="progress"
            :show-progress-label="true"
            inline
          />
        </template>
      </span>
      <span class="flex items-center gap-3">
        <span v-if="pageCount > 1" class="tabular-nums">
          第 {{ currentPage + 1 }} / {{ pageCount }} 页
        </span>
        <span class="tabular-nums">卡片: {{ currentCardThemeName }}</span>
        <span class="tabular-nums">分栏: {{ split }}%</span>
      </span>
    </div>

    <!-- ═══ Draft recovery modal ══════════════════════════════════ -->
    <DraftRecoveryModal
      v-if="showDraftModal"
      @restore="onDraftRestore"
      @discard="onDraftDiscard"
    />

    <!-- ═══ Close confirmation dialog ═══════════════════════════════ -->
    <dialog
      ref="closeDialogRef"
      class="modal"
      aria-label="确认关闭"
      @close="onCloseDialogDismiss"
    >
      <div class="modal-box w-96 max-w-[90vw]">
        <h3 id="close-dialog-title" class="font-bold text-base mb-3">确认关闭</h3>
        <p class="text-sm text-base-content/70 mb-5">确定要关闭窗口吗？未保存的更改将丢失。</p>
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
import { useMarkdown } from '@/composables/useMarkdown'
import { useExport } from '@/composables/useExport'
import { useDocumentsStore } from '@/stores/documents'
import { useDrafts, type AppSettings } from '@/composables/useDrafts'
import { THEMES, BODY_FONT_MODES, getTheme, type BodyFontMode } from '@/card'
import DraftRecoveryModal from '@/components/DraftRecoveryModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import FontPicker from '@/components/FontPicker.vue'
import GradientPicker from '@/components/GradientPicker.vue'
import type { GradientConfig } from '@/card'
import type { TypographySettings, HighlightStyle, SubheadingStyle } from '@/card'

// ── Theme configs ───────────────────────────────────────────────────────

const EDITOR_THEMES = [
  { label: '🌙 Dark', value: 'one-dark' },
  { label: '☀️ Light', value: 'light' },
] as const

const HIGHLIGHT_STYLE_OPTIONS = [
  { value: 'underline' as HighlightStyle, label: '下划线', short: 'U̲' },
  { value: 'border' as HighlightStyle, label: '边框', short: '◧' },
  { value: 'highlight' as HighlightStyle, label: '加粗着色', short: 'B' },
]

const editorThemeLabel = computed(
  () => EDITOR_THEMES.find((t) => t.value === editorTheme.value)?.label ?? 'Dark',
)

const currentCardThemeName = computed(
  () => THEMES.find((t) => t.id === cardTheme.value)?.name ?? '苔绿纸书',
)

// ── App theme (light/dark) toggle ──────────────────────────────────────

const appTheme = ref<'light' | 'dark'>(
  (localStorage.getItem('app-theme') as 'light' | 'dark') || 'light',
)

function applyAppTheme(): void {
  document.documentElement.setAttribute('data-theme', appTheme.value)
}

function toggleAppTheme(): void {
  appTheme.value = appTheme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('app-theme', appTheme.value)
  applyAppTheme()
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

const editorTheme = ref<string>('one-dark')
const cardTheme = ref<string>('moss-paper')
const bodyFontMode = ref<BodyFontMode>('wenkai')

// Sync font refs + gradient to theme defaults when the theme changes
watch(cardTheme, (newThemeId) => {
  const theme = getTheme(newThemeId)
  if (theme.editor.bodyFontMode) {
    bodyFontMode.value = theme.editor.bodyFontMode
  }
  // Sync highlight style to theme's native style
  highlightStyle.value = theme.editor.highlightStyle
  // Sync gradient colors + angle to theme — preserve user's enabled preference
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

const showThemePanel = ref<boolean>(false)

// ── Card rendering settings ─────────────────────────────────────────────

const bodyFontSize = ref<number>(30)
const highlightStyle = ref<HighlightStyle>('underline' as HighlightStyle)
const footerEnabled = ref<boolean>(true)
const gradientConfig = ref<GradientConfig>({
  enabled: false,
  color1: '#6c5ce7',
  color2: '#a29bfe',
  angle: 135,
})

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
    // Focus confirm button for keyboard ergonomics
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

// ── Markdown / page state ──────────────────────────────────────────────

const { currentPage } = useMarkdown(source)
const pageCount = ref<number>(1)

// ── Stats ───────────────────────────────────────────────────────────────

const lineCount = computed(() => source.value.split(/\r?\n/).length)
const wordCount = computed(() => {
  const text = source.value.trim()
  if (!text) return 0
  return text.split(/\s+/).length
})

// ── Drag-to-resize ──────────────────────────────────────────────────────

const split = ref<number>(50)

// ── Settings persistence ───────────────────────────────────────────────

/** Snapshot all current UI settings into a plain object for persistence. */
function collectSettings(): AppSettings {
  return {
    editorTheme: editorTheme.value,
    cardTheme: cardTheme.value,
    bodyFontMode: bodyFontMode.value,
    bodyFontSize: bodyFontSize.value,
    highlightStyle: highlightStyle.value,
    footerEnabled: footerEnabled.value,
    showThemePanel: showThemePanel.value,
    split: split.value,
    gradientConfig: { ...gradientConfig.value },
  }
}

/** Apply persisted settings to all reactive refs. */
function applySettings(s: AppSettings): void {
  editorTheme.value = s.editorTheme
  cardTheme.value = s.cardTheme
  bodyFontMode.value = (s.bodyFontMode as BodyFontMode) || 'wenkai'
  bodyFontSize.value = s.bodyFontSize
  highlightStyle.value = s.highlightStyle as HighlightStyle
  footerEnabled.value = s.footerEnabled
  showThemePanel.value = s.showThemePanel
  split.value = s.split
  if (s.gradientConfig) {
    gradientConfig.value = { ...s.gradientConfig }
  }
}

// Auto-persist whenever any setting changes (1s debounce inside saveSettings).
// Shallow watch is sufficient — each ref is a leaf value (string, number, boolean)
// except gradientConfig which is replaced on change (never mutated in place).
watch(
  [
    editorTheme, cardTheme, bodyFontMode, bodyFontSize,
    highlightStyle, footerEnabled, showThemePanel, split, gradientConfig,
  ],
  () => saveSettings(collectSettings()),
  { deep: false },
)

const dragging = ref<boolean>(false)

function onDragStart(event: MouseEvent): void {
  event.preventDefault()
  dragging.value = true
  const onMouseMove = (e: MouseEvent): void => {
    const pct = (e.clientX / window.innerWidth) * 100
    split.value = Math.max(20, Math.min(80, Math.round(pct)))
  }
  const onMouseUp = (): void => {
    dragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

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
  window.removeEventListener('keydown', onKeydown)
  windowControlCleanups.forEach((fn) => fn())
})
</script>

<style scoped>
/* ═══ Window control buttons (Electron frameless title bar) ═══════════════

   Most properties are Tailwind utilities applied via class on the button.
   Only Electron-specific behaviors (no-drag, close-red) remain here.       */

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

/* ── Theme panel collapse transition ────────────────────────────────── */

.collapse-enter-active {
  transition: all 0.25s ease-out;
}
.collapse-leave-active {
  transition: all 0.2s ease-in;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
