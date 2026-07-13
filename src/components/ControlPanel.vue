<template>
  <div class="flex flex-col h-full overflow-y-auto bg-base-100 border-l border-base-300/60">
    <!-- ═══════════════════════════════════════════════════════════════════
         Section 1: 全局操作
         ═══════════════════════════════════════════════════════════════ -->
    <div class="px-4 pt-4 pb-3 border-b border-base-200">
      <h3 class="section-heading mb-3">全局操作</h3>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- App theme toggle (light/dark) -->
        <button
          class="btn btn-sm btn-outline h-8 min-h-0 gap-1.5 px-2.5 text-xs font-medium"
          :aria-label="appTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
          :title="appTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
          @click="emit('update:appTheme', appTheme === 'dark' ? 'light' : 'dark')"
        >
          <!-- Sun icon (shown in dark mode → switch to light) -->
          <svg v-if="appTheme === 'dark'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <!-- Moon icon (shown in light mode → switch to dark) -->
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span>{{ appTheme === 'dark' ? '暗色模式' : '亮色模式' }}</span>
        </button>

        <!-- Export dropdown -->
        <div class="dropdown dropdown-hover">
          <label tabindex="0" class="btn btn-sm btn-outline h-8 min-h-0 gap-1 px-2.5 text-xs font-medium">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出
            <svg class="w-2.5 h-2.5 opacity-50" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
          </label>
          <ul tabindex="0" class="dropdown-content menu p-1.5 shadow bg-base-200 rounded-box w-40 z-50 text-sm">
            <li><a @click="emit('export-png')">批量导出 PNG</a></li>
            <li><a @click="emit('export-jpg')">批量导出 JPG</a></li>
            <li class="menu-divider" role="separator"></li>
            <li><a @click="emit('export-pdf')">PDF 文档</a></li>
          </ul>
        </div>

        <!-- Export progress -->
        <span v-if="isExporting" class="inline-flex items-center gap-1">
          <LoadingSpinner variant="progress" size="sm" :progress="progress" :show-progress-label="true" inline />
        </span>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Section 2: 文本配置
         ═══════════════════════════════════════════════════════════════ -->
    <div class="px-4 pt-4 pb-3 border-b border-base-200">
      <h3 class="section-heading mb-3">文本配置</h3>
      <div class="flex flex-col gap-3">
        <!-- Body font size -->
        <div class="ctrl-row-item">
          <span class="ctrl-label">正文字号</span>
          <input
            :value="bodyFontSize"
            type="range" min="20" max="40" step="1"
            class="range range-xs range-primary flex-1 min-w-0"
            @input="emit('update:bodyFontSize', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="ctrl-value w-7">{{ bodyFontSize }}</span>
        </div>

        <!-- Content Font -->
        <div class="ctrl-row-item">
          <span class="ctrl-label">内容字体</span>
          <FontPicker
            :model-value="bodyFontMode"
            :fonts="fontOptions"
            :label="undefined"
            @update:model-value="(v: string) => emit('update:bodyFontMode', v)"
          />
        </div>

        <!-- Highlight style selector -->
        <div class="ctrl-row-item">
          <span class="ctrl-label">高亮样式</span>
          <div class="join">
            <button
              v-for="opt in HIGHLIGHT_STYLE_OPTIONS"
              :key="opt.value"
              class="btn btn-xs join-item h-6 min-h-0 px-2 text-xs font-medium transition-colors"
              :class="highlightStyle === opt.value
                ? 'btn-primary'
                : 'btn-ghost text-base-content/60 hover:text-base-content'"
              :title="opt.label"
              @click="emit('update:highlightStyle', opt.value)"
            >{{ opt.short }}</button>
          </div>
        </div>

        <!-- Footer toggle -->
        <div class="ctrl-row-item">
          <span class="ctrl-label">页脚</span>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              :checked="footerEnabled"
              type="checkbox"
              class="checkbox checkbox-xs checkbox-primary"
              @change="emit('update:footerEnabled', ($event.target as HTMLInputElement).checked)"
            />
            <span class="text-xs text-base-content/60">显示 Footer</span>
          </label>
        </div>

        <!-- Preview zoom -->
        <div class="ctrl-row-item">
          <span class="ctrl-label">预览缩放</span>
          <input
            :value="previewScale"
            type="range" min="0.25" max="2.5" step="0.05"
            class="range range-xs range-primary flex-1 min-w-0"
            @input="emit('update:previewScale', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="ctrl-value w-9">{{ previewScale }}x</span>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Section 3: 标题样式
         ═══════════════════════════════════════════════════════════════ -->
    <div class="px-4 pt-4 pb-3 border-b border-base-200">
      <h3 class="section-heading mb-3">标题样式</h3>
      <HeadingStylePanel />
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Section 4: 卡片主题
         ═══════════════════════════════════════════════════════════════ -->
    <div class="px-4 pt-4 pb-4 flex-1 flex flex-col min-h-0">
      <h3 class="section-heading mb-3">卡片主题</h3>
      <div class="flex flex-col gap-3 flex-1 min-h-0">
        <!-- Theme selector with built-in category tabs -->
        <ThemeSelector v-model="themeId" :themes="THEMES" />

        <!-- Gradient picker -->
        <div class="pt-2 border-t border-base-200">
          <GradientPicker :model-value="gradientConfig" @update:model-value="(v: GradientConfig) => emit('update:gradientConfig', v)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import FontPicker from '@/components/FontPicker.vue'
