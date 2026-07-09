<template>
  <div class="h-screen flex flex-col overflow-hidden bg-base-200">
    <!-- ═══ Navbar (draggable) ═══════════════════════════════════════ -->
    <div class="navbar bg-base-100 border-b border-base-300/60 z-20 shrink-0 min-h-0 py-0 h-11">
      <div class="navbar-start">
        <span class="text-primary font-bold text-lg ml-2 tracking-tight">Markdown Card</span>
      </div>

      <div class="navbar-center flex items-center gap-0.5">
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
        <!-- Window controls (frameless) -->
        <div class="flex items-center h-full win-controls" role="group" :aria-label="isMaximized ? '还原' : '最大化'">
          <button
            class="win-btn win-btn--minimize"
            aria-label="最小化"
            title="最小化"
            @click="handleMinimize"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="5.5" width="10" height="1" fill="currentColor"/></svg>
          </button>
          <button
            class="win-btn win-btn--maximize"
            :aria-label="isMaximized ? '还原' : '最大化'"
            :title="isMaximized ? '还原' : '最大化'"
            @click="handleToggleMaximize"
          >
            <svg v-if="!isMaximized" class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 12 12" aria-hidden="true"><rect x="3" y="0.5" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="0.5" y="3" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <button
            class="win-btn win-btn--close"
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
      <div class="flex items-center gap-x-4 gap-y-1 px-4 py-2 flex-wrap">
        <!-- Body font size -->
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-base-content/50 whitespace-nowrap">正文字号</span>
          <input
            v-model.number="bodyFontSize"
            type="range" min="20" max="40" step="1"
            class="range range-sm range-primary w-14"
          />
          <span class="text-xs tabular-nums w-6 text-right text-base-content/60">{{ bodyFontSize }}</span>
        </div>


        <!-- Footer toggle -->
        <div class="flex items-center gap-1">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="footerEnabled" type="checkbox" class="checkbox checkbox-sm" />
            <span class="text-xs text-base-content/50 whitespace-nowrap">Footer</span>
          </label>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Content Font — inline dropdown -->
        <FontPicker v-model="bodyFontMode" :fonts="BODY_FONT_OPTIONS" />

        <span class="w-px h-4 bg-base-300/50"></span>

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

        <!-- Title settings toggle -->
        <button
          class="btn btn-sm btn-ghost text-base-content/50 gap-1.5 h-7 min-h-0 text-xs"
          @click="showTitlePanel = !showTitlePanel"
        >
          <span>标题设置</span>
          <svg
            class="w-3 h-3 transition-transform duration-200"
            :class="{ 'rotate-180': showTitlePanel }"
            viewBox="0 0 10 6"
          ><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
        </button>
      </div>

      <!-- Row 1b: Card Theme selector (collapsible) ──────────────────── -->
      <div
        class="border-t border-base-300/40 bg-base-200/50"
        :class="showThemePanel ? '' : 'hidden'"
      >
        <div class="px-4 pt-2.5 pb-2.5">
          <ThemeSelector v-model="cardTheme" :themes="THEMES" />
        </div>
      </div>

      <!-- Row 2: Title customization (collapsible) ──────────────────── -->
      <div
        class="border-t border-base-300/40 bg-base-200/50"
        :class="showTitlePanel ? '' : 'hidden'"
      >
        <!-- Title input — full width, prominent -->
        <div class="flex items-start gap-2 px-4 pt-2 pb-1.5">
          <span class="text-[10px] font-semibold text-base-content/35 uppercase tracking-widest whitespace-nowrap shrink-0 mt-1">标题</span>
          <div class="flex-1 flex flex-col gap-0.5 min-w-0">
            <div class="relative">
              <input
                v-model="manualTitle"
                type="text"
                placeholder="输入自定义标题，留空则自动提取…"
                class="input input-sm input-bordered text-xs h-7 min-h-0 w-full pr-12"
                :class="{ 'input-error': isTitleOverLimit }"
                :aria-invalid="isTitleOverLimit"
                :aria-describedby="isTitleOverLimit ? 'title-error-msg' : undefined"
                @input="onTitleInput"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none select-none"
                :class="titleCharCount >= MAX_TITLE_LENGTH ? 'text-warning' : 'text-base-content/30'"
                aria-hidden="true"
              >{{ titleCharCount }}/{{ MAX_TITLE_LENGTH }}</span>
            </div>
            <p
              v-if="isTitleOverLimit"
              id="title-error-msg"
              role="alert"
              class="text-[10px] text-error leading-none pl-0.5"
            >标题长度不能超过35字符</p>
          </div>
          <button
            class="btn btn-sm btn-ghost text-base-content/40 h-7 min-h-0 text-xs shrink-0"
            @click="resetTitleCustom()"
          >↺ 重置</button>
        </div>

        <!-- Title font selector -->
        <div class="px-4 pb-1.5">
          <FontPicker v-model="titleFontMode" :fonts="BODY_FONT_OPTIONS" label="标题字体" />
        </div>

        <!-- Formatting controls — compact row below -->
        <div class="flex items-center gap-x-3 gap-y-1 px-4 pb-2 flex-wrap">
          <!-- Font size -->
          <div class="flex items-center gap-1">
            <span class="text-xs text-base-content/50">字号</span>
            <input
              v-model.number="titleFontSize"
              type="range" min="40" max="90" step="1"
              class="range range-sm range-primary w-14"
            />
            <span class="text-xs tabular-nums w-6 text-right text-base-content/60">{{ titleFontSize }}</span>
          </div>

          <!-- Weight -->
          <div class="flex items-center gap-1">
            <span class="text-xs text-base-content/50">字重</span>
            <select v-model.number="titleWeight" class="select select-sm select-bordered w-20 text-xs h-7 min-h-0">
              <option :value="0">自动</option>
              <option :value="300">300</option>
              <option :value="400">400</option>
              <option :value="500">500</option>
              <option :value="600">600</option>
              <option :value="700">700</option>
              <option :value="800">800</option>
              <option :value="900">900</option>
            </select>
          </div>

          <!-- Color -->
          <div class="flex items-center gap-1">
            <span class="text-xs text-base-content/50">颜色</span>
            <input
              :value="titleColor || '#000000'"
              type="color"
              class="w-6 h-6 rounded cursor-pointer border border-base-300"
              @input="titleColor = ($event.target as HTMLInputElement).value"
            />
            <button
              v-if="titleColor"
              class="btn btn-xs btn-ghost h-6 min-h-0 px-1"
              @click="titleColor = ''"
            ><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>

          <!-- Alignment -->
          <div class="flex items-center gap-1">
            <span class="text-xs text-base-content/50">对齐</span>
            <div class="join">
              <button
                v-for="opt in TITLE_ALIGN_OPTIONS"
                :key="opt.value"
                class="btn btn-sm join-item px-2.5 h-7 min-h-0 text-xs"
                :class="{ 'btn-primary': titleAlignment === opt.value, 'btn-ghost': titleAlignment !== opt.value }"
                :title="opt.label"
                @click="titleAlignment = opt.value"
              >
                {{ opt.icon }}
              </button>
            </div>
          </div>
        </div>
      </div>
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
        class="w-1 cursor-col-resize select-none shrink-0 z-10 drag-bar"
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
          :manual-title="manualTitle"
          :theme-id="cardTheme"
          :typography="typography"
          :highlight-style="highlightStyle"
          :footer-enabled="footerEnabled"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { EditorView } from '@codemirror/view'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import type { ToolbarItem } from '@/components/editor/EditorToolbar.vue'
