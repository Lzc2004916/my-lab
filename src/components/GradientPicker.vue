<template>
  <div class="flex items-center gap-1.5 flex-wrap">
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input
        :checked="modelValue?.enabled ?? false"
        type="checkbox"
        class="checkbox checkbox-xs checkbox-primary"
        @change="toggleEnabled"
      />
      <span class="text-xs font-medium text-base-content/60 whitespace-nowrap">渐变背景</span>
    </label>

    <Transition name="fade-slide">
      <div v-if="modelValue?.enabled" class="flex items-center gap-1 flex-wrap">
        <!-- Color 1 swatch -->
        <div
          class="relative w-5 h-5 rounded-full border border-base-content/20 cursor-pointer overflow-hidden shrink-0 transition-transform duration-150 hover:scale-115 hover:shadow-[0_0_0_2px_var(--fallback-bc,oklch(0_0_0/0.1))]"
          :style="{ background: color1 }"
        >
          <input
            type="color"
            :value="color1"
            class="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] opacity-0 cursor-pointer"
            @input="updateColor1"
          />
        </div>

        <!-- Gradient preview bar (live) -->
        <div
          class="w-10 h-2.5 rounded-full border border-base-content/12 shrink-0"
          :style="{ background: gradientCSS }"
          title="渐变预览"
        ></div>

        <!-- Color 2 swatch -->
        <div
          class="relative w-5 h-5 rounded-full border border-base-content/20 cursor-pointer overflow-hidden shrink-0 transition-transform duration-150 hover:scale-115 hover:shadow-[0_0_0_2px_var(--fallback-bc,oklch(0_0_0/0.1))]"
          :style="{ background: color2 }"
        >
          <input
            type="color"
            :value="color2"
            class="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] opacity-0 cursor-pointer"
            @input="updateColor2"
          />
        </div>

        <!-- Angle control -->
        <div class="flex items-center gap-[3px]">
          <input
            type="range"
            min="0"
            max="360"
            :value="angle"
            class="range range-xs range-primary w-12"
            title="渐变角度"
            @input="updateAngle"
          />
          <span class="text-2xs text-base-content/50 w-[22px] text-right tabular-nums">{{ angle }}°</span>
        </div>

        <!-- Reset button -->
        <button
          class="btn btn-ghost btn-xs h-6 w-6 p-0 min-h-0"
          title="重置"
          @click="resetColors"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GradientConfig } from '@/card'

const props = withDefaults(
  defineProps<{
    modelValue: GradientConfig
  }>(),
  {
    modelValue: () => ({
      enabled: false,
      color1: '#6c5ce7',
      color2: '#a29bfe',
      angle: 135,
    }),
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: GradientConfig): void
}>()

const color1 = computed(() => props.modelValue?.color1 ?? '#6c5ce7')
const color2 = computed(() => props.modelValue?.color2 ?? '#a29bfe')
const angle = computed(() => props.modelValue?.angle ?? 135)

/** 与渲染的卡片叠加层角度匹配的实时 CSS 渐变。 */
const gradientCSS = computed(
  () => `linear-gradient(${angle.value}deg, ${color1.value}, ${color2.value})`,
)

function toggleEnabled(e: Event): void {
  const checked = (e.target as HTMLInputElement).checked
  emit('update:modelValue', { ...props.modelValue, enabled: checked })
}

function updateColor1(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', { ...props.modelValue, color1: value })
}

function updateColor2(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', { ...props.modelValue, color2: value })
}

function updateAngle(e: Event): void {
  const value = parseInt((e.target as HTMLInputElement).value, 10)
  emit('update:modelValue', { ...props.modelValue, angle: value })
}

function resetColors(): void {
  emit('update:modelValue', { enabled: false, color1: '#6c5ce7', color2: '#a29bfe', angle: 135 })
}
</script>

<style scoped>
/* ── Vue transition for expand/collapse ─────────────────────────────── */

.fade-slide-enter-active {
  transition: all 0.2s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.15s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>