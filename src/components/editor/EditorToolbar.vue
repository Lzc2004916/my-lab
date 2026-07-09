<template>
  <div class="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-base-200 border-b border-base-300 select-none">
    <!-- Undo -->
    <button
      class="btn btn-ghost btn-sm btn-square h-7 w-7 min-h-0 tooltip tooltip-bottom"
      data-tip="撤回 (Ctrl+Z)"
      aria-label="撤回 (Ctrl+Z)"
      @mousedown.prevent
      @click="emit('command', 'undo')"
    >
      <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    </button>

    <!-- Separator -->
    <span class="w-px h-5 bg-base-300/60 mx-0.5"></span>

    <!-- Formatting tools -->
    <div
      v-for="item in toolbarItems"
      :key="item.id"
      class="tooltip tooltip-bottom"
      :data-tip="item.label"
    >
      <!-- ── Highlight split button (WPS-style): main → insert, caret ▼ → dropdown ── -->
      <template v-if="item.id === 'highlight'">
        <div class="hl-dropdown" :class="{ 'hl-dropdown--open': hlDropdownOpen }">
          <div class="highlight-split">
            <!-- Main button: click to insert highlight markdown -->
            <button
              class="btn btn-ghost btn-sm h-7 min-h-0 px-1.5 highlight-main-btn"
              :aria-label="item.label"
              @mousedown.prevent
              @click="emit('insert', item)"
            >
              <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 3l-1 4"/><path d="M15 3l1 4"/><rect x="2" y="7" width="20" height="6" rx="1"/><path d="M5 13v7h14v-7"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </button>
            <!-- Caret: click to toggle style dropdown -->
            <button
              class="highlight-caret-btn"
              aria-label="选择高亮样式"
              @click.stop="hlDropdownOpen = !hlDropdownOpen"
            >
              <svg
                class="highlight-caret-icon"
                viewBox="0 0 10 6"
                fill="currentColor"
                :style="{ color: highlightStyleColor }"
              >
                <path d="M0 0l5 6 5-6z"/>
              </svg>
            </button>
          </div>
          <!-- Dropdown menu -->
          <ul
            v-show="hlDropdownOpen"
            class="hl-dropdown-menu menu p-1.5 shadow bg-base-200 rounded-box w-32 z-50 text-xs"
          >
            <li class="menu-title"><span class="text-[10px] opacity-50">渲染样式</span></li>
            <li v-for="hs in HIGHLIGHT_STYLES" :key="hs.value">
              <a
                :class="{ active: highlightStyle === hs.value }"
                @click="onStyleSelect(hs.value)"
              >
                <span class="w-3 h-3 rounded-full mr-1.5 inline-block flex-shrink-0" :style="{ background: hs.color }"></span>
                {{ hs.label }}
              </a>
            </li>
          </ul>
        </div>
      </template>

      <!-- ── Normal button (non-highlight items) ── -->
      <button
        v-else
        class="btn btn-ghost btn-sm btn-square h-7 w-7 min-h-0"
        :aria-label="item.label"
        @mousedown.prevent
        @click="emit('insert', item)"
      >
        <!-- Bold -->
        <svg v-if="item.id === 'bold'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
        <!-- Italic -->
        <svg v-else-if="item.id === 'italic'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
        <!-- Heading -->
        <svg v-else-if="item.id === 'heading'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/><line x1="6" y1="4" x2="18" y2="4"/>
        </svg>
        <!-- Underline -->
        <svg v-else-if="item.id === 'underline'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4v7a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>
        </svg>
        <!-- Link -->
        <svg v-else-if="item.id === 'link'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <!-- Image -->
        <svg v-else-if="item.id === 'image'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <!-- Code -->
        <svg v-else-if="item.id === 'code'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <!-- Math -->
        <svg v-else-if="item.id === 'math'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="12" y2="12"/><line x1="4" y1="17" x2="8" y2="17"/><circle cx="16" cy="17" r="3"/><line x1="14" y1="15" x2="18" y2="19"/>
        </svg>
        <!-- Mermaid -->
        <svg v-else-if="item.id === 'mermaid'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="8" y="14" width="8" height="8" rx="1"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="18" y1="10" x2="14" y2="14"/>
        </svg>
        <!-- Table -->
        <svg v-else-if="item.id === 'table'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <!-- Divider -->
        <svg v-else-if="item.id === 'divider'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="4" y1="12" x2="20" y2="12"/>
        </svg>
        <!-- Left Column -->
        <svg v-else-if="item.id === 'left-column'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/><line x1="10" y1="3" x2="10" y2="21" stroke-width="1" stroke-dasharray="2 2"/>
        </svg>
        <!-- Right Column -->
        <svg v-else-if="item.id === 'right-column'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/><line x1="11" y1="3" x2="11" y2="21" stroke-width="1" stroke-dasharray="2 2"/>
        </svg>
        <!-- Fallback -->
        <span v-else class="toolbar-icon" v-html="item.icon"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// ── Types ────────────────────────────────────────────────────────────

