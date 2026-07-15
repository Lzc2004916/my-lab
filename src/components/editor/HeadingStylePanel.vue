<template>
  <div class="heading-style-panel px-3 py-2 space-y-2.5">
      <!-- H1-H6 font size sliders -->
      <div
        v-for="level in HEADING_LEVELS"
        :key="level"
        class="flex flex-col gap-1.5 p-2 rounded-lg bg-base-200/30"
      >
        <!-- Row 1: Label + Size input + Reset -->
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

        <!-- Row 2: Size slider -->
        <input
          :id="`heading-size-slider-h${level}`"
          type="range"
          class="range range-xs range-primary"
          :min="rangeFor(level).min"
          :max="rangeFor(level).max"
          :value="effectiveSize(level)"
          @input="onSizeSlider(level, $event)"
        />

        <!-- Row 3: Font color + Stroke color pickers -->
        <div class="flex items-center gap-3">
          <!-- Font color -->
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-base-content/50 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.64 2L4 22h3.34l1.4-4h6.52l1.4 4H20L14.36 2h-4.72zm.84 4.76h.04l2.58 7.44H7.9l2.58-7.44z"/>
            </svg>
            <span class="text-xs text-base-content/60 select-none">颜色</span>
            <div
              class="relative w-7 h-7 rounded-full border-2 border-base-300/80 cursor-pointer shrink-0 transition-shadow hover:shadow-md"
              :class="{ 'ring-2 ring-primary/30': colorValue(level) }"
              :style="{ background: colorValue(level) || 'transparent' }"
              :title="colorValue(level) ? `颜色: ${colorValue(level)}` : '点击设置字体颜色'"
            >
              <div
                v-if="!colorValue(level)"
                class="absolute inset-0 rounded-full overflow-hidden"
                style="background: repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 8px 8px; opacity: 0.5;"
              />
              <div
                v-else
                class="absolute inset-0 rounded-full border-2 border-white/25"
              />
              <input
                type="color"
                :value="colorValue(level) || '#000000'"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                @input="onColorInput(level, $event)"
                @change="onColorChange(level, $event)"
              />
            </div>
            <button
              v-if="colorValue(level)"
              class="btn btn-ghost btn-xs h-6 w-6 min-h-0 p-0 rounded-full text-base-content/40 hover:text-base-content/70 hover:bg-base-300/40"
              title="清除颜色"
              @click="clearColor(level)"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Stroke -->
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-base-content/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="6" />
            </svg>
            <span class="text-xs text-base-content/60 select-none">描边</span>
            <div
              class="relative w-7 h-7 rounded-full border-2 border-base-300/80 cursor-pointer shrink-0 transition-shadow hover:shadow-md"
              :class="{ 'ring-2 ring-accent/30': strokeValue(level) }"
              :style="{ background: strokeValue(level) || 'transparent' }"
              :title="strokeValue(level) ? `描边: ${strokeValue(level)}` : '点击设置描边颜色'"
            >
              <div
                v-if="!strokeValue(level)"
                class="absolute inset-0 rounded-full overflow-hidden"
                style="background: repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 8px 8px; opacity: 0.5;"
              />
              <div
                v-else
                class="absolute inset-0 rounded-full border-2 border-white/25"
              />
              <input
                type="color"
                :value="strokeValue(level) || '#000000'"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                @input="onStrokeInput(level, $event)"
                @change="onStrokeChange(level, $event)"
              />
            </div>
            <button
              v-if="strokeValue(level)"
              class="btn btn-ghost btn-xs h-6 w-6 min-h-0 p-0 rounded-full text-base-content/40 hover:text-base-content/70 hover:bg-base-300/40"
              title="清除描边"
              @click="clearStroke(level)"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Row 3b: Stroke width (only visible when stroke is active) -->
        <div v-if="strokeValue(level)" class="flex items-center gap-2 ml-1">
          <span class="text-xs text-base-content/50 select-none">描边宽度</span>
          <input
            type="range"
            class="range range-sm range-accent flex-1"
            min="1"
            max="6"
            step="1"
            :value="strokeWidthValue(level)"
            @input="onStrokeWidthInput(level, $event)"
            title="描边宽度"
          />
          <span class="text-xs font-medium text-base-content/70 w-7 text-right tabular-nums">{{ strokeWidthValue(level) }}px</span>
        </div>
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
</template>