import CardPreview from '@/components/CardPreview.vue'
import DocumentTabs from '@/components/DocumentTabs.vue'
import { useMarkdown } from '@/composables/useMarkdown'
import { useExport } from '@/composables/useExport'
import { useDocumentsStore } from '@/stores/documents'
import { useDrafts, type AppSettings } from '@/composables/useDrafts'
import { THEMES, BODY_FONT_MODES, type BodyFontMode } from '@/card'
import DraftRecoveryModal from '@/components/DraftRecoveryModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import FontPicker from '@/components/FontPicker.vue'
import type { TypographySettings, HighlightStyle, TitleFontMode, SubheadingStyle, TitleCustomization, TitleAlignment } from '@/card'
import { DEFAULT_TITLE_CUSTOM } from '@/card'

// ── Theme configs ───────────────────────────────────────────────────────

const EDITOR_THEMES = [
  { label: '🌙 Dark', value: 'one-dark' },
  { label: '☀️ Light', value: 'light' },
] as const

const editorThemeLabel = computed(
  () => EDITOR_THEMES.find((t) => t.value === editorTheme.value)?.label ?? 'Dark',
)

const currentCardThemeName = computed(
  () => THEMES.find((t) => t.id === cardTheme.value)?.name ?? '苔绿纸书',
)

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

const BODY_FONT_OPTIONS = Object.entries(BODY_FONT_MODES).map(([id, def]) => ({
  id,
  label: def.label,
  family: def.family,
}))

// ── UI state ─────────────────────────────────────────────────────────────

const showThemePanel = ref<boolean>(false)
const showTitlePanel = ref<boolean>(false)

// ── Card rendering settings ─────────────────────────────────────────────

const titleFontSize = ref<number>(75)
const bodyFontSize = ref<number>(30)
const highlightStyle = ref<HighlightStyle>('underline' as HighlightStyle)
const footerEnabled = ref<boolean>(true)

// ── Title customization ──────────────────────────────────────────────────

const manualTitle = ref<string>('')

// ── Title validation ──────────────────────────────────────────────────────

const MAX_TITLE_LENGTH = 35

const titleCharCount = computed(() => manualTitle.value.length)

const isTitleOverLimit = computed(() => titleCharCount.value >= MAX_TITLE_LENGTH)

