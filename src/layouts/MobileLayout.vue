<template>
  <div class="mobile-layout flex flex-col flex-1 overflow-hidden" :style="safeAreaStyle">
    <!-- ═══ Active panel ═══════════════════════════════════════════════ -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Tab: Editor -->
      <div v-show="activeTab === 'editor'" class="flex flex-col h-full">
        <EditorToolbar
          :can-undo="canUndo"
          :can-redo="canRedo"
          @insert="(item: ToolbarItem) => emit('toolbar-insert', item)"
          @command="(action: 'undo' | 'redo') => emit('toolbar-command', action)"
        />
        <div class="flex-1 min-h-0">
          <MarkdownEditor
            ref="mobileEditorRef"
            :model-value="source"
            @update:model-value="(v: string) => emit('update:source', v)"
            :theme="editorTheme"
          />
        </div>
        <!-- Stats bar -->
        <div class="h-7 shrink-0 flex items-center gap-3 px-3 text-xs text-base-content/60 bg-base-200/80 border-t border-base-300/60 tabular-nums">
          <span>字数: {{ wordCount }}</span>
          <span>行数: {{ lineCount }}</span>
        </div>
      </div>

      <!-- Tab: Preview -->
      <div v-show="activeTab === 'preview'" class="flex flex-col h-full">
        <div class="bg-base-200/70 px-4 py-2 border-b border-base-300/60 text-xs font-medium shrink-0 flex items-center justify-between">
          <span class="opacity-50">双指缩放预览</span>
          <span class="opacity-40 tabular-nums">{{ Math.round(previewScale * 100) }}%</span>
        </div>
        <div class="flex-1 min-h-0 overflow-auto bg-base-200/60 bg-dot-pattern">
          <CardPreview
            ref="mobileCardPreviewRef"
            :source="source"
            :theme-id="cardTheme"
            :typography="typography"
            :highlight-style="highlightStyle"
            :footer-enabled="footerEnabled"
            :gradient-config="gradientConfig"
            :preview-scale="previewScale"
            :heading-overrides="headingOverrides"
            :body-text-color="bodyTextColor"
          />
        </div>
      </div>

      <!-- Tab: Settings -->
      <div v-show="activeTab === 'settings'" class="h-full overflow-y-auto">
        <ControlPanel
          :app-theme="appTheme"
          @update:app-theme="(v: string) => emit('update:app-theme', v as 'light' | 'dark')"
          :card-theme="cardTheme"
          @update:card-theme="(v: string) => emit('update:card-theme', v)"
          :body-font-mode="bodyFontMode"
          @update:body-font-mode="(v: string) => emit('update:body-font-mode', v)"
          :body-font-size="bodyFontSize"
          @update:body-font-size="(v: number) => emit('update:body-font-size', v)"
          :body-font-weight="bodyFontWeight"
          @update:body-font-weight="(v: number) => emit('update:body-font-weight', v)"
          :highlight-style="highlightStyle"
          @update:highlight-style="(v: string) => emit('update:highlight-style', v)"
          :highlight-color="highlightColor"
          @update:highlight-color="(v: string | null) => emit('update:highlight-color', v)"
          :footer-enabled="footerEnabled"
          @update:footer-enabled="(v: boolean) => emit('update:footer-enabled', v)"
          :gradient-config="gradientConfig"
          @update:gradient-config="(v: GradientConfig) => emit('update:gradient-config', v)"
          :preview-scale="previewScale"
          @update:preview-scale="(v: number) => emit('update:preview-scale', v)"
          :font-options="fontOptions"
          :is-exporting="isExporting"
          :progress="progress"
          :body-text-color="bodyTextColor"
          @update:body-text-color="(v: string | null) => emit('update:body-text-color', v)"
          @export-png="emit('export-png')"
          @export-jpg="emit('export-jpg')"
          @export-pdf="emit('export-pdf')"
        />
      </div>
    </div>

    <!-- ═══ Bottom Tab Bar ═══════════════════════════════════════════════ -->
    <nav class="mobile-tab-bar" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        class="mobile-tab"
        :class="{ 'mobile-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="tab.id === 'editor'">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </template>
          <template v-else-if="tab.id === 'preview'">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </template>
          <template v-else>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </template>
        </svg>
        <span class="mobile-tab__label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TypographySettings, HighlightStyle, GradientConfig, HeadingStyleOverrides } from '@/card'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import type { ToolbarItem } from '@/components/editor/EditorToolbar.vue'
import CardPreview from '@/components/CardPreview.vue'
import ControlPanel from '@/components/ControlPanel.vue'

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  source: string
  editorTheme: string
  canUndo: boolean
  canRedo: boolean
  cardTheme: string
  appTheme: 'light' | 'dark'
  typography: TypographySettings
  highlightStyle: HighlightStyle
  highlightColor: string | null
  footerEnabled: boolean
  gradientConfig: GradientConfig
  previewScale: number
  headingOverrides: HeadingStyleOverrides
  activeTags: string[]
  wordCount: number
  lineCount: number
  isExporting: boolean
  progress: number
  fontOptions: { id: string; label: string; family: string }[]
  bodyFontMode: string
  bodyFontSize: number
  bodyFontWeight: number
  bodyTextColor: string | null
}

defineProps<Props>()

// ── Emits ────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'update:source': [value: string]
  'toolbar-insert': [item: ToolbarItem]
  'toolbar-command': [action: 'undo' | 'redo']
  'update:app-theme': [value: 'light' | 'dark']
  'update:card-theme': [value: string]
  'update:body-font-mode': [value: string]
  'update:body-font-size': [value: number]
  'update:body-font-weight': [value: number]
  'update:highlight-style': [value: string]
  'update:highlight-color': [value: string | null]
  'update:footer-enabled': [value: boolean]
  'update:gradient-config': [value: GradientConfig]
  'update:preview-scale': [value: number]
  'update:body-text-color': [value: string | null]
  'export-png': []
  'export-jpg': []
  'export-pdf': []
}>()

// ── Tabs ─────────────────────────────────────────────────────────────

interface TabDef {
  id: 'editor' | 'preview' | 'settings'
  label: string
}

const tabs: TabDef[] = [
  { id: 'editor', label: '编辑' },
  { id: 'preview', label: '预览' },
  { id: 'settings', label: '设置' },
]

const activeTab = ref<TabDef['id']>('editor')

// ── Safe area CSS ────────────────────────────────────────────────────

const safeAreaStyle = {
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
}
</script>

<style scoped>
/* ═══ Mobile Tab Bar ═══════════════════════════════════════════════════ */

.mobile-tab-bar {
  @apply flex items-center bg-base-100 border-t border-base-300/60 shrink-0;
  padding-top: 4px;
  padding-bottom: env(safe-area-inset-bottom, 4px);
  -webkit-tap-highlight-color: transparent;
}

.mobile-tab {
  @apply flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1;
  @apply text-xs text-base-content/50 transition-colors duration-150;
  @apply border-none bg-transparent cursor-pointer select-none;
  @apply active:bg-base-200/50;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}

.mobile-tab--active {
  @apply text-primary;
}

.mobile-tab__label {
  font-size: 10px;
  line-height: 1;
}

/* ── Ensure panels fill available space ─────────────────────────────── */

.mobile-layout {
  touch-action: manipulation;
}
</style>