export interface ToolbarItem {
  /** Unique identifier for the button. */
  id: string
  /** Icon displayed inside the button (raw HTML for SVG / Unicode). */
  icon: string
  /** Display label for the tooltip / aria-label. */
  label: string
  /** Markdown template emitted to the parent on click (fallback for non-wrap items). */
  template: string
  /** Optional metadata for wrap-style formatting (wraps selected text or inserts placeholder). */
  wrap?: {
    /** Characters prepended before the selected text or placeholder. */
    prefix: string
    /** Characters appended after the selected text or placeholder. */
    suffix: string
    /** Fallback text inserted when nothing is selected; will be auto-selected. */
    placeholder: string
  }
}

// ── Highlight style types ────────────────────────────────────────────

export type HighlightStyle = 'underline' | 'marker' | 'border'

// ── Props ────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Currently active highlight render style. */
  highlightStyle?: HighlightStyle
}>()

// ── Emits ────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'insert', item: ToolbarItem): void
  (e: 'command', action: 'undo'): void
  (e: 'update:highlightStyle', style: HighlightStyle): void
}>()

// ── Dropdown toggle logic ────────────────────────────────────────────

const hlDropdownOpen = ref(false)

/** Select a style and close the dropdown. */
function onStyleSelect(style: HighlightStyle): void {
  emit('update:highlightStyle', style)
  hlDropdownOpen.value = false
}

// ── Highlight style config ───────────────────────────────────────────

const HIGHLIGHT_STYLES: { value: HighlightStyle; label: string; color: string }[] = [
  { value: 'underline', label: '下划线', color: '#3b82f6' },
  { value: 'marker',    label: '荧光笔', color: '#f59e0b' },
  { value: 'border',    label: '边框',   color: '#8b5cf6' },
]

const highlightStyleColor = computed(() => {
  const found = HIGHLIGHT_STYLES.find((hs) => hs.value === (props.highlightStyle ?? 'underline'))
  return found?.color ?? '#3b82f6'
})

// ── Toolbar config ───────────────────────────────────────────────────

/**
 * The single source of truth for all toolbar buttons.
 *
 * To add a new tool, insert an entry into this array — the template
 * loop picks it up automatically.  No template / script changes needed.
 */
const toolbarItems: readonly ToolbarItem[] = [
  // ── Text formatting ──
  { id: 'bold',        icon: '<strong>B</strong>', label: '加粗', template: '**粗体文本**',
    wrap: { prefix: '**', suffix: '**', placeholder: '粗体文本' } },
  { id: 'italic',      icon: '<em>I</em>',          label: '斜体', template: '*斜体文本*',
    wrap: { prefix: '*',  suffix: '*',  placeholder: '斜体文本' } },
  { id: 'heading',     icon: '<strong>H</strong>',  label: '标题', template: '## 标题',
    wrap: { prefix: '## ', suffix: '',   placeholder: '标题' } },
  { id: 'highlight',   icon: '🖊',                   label: '高亮', template: '==高亮文本==',
    wrap: { prefix: '==', suffix: '==', placeholder: '高亮文本' } },
  { id: 'underline',   icon: '<u>U</u>',            label: '下划线', template: '^下划线文本^',
    wrap: { prefix: '^',  suffix: '^',  placeholder: '下划线文本' } },

  // ── Link & media ──
  { id: 'link',        icon: '🔗',                   label: '链接', template: '[链接文本](url)' },
  { id: 'image',       icon: '🖼',                   label: '图片', template: '![图片描述](url)' },

  // ── Code & math ──
  { id: 'code',        icon: '⟨⟩',                   label: '代码块', template: '```\n代码\n```' },
  { id: 'math',        icon: '𝑓',                    label: '公式', template: '$$\n公式\n$$' },

  // ── Diagrams ──
  { id: 'mermaid',     icon: '🔷',                   label: 'Mermaid', template: '```mermaid\ngraph TD\n  A --> B\n```' },

  // ── Table ──
  { id: 'table',       icon: '⊞',                    label: '表格', template: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |' },

  // ── Separator ──
  { id: 'divider',     icon: '—',                    label: '分割线', template: '\n---\n' },

  // ── Layout ──
  { id: 'left-column',  icon: '◧',                   label: '左分栏', template: ':::left\n左栏内容\n:::' },
  { id: 'right-column', icon: '◨',                   label: '右分栏', template: ':::right\n右栏内容\n:::' },
]
</script>

<style scoped>
.toolbar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
}

/* ── Highlight split button ─────────────────────────────────────────────── */

.hl-dropdown {
  position: relative;
}

.highlight-split {
  display: inline-flex;
  align-items: center;
  height: 28px;
  border-radius: 0.375rem;
}

.highlight-main-btn {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.highlight-caret-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 28px;
  cursor: pointer;
  border: none;
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
  background: transparent;
  flex-shrink: 0;
  padding: 0;
  color: inherit;
}

.highlight-caret-btn:hover {
  background-color: oklch(var(--bc) / 0.06);
}

.highlight-caret-icon {
  width: 7px;
  height: 4px;
  pointer-events: none;
}

/* ── Dropdown menu ──────────────────────────────────────────────────────── */

.hl-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  white-space: nowrap;
}
</style>
