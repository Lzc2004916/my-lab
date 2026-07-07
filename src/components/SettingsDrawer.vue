<template>
  <div class="drawer drawer-end z-[100]">
    <input
      id="settings-drawer-toggle"
      type="checkbox"
      class="drawer-toggle"
      :checked="isOpen"
      @change="onToggleCheckbox"
    />
    <div class="drawer-side">
      <label
        for="settings-drawer-toggle"
        class="drawer-overlay"
      ></label>

      <div class="w-80 min-h-full bg-base-200 text-base-content overflow-y-auto">
        <!-- ── Header ──────────────────────────────────────────── -->
        <div class="sticky top-0 z-10 flex items-center justify-between bg-base-200/80 backdrop-blur-sm px-6 py-4 border-b border-base-300/60">
          <h2 class="text-lg font-bold tracking-tight">{{ t('settings.title') }}</h2>
          <label
            for="settings-drawer-toggle"
            class="btn btn-sm btn-ghost btn-circle h-8 w-8 min-h-0"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </label>
        </div>

        <div class="flex flex-col gap-6 px-6 py-4">
          <!-- ── Theme preview ─────────────────────────────────── -->
          <div class="form-control">
            <label class="label pb-2">
              <span class="label-text font-medium">{{ t('settings.themePreview') }}</span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="theme in THEME_PREVIEWS"
                :key="theme.id"
                class="flex flex-col gap-2 p-3 rounded-lg border transition-all duration-200"
                :class="{
                  'border-primary ring-2 ring-primary/30': cardTheme === theme.id,
                  'border-base-300/60 hover:border-base-content/20 hover:shadow-sm': cardTheme !== theme.id,
                }"
                @click="selectTheme(theme.id)"
              >
                <div
                  class="w-full aspect-[3/2] rounded-md shadow-sm"
                  :style="{ background: theme.color, border: '1px solid ' + theme.border }"
                ></div>
                <span class="text-xs text-base-content/60 truncate w-full text-center">
                  {{ t(theme.labelKey) }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// ── i18n ────────────────────────────────────────────────────────────

const { t } = useI18n()

// ── Props / Emits ───────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
  /** Currently active card theme id (for the preview grid highlight). */
  cardTheme?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'theme-change', theme: string): void
}>()

// ── Drawer open state ───────────────────────────────────────────────

const isOpen = ref<boolean>(props.modelValue)

watch(() => props.modelValue, (v) => {
  isOpen.value = v
})

watch(isOpen, (v) => {
  emit('update:modelValue', v)
})

function onToggleCheckbox(event: Event): void {
  const target = event.target as HTMLInputElement
  isOpen.value = target.checked
}

// ── Theme preview grid ──────────────────────────────────────────────

const THEME_PREVIEWS = [
  { id: 'apple-note',     labelKey: 'themes.appleNote',     color: '#ffffff',              border: '#e5e5ea' },
  { id: 'cyberpunk',      labelKey: 'themes.cyberpunk',     color: '#0c001a',              border: '#00ffff' },
  { id: 'pop-art',        labelKey: 'themes.popArt',        color: '#fff740',              border: '#1a1a2e' },
  { id: 'glassmorphism',  labelKey: 'themes.glassmorphism', color: 'rgba(255,255,255,0.4)', border: '#6c63ff' },
  { id: 'warm-minimal',   labelKey: 'themes.warmMinimal',   color: '#fdfaf5',              border: '#e0d6c8' },
  { id: 'dark-tech',      labelKey: 'themes.darkTech',      color: '#1e1e2e',              border: '#313244' },
] as const

function selectTheme(themeId: string): void {
  emit('theme-change', themeId)
}
</script>
