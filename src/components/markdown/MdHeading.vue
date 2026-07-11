<template>
  <component
    :is="tag"
    class="md-heading theme-aware"
    :style="headingStyle"
  >
    {{ raw }}
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HeadingLevel } from '@/card'
import { HEADING_SIZE_RATIOS } from '@/card/types'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'

const props = withDefaults(
  defineProps<{
    raw: string
    level?: HeadingLevel
  }>(),
  { level: 2 },
)

const ctx = useMarkdownTheme()

const tag = computed(() => `h${Math.min(6, Math.max(1, props.level))}` as const)

const headingStyle = computed(() => {
  const fontSize = ctx ? ctx.headingSize(props.level) : 24
  const ratio = HEADING_SIZE_RATIOS[props.level] ?? 1
  return {
    fontSize: `${fontSize}px`,
    fontWeight: '600',
    color: 'var(--card-text)',
    lineHeight: props.level <= 2 ? 1.3 : props.level === 3 ? 1.4 : 1.5,
    marginBottom: `${Math.max(4, 4 * ratio)}px`,
    marginTop: `${Math.max(6, 10 * ratio)}px`,
  }
})
</script>

<style scoped>
.md-heading {
  word-break: break-word;
  overflow-wrap: break-word;
}
</style>
