<template>
  <span
    class="loading-spinner"
    :class="[
      inline ? 'inline-flex' : 'flex',
      size === 'sm' ? 'gap-1.5 text-xs' : size === 'lg' ? 'gap-3 text-sm' : 'gap-2 text-xs',
    ]"
    role="status"
    :aria-label="variant === 'progress' ? `Exporting: ${progress}%` : 'Loading'"
  >
    <!-- Spinner variant -->
    <span v-if="variant === 'spinner'" class="loading loading-spinner" :class="spinnerSizeClass"></span>

    <!-- Progress variant -->
    <template v-else-if="variant === 'progress'">
      <progress
        class="progress progress-primary"
        :class="progressSizeClass"
        :value="progress"
        max="100"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      ></progress>
      <span v-if="showProgressLabel" class="tabular-nums whitespace-nowrap text-base-content/70">
        {{ progress }}%
      </span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'spinner' | 'progress'
    size?: 'sm' | 'md' | 'lg'
    progress?: number
    showProgressLabel?: boolean
    inline?: boolean
  }>(),
  {
    variant: 'spinner',
    size: 'md',
    progress: 0,
    showProgressLabel: false,
    inline: false,
  },
)

const spinnerSizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'loading-sm'
    case 'lg': return 'loading-lg'
    default:  return ''
  }
})

const progressSizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-20 h-2'
    case 'lg': return 'w-40 h-4'
    default:  return 'w-28 h-3'
  }
})
</script>