function onTitleInput(e: Event): void {
  const target = e.target as HTMLInputElement
  if (target.value.length > MAX_TITLE_LENGTH) {
    target.value = target.value.slice(0, MAX_TITLE_LENGTH)
    manualTitle.value = target.value
  }
}

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

/** Map body font mode to the closest title font mode (for the rendering engine). */
const BODY_TO_TITLE_FONT: Record<BodyFontMode, TitleFontMode> = {
  wenkai: 'kai',
  yahei: 'sans',
  simsun: 'serif',
  kaiti: 'kai',
  dengxian: 'sans',
  fangsong: 'serif',
}

const titleFontMode = ref<BodyFontMode>('kaiti')

const titleColor = ref<string>('')
const titleAlignment = ref<TitleAlignment>('left')
const titleWeight = ref<number>(0)
const titleSpacing = ref<number>(0)

const TITLE_ALIGN_OPTIONS: { value: TitleAlignment; label: string; icon: string }[] = [
  { value: 'left', label: '左对齐', icon: '⫷' },
  { value: 'center', label: '居中', icon: '≡' },
  { value: 'right', label: '右对齐', icon: '⫸' },
]

const titleCustom = computed<TitleCustomization>(() => ({
  color: titleColor.value,
  alignment: titleAlignment.value,
  fontWeight: titleWeight.value,
  letterSpacing: titleSpacing.value,
}))

const typography = computed<TypographySettings>(() => ({
  titleSize: titleFontSize.value,
  bodySize: bodyFontSize.value,
  lineHeight: 1.84,
  titleFontMode: BODY_TO_TITLE_FONT[titleFontMode.value] ?? 'serif',
  bodyFontMode: bodyFontMode.value,
  subheadingStyle: 'large' as SubheadingStyle,
  titleCustom: titleCustom.value,
}))

/** Reset title customization to theme defaults */
function resetTitleCustom(): void {
  titleColor.value = DEFAULT_TITLE_CUSTOM.color
  titleAlignment.value = DEFAULT_TITLE_CUSTOM.alignment
  titleWeight.value = DEFAULT_TITLE_CUSTOM.fontWeight
  titleSpacing.value = DEFAULT_TITLE_CUSTOM.letterSpacing
}

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
    manualTitle: manualTitle.value,
    editorTheme: editorTheme.value,
    cardTheme: cardTheme.value,
    bodyFontMode: bodyFontMode.value,
    titleFontMode: titleFontMode.value,
    titleFontSize: titleFontSize.value,
    bodyFontSize: bodyFontSize.value,
    highlightStyle: highlightStyle.value,
    footerEnabled: footerEnabled.value,
    titleColor: titleColor.value,
    titleAlignment: titleAlignment.value,
    titleWeight: titleWeight.value,
    showThemePanel: showThemePanel.value,
    showTitlePanel: showTitlePanel.value,
    split: split.value,
  }
}

/** Apply persisted settings to all reactive refs. */
function applySettings(s: AppSettings): void {
  manualTitle.value = s.manualTitle
  editorTheme.value = s.editorTheme
  cardTheme.value = s.cardTheme
  bodyFontMode.value = (s.bodyFontMode as BodyFontMode) || 'wenkai'
  titleFontMode.value = (s.titleFontMode as BodyFontMode) || 'kaiti'
  titleFontSize.value = s.titleFontSize
  bodyFontSize.value = s.bodyFontSize
  highlightStyle.value = s.highlightStyle as HighlightStyle
  footerEnabled.value = s.footerEnabled
  titleColor.value = s.titleColor
  titleAlignment.value = s.titleAlignment as TitleAlignment
  titleWeight.value = s.titleWeight
  showThemePanel.value = s.showThemePanel
  showTitlePanel.value = s.showTitlePanel
  split.value = s.split
}

// Auto-persist whenever any setting changes (1s debounce inside saveSettings)
watch(
  [
    manualTitle, editorTheme, cardTheme, bodyFontMode, titleFontMode, titleFontSize, bodyFontSize,
    highlightStyle, footerEnabled, titleColor, titleAlignment,
    titleWeight, showThemePanel, showTitlePanel, split,
  ],
  () => saveSettings(collectSettings()),
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
/* ═══ Window control buttons (frameless title bar) ═══════════════════ */

.win-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 40px;
  border: none;
  background: transparent;
  color: oklch(var(--bc) / 0.55);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}

.win-btn:hover {
  background-color: oklch(var(--bc) / 0.08);
  color: oklch(var(--bc) / 0.85);
}

.win-btn:active {
  background-color: oklch(var(--bc) / 0.12);
}

.win-btn:focus-visible {
  outline: 2px solid oklch(0.62 0.19 250);
  outline-offset: -2px;
}

/* ── Close button ──────────────────────────────────────────────────── */

.win-btn--close:hover {
  background-color: #e81123;
  color: #fff;
}

.win-btn--close:active {
  background-color: #bf0f1b;
  color: #fff;
}

/* ── Drag bar: invisible hit-area padding via pseudo-elements ────────── */

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