import GradientPicker from '@/components/GradientPicker.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import HeadingStylePanel from '@/components/editor/HeadingStylePanel.vue'
import { THEMES } from '@/card'
import type { GradientConfig } from '@/card'

const HIGHLIGHT_STYLE_OPTIONS = [
  { value: 'underline', label: '下划线', short: 'U̲' },
  { value: 'border', label: '边框', short: '◧' },
  { value: 'highlight', label: '加粗着色', short: 'B' },
] as const

// ── Font option type ─────────────────────────────────────────────────────

export interface FontOption {
  id: string
  label: string
  family: string
}

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  appTheme: 'light' | 'dark'
  cardTheme: string
  bodyFontMode: string
  bodyFontSize: number
  highlightStyle: string
  footerEnabled: boolean
  gradientConfig: GradientConfig
  previewScale: number
  fontOptions: FontOption[]
  isExporting: boolean
  progress: number
}

const props = defineProps<Props>()

// ── Emits ────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:appTheme', value: 'light' | 'dark'): void
  (e: 'update:cardTheme', value: string): void
  (e: 'update:bodyFontMode', value: string): void
  (e: 'update:bodyFontSize', value: number): void
  (e: 'update:highlightStyle', value: string): void
  (e: 'update:footerEnabled', value: boolean): void
  (e: 'update:gradientConfig', value: GradientConfig): void
  (e: 'update:previewScale', value: number): void
  (e: 'export-png'): void
  (e: 'export-jpg'): void
  (e: 'export-pdf'): void
}>()

// ── Computed ─────────────────────────────────────────────────────────────

// Two-way v-model helper for cardTheme via ThemeSelector
const themeId = computed({
  get: () => props.cardTheme,
  set: (v: string) => emit('update:cardTheme', v),
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   Control Panel — Scoped Design Tokens
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Section heading ─────────────────────────────────────────────────── */

.section-heading {
  font-size: 0.6875rem;        /* 11px — compact but legible */
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.45);
  user-select: none;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid oklch(var(--bc) / 0.10);
}

/* ── Control row — label + input + value triplet ─────────────────────── */

.ctrl-row-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;                 /* 8px */
}

/* ── Label (left side, fixed width for alignment) ────────────────────── */

.ctrl-label {
  font-size: 0.75rem;          /* 12px */
  font-weight: 500;
  line-height: 1.25rem;        /* 20px */
  color: oklch(var(--bc) / 0.60);
  width: 3.25rem;              /* 52px — fits 4-char Chinese labels */
  flex-shrink: 0;
  user-select: none;
}

/* ── Value readout (right of slider) ─────────────────────────────────── */

.ctrl-value {
  font-size: 0.6875rem;        /* 11px */
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: oklch(var(--bc) / 0.50);
  text-align: right;
  flex-shrink: 0;
  user-select: none;
}
</style>