<script setup lang="ts">
import { type Ref } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { HEADING_SIZE_RANGES, DEFAULT_STROKE_WIDTH } from '@/card'

// ── Constants ────────────────────────────────────────────────────────────

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

// ── State ────────────────────────────────────────────────────────────────

const settings = useSettings()

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

/** 标题级别 → 字体颜色 Ref 的映射。 */
const colorRefs: Record<number, Ref<string | null>> = {
  1: settings.headingH1Color,
  2: settings.headingH2Color,
  3: settings.headingH3Color,
  4: settings.headingH4Color,
  5: settings.headingH5Color,
  6: settings.headingH6Color,
}

/** 标题级别 → 描边颜色 Ref 的映射。 */
const strokeRefs: Record<number, Ref<string | null>> = {
  1: settings.headingH1Stroke,
  2: settings.headingH2Stroke,
  3: settings.headingH3Stroke,
  4: settings.headingH4Stroke,
  5: settings.headingH5Stroke,
  6: settings.headingH6Stroke,
}

/** 标题级别 → 描边宽度 Ref 的映射。 */
const strokeWidthRefs: Record<number, Ref<number | null>> = {
  1: settings.headingH1StrokeWidth,
  2: settings.headingH2StrokeWidth,
  3: settings.headingH3StrokeWidth,
  4: settings.headingH4StrokeWidth,
  5: settings.headingH5StrokeWidth,
  6: settings.headingH6StrokeWidth,
}

// ── Font size helpers ────────────────────────────────────────────────────

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

// ── Color helpers ───────────────────────────────────────────────────────

function colorValue(level: number): string | null {
  return colorRefs[level]?.value ?? null
}

function onColorInput(level: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const ref = colorRefs[level]
  if (ref) ref.value = target.value
}

function onColorChange(_level: number, _event: Event): void {
  // Persisted via watcher in useSettings
}

function clearColor(level: number): void {
  const ref = colorRefs[level]
  if (ref) ref.value = null
}

// ── Stroke helpers ───────────────────────────────────────────────────────

function strokeValue(level: number): string | null {
  return strokeRefs[level]?.value ?? null
}

function onStrokeInput(level: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const ref = strokeRefs[level]
  if (ref) ref.value = target.value
}

function onStrokeChange(_level: number, _event: Event): void {
  // Persisted via watcher in useSettings
}

function clearStroke(level: number): void {
  const ref = strokeRefs[level]
  if (ref) ref.value = null
}

// ── Stroke width helpers ─────────────────────────────────────────────────

function strokeWidthValue(level: number): number {
  const val = strokeWidthRefs[level]?.value
  if (typeof val === 'number' && val > 0) return val
  return DEFAULT_STROKE_WIDTH
}

function onStrokeWidthInput(level: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const val = Number(target.value)
  if (Number.isFinite(val)) {
    const ref = strokeWidthRefs[level]
    if (ref) ref.value = val
  }
}

// ── Reset ────────────────────────────────────────────────────────────────

function resetLevel(level: number): void {
  const sizeRef = sizeRefs[level]
  if (sizeRef) sizeRef.value = null
  const colorRef = colorRefs[level]
  if (colorRef) colorRef.value = null
  const strokeRef = strokeRefs[level]
  if (strokeRef) strokeRef.value = null
  const swRef = strokeWidthRefs[level]
  if (swRef) swRef.value = null
}

function resetAll(): void {
  for (const level of HEADING_LEVELS) {
    const sizeRef = sizeRefs[level]
    if (sizeRef) sizeRef.value = null
    const colorRef = colorRefs[level]
    if (colorRef) colorRef.value = null
    const strokeRef = strokeRefs[level]
    if (strokeRef) strokeRef.value = null
    const swRef = strokeWidthRefs[level]
    if (swRef) swRef.value = null
  }
  settings.headingH1Align.value = 'left'
}
</script>

<style scoped>
.heading-style-panel {
  /* Clean embedded layout — no outer border/bg (container provides framing) */
}

/* Font-size slider: keep compact */
.heading-style-panel :deep(.range-primary.range-xs) {
  height: 0.375rem;
}

/* Stroke-width slider: comfortable touch target */
.heading-style-panel :deep(.range-accent.range-sm) {
  height: 0.75rem;
}
</style>
