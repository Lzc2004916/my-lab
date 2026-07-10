<template>
  <div class="gradient-picker">
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input
        :checked="modelValue?.enabled ?? false"
        type="checkbox"
        class="checkbox checkbox-sm"
        @change="toggleEnabled"
      />
      <span class="text-xs text-base-content/50 whitespace-nowrap">渐变背景</span>
    </label>

    <Transition name="fade-slide">
      <div v-if="modelValue?.enabled" class="gradient-controls">
        <!-- Color 1 swatch -->
        <div class="color-swatch" :style="{ background: color1 }">
          <input
            type="color"
            :value="color1"
            class="color-input"
            @input="updateColor1"
          />
        </div>

        <!-- Gradient preview bar (live) -->
        <div
          class="gradient-bar"
          :style="{ background: gradientCSS }"
          title="渐变预览"
        ></div>

        <!-- Color 2 swatch -->
        <div class="color-swatch" :style="{ background: color2 }">
          <input
            type="color"
            :value="color2"
            class="color-input"
            @input="updateColor2"
          />
        </div>

        <!-- Angle control -->
        <div class="angle-control">
          <input
            type="range"
            min="0"
            max="360"
            :value="angle"
            class="angle-slider"
            title="渐变角度"
            @input="updateAngle"
          />
          <span class="angle-value">{{ angle }}°</span>
        </div>

        <!-- Remove/reset button -->
        <button class="btn btn-ghost btn-xs h-6 w-6 p-0" title="重置" @click="resetColors">
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

/** Live CSS gradient matching the rendered card overlay angle. */
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
.gradient-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.gradient-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.color-swatch {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid oklch(var(--bc) / 0.18);
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.color-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 2px oklch(var(--bc) / 0.1);
}

.color-input {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  opacity: 0;
  cursor: pointer;
}

.gradient-bar {
  width: 40px;
  height: 10px;
  border-radius: 5px;
  border: 1px solid oklch(var(--bc) / 0.12);
  flex-shrink: 0;
}

.angle-control {
  display: flex;
  align-items: center;
  gap: 3px;
}

.angle-slider {
  width: 48px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: oklch(var(--bc) / 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.angle-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: oklch(var(--p));
  cursor: pointer;
}

.angle-value {
  font-size: 9px;
  color: oklch(var(--bc) / 0.45);
  width: 22px;
  text-align: right;
  tabular-nums: 1;
}

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
