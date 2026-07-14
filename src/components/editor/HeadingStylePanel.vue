<template>
  <div class="heading-style-panel">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2.5 bg-base-200/70 border-b border-base-300/60">
      <span class="text-sm font-medium">Markdown 样式</span>
      <button
        class="btn btn-ghost btn-xs h-6 min-h-0 px-1"
        @click="collapsed = !collapsed"
        aria-label="折叠面板"
      >
        <svg
          class="w-3.5 h-3.5 transition-transform duration-200"
          :class="{ 'rotate-180': !collapsed }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- Panel body -->
    <div v-show="!collapsed" class="px-3 py-2 space-y-2.5 overflow-y-auto max-h-[55vh]">
      <!-- H1-H6 font size sliders -->
      <div
        v-for="level in HEADING_LEVELS"
        :key="level"
        class="flex flex-col gap-1"
      >
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-base-content/80 select-none">
            H{{ level }}
          </label>
          <div class="flex items-center gap-1">
            <input
              :id="`heading-size-input-h${level}`"
              type="number"
              class="input input-xs input-bordered w-14 h-6 min-h-0 text-xs text-center px-1"
              :min="rangeFor(level).min"
              :max="rangeFor(level).max"
              :value="sizeValue(level)"
              @change="onSizeInput(level, $event)"
              @blur="onSizeBlur(level, $event)"
            />
            <span class="text-[10px] text-base-content/50 w-4">px</span>
            <button
              class="btn btn-ghost btn-xs h-5 min-h-0 w-5 p-0 text-base-content/30 hover:text-base-content/70"
              :aria-label="`重置 H${level}`"
              title="重置为默认"
              @click="resetLevel(level)"
            >
              <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
          </div>
        </div>
        <input
          :id="`heading-size-slider-h${level}`"
          type="range"
          class="range range-xs range-primary"
          :min="rangeFor(level).min"
          :max="rangeFor(level).max"
          :value="effectiveSize(level)"
          @input="onSizeSlider(level, $event)"
        />
      </div>

      <!-- Separator -->
      <div class="border-t border-base-300/40 pt-2.5 mt-2.5">
        <!-- H1 Alignment -->
        <div class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-base-content/80 select-none">H1 对齐方式</span>
          <div class="join w-full">
            <button
              class="btn btn-xs btn-outline join-item flex-1 h-7 min-h-0 text-xs"
              :class="{ 'btn-active btn-primary': settings.headingH1Align.value === 'left' }"
              @click="settings.headingH1Align.value = 'left'"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="15" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="15" y2="18" />
              </svg>
            </button>
            <button
              class="btn btn-xs btn-outline join-item flex-1 h-7 min-h-0 text-xs"
              :class="{ 'btn-active btn-primary': settings.headingH1Align.value === 'center' }"
              @click="settings.headingH1Align.value = 'center'"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="6" x2="17" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="7" y1="18" x2="17" y2="18" />
              </svg>
            </button>
            <button
              class="btn btn-xs btn-outline join-item flex-1 h-7 min-h-0 text-xs"
              :class="{ 'btn-active btn-primary': settings.headingH1Align.value === 'right' }"
              @click="settings.headingH1Align.value = 'right'"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="9" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="9" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      <!-- Reset all -->
      <div class="pt-1.5">
        <button
          class="btn btn-ghost btn-xs h-6 min-h-0 text-xs text-base-content/60 w-full"
          @click="resetAll"
        >
          重置全部
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { HEADING_SIZE_RANGES } from '@/card'

// ── Constants ────────────────────────────────────────────────────────────

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

// ── State ────────────────────────────────────────────────────────────────

const settings = useSettings()
const collapsed = ref(false)

/**
 * 标题级别 → 字体大小 Ref 的映射。
 * 提供类型安全的动态级别访问，避免运行时 key 拼接。
 */
const sizeRefs: Record<number, Ref<number | null>> = {
  1: settings.headingH1Size,
  2: settings.headingH2Size,
  3: settings.headingH3Size,
  4: settings.headingH4Size,
  5: settings.headingH5Size,
  6: settings.headingH6Size,
}

// ── Helpers ──────────────────────────────────────────────────────────────

function rangeFor(level: number) {
  return HEADING_SIZE_RANGES[level] ?? { min: 9, max: 24, default: 15 }
}

/** 滑块有效值：覆盖值存在时返回覆盖值，否则回退到范围默认值。 */
function effectiveSize(level: number): number {
  const val = sizeRefs[level]?.value
  if (typeof val === 'number' && val > 0) return val
  return rangeFor(level).default
}

/** 数值输入框的值：覆盖值或空字符串。 */
function sizeValue(level: number): number | string {
  const val = sizeRefs[level]?.value
  return typeof val === 'number' ? val : ''
}

function onSizeSlider(level: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const val = Number(target.value)
  if (Number.isFinite(val) && val > 0) {
    const ref = sizeRefs[level]
    if (ref) ref.value = val
  }
}

function onSizeInput(level: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    // 清空 → 恢复主题默认
    const ref = sizeRefs[level]
    if (ref) ref.value = null
    return
  }
  const val = Number(raw)
  if (Number.isFinite(val)) {
    const ref = sizeRefs[level]
    if (ref) ref.value = Math.max(1, val)
  }
}

function onSizeBlur(level: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') return
  const val = Number(raw)
  if (!Number.isFinite(val) || val <= 0) {
    const ref = sizeRefs[level]
    if (ref) ref.value = null
    return
  }
  const range = rangeFor(level)
  const clamped = Math.max(range.min, Math.min(range.max, val))
  const ref = sizeRefs[level]
  if (ref) ref.value = clamped
}

function resetLevel(level: number): void {
  const ref = sizeRefs[level]
  if (ref) ref.value = null
}

function resetAll(): void {
  for (const level of HEADING_LEVELS) {
    const ref = sizeRefs[level]
    if (ref) ref.value = null
  }
  settings.headingH1Align.value = 'left'
}
</script>

<style scoped>
.heading-style-panel {
  /* Clean embedded layout — no outer border/bg (container provides framing) */
}

/* DaisyUI range overrides for tighter fit */
.heading-style-panel :deep(.range) {
  height: 0.5rem;
}

.heading-style-panel :deep(.range-xs) {
  height: 0.375rem;
}
</style>
