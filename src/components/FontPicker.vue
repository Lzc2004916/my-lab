<template>
  <div class="inline-flex items-center gap-1.5">
    <span
      v-if="label"
      class="text-xs text-base-content/50 whitespace-nowrap"
    >{{ label }}</span>
    <select
      :value="modelValue"
      class="select select-sm select-bordered text-xs h-7 min-h-0"
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
    /** Currently selected font ID (v-model). */
    modelValue: string
    /** All available font options. */
    fonts: FontOption[]
    /** Optional label before the select. */
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
