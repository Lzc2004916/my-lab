<template>
  <div class="inline-flex items-center gap-1.5">
    <span
      v-if="label"
      class="text-xs font-medium text-base-content/60 whitespace-nowrap"
    >{{ label }}</span>
    <select
      :value="modelValue"
      class="select select-xs select-bordered text-xs h-6 min-h-0"
      :style="{ fontFamily: selectedFont?.family }"
      @change="onChange"
    >
      <option
        v-for="font in fonts"
        :key="font.id"
        :value="font.id"
        :style="{ fontFamily: font.family }"
      >
        {{ font.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ── Font option type ────────────────────────────────────────────────────────

export interface FontOption {
  id: string
  label: string
  family: string
}

// ── Props ──────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** 当前选中的字体 ID（v-model）。 */
    modelValue: string
    /** 所有可用的字体选项。 */
    fonts: FontOption[]
    /** 选择框前的可选标签。 */
    label?: string
  }>(),
  {
    label: '内容字体',
  },
)

// ── Emits ───────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

// ── Computed ────────────────────────────────────────────────────────────────

const selectedFont = computed(() =>
  props.fonts.find((f) => f.id === props.modelValue),
)

// ── Change handler ──────────────────────────────────────────────────────────

function onChange(e: Event): void {
  const target = e.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>