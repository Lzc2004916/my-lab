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
          <h2 class="text-lg font-bold tracking-tight">设置</h2>
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
              <span class="label-text font-medium">主题预览</span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="theme in themePreviews"
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
                <span class="text-sm text-black/70 truncate w-full text-center">
                  {{ theme.name }}
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
import { ref, watch, computed } from 'vue'
import { THEMES } from '@/card/themes'

// ── Props / Emits ───────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
  /** 当前激活的卡片主题 ID（用于预览网格高亮）。 */
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

const themePreviews = computed(() =>
  THEMES.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.palette.page,
    border: t.palette.border,
  })),
)

function selectTheme(themeId: string): void {
  emit('theme-change', themeId)
}
</script>