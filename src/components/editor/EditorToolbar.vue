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
      :data-tip="item.id === 'heading' ? headingLabel : item.label"
    >
      <!-- ── Heading split button: main → insert H2, caret ▼ → H1/H2/H3 ── -->
      <template v-if="item.id === 'heading'">
        <div class="relative">
          <div class="join">
            <button
              class="btn btn-ghost btn-sm h-7 min-h-0 px-1.5 join-item"
              :aria-label="item.label"
              @mousedown.prevent
              @click="emit('insert', item)"
            >
              <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/><line x1="6" y1="4" x2="18" y2="4"/>
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-sm h-7 min-h-0 px-0 join-item"
              aria-label="选择标题级别"
              @click.stop="headingDropdownOpen = !headingDropdownOpen"
            >
              <svg class="w-[7px] h-[4px] pointer-events-none rotate-180" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0l5 6 5-6z"/>
              </svg>
            </button>
          </div>
          <ul
            v-show="headingDropdownOpen"
            class="absolute top-full right-0 mt-1 menu p-1.5 shadow bg-base-200 rounded-box w-36 z-50 text-xs whitespace-nowrap"
          >
            <li class="menu-title"><span class="text-[10px] opacity-50">标题级别</span></li>
            <li v-for="hl in HEADING_LEVELS" :key="hl.level">
              <a @click="onHeadingSelect(hl); headingDropdownOpen = false">
                <span class="text-xs font-bold">{{ hl.level }}</span>
              </a>
            </li>
          </ul>
        </div>
      </template>

      <!-- ── Normal button (non-split items) ── -->
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
        <!-- Highlight -->
        <svg v-else-if="item.id === 'highlight'" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
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
        <span v-else class="inline-flex items-center justify-center w-full h-full text-[13px] leading-none pointer-events-none" v-html="item.icon"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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

// ── Emits ────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'insert', item: ToolbarItem): void
  (e: 'command', action: 'undo'): void
}>()

// ── Heading dropdown logic ───────────────────────────────────────────

const headingDropdownOpen = ref(false)
const headingLabel = ref('标题 (H2)')

interface HeadingLevelOption {
  level: string
  label: string
  prefix: string
  placeholder: string
}

const HEADING_LEVELS: HeadingLevelOption[] = [
  { level: 'H1', label: '一级标题', prefix: '# ', placeholder: '' },
  { level: 'H2', label: '二级标题', prefix: '## ', placeholder: '' },
  { level: 'H3', label: '三级标题', prefix: '### ', placeholder: '' },
]

/** Replace the heading toolbar item's wrap config with the selected level, then emit. */
function onHeadingSelect(hl: HeadingLevelOption): void {
  headingLabel.value = `标题 (${hl.level})`
  emit('insert', {
    id: 'heading',
    icon: '<strong>H</strong>',
    label: `标题 (${hl.level})`,
    template: hl.prefix,
    wrap: {
      prefix: hl.prefix,
      suffix: '',
      placeholder: '',
    },
  })
}

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
  { id: 'highlight',   icon: '🖍',                   label: '高亮', template: '==高亮文本==',
    wrap: { prefix: '==', suffix: '==', placeholder: '高亮文本' } },
  { id: 'heading',     icon: '<strong>H</strong>',  label: '标题 (H2)', template: '## ',
    wrap: { prefix: '## ', suffix: '',   placeholder: '' } },

  // ── Link & media ──
  { id: 'link',        icon: '🔗',                   label: '链接', template: '[链接文本](url)' },
  { id: 'image',       icon: '🖼',                   label: '图片', template: '![图片描述](url)' },

  // ── Code ──
  { id: 'code',        icon: '⟨⟩',                   label: '代码块', template: '```\n代码\n```' },

  // ── Table ──
  { id: 'table',       icon: '⊞',                    label: '表格', template: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |' },

  // ── Separator ──
  { id: 'divider',     icon: '—',                    label: '分割线', template: '\n---\n' },

  // ── Layout ──
  { id: 'left-column',  icon: '◧',                   label: '左分栏', template: ':::left\n左栏内容\n:::' },
  { id: 'right-column', icon: '◨',                   label: '右分栏', template: ':::right\n右栏内容\n:::' },
]
</script>
