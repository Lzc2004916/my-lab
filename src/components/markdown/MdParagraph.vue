<template>
  <p class="md-paragraph" :style="paragraphStyle">
    <InlineRenderer
      :raw="raw"
      :font-size="ctx?.bodySize.value ?? 16"
      :highlight-style="highlightStyle"
    />
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HighlightStyle } from '@/card'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'
import { InlineRenderer } from './InlineRenderer'

withDefaults(
  defineProps<{
    raw: string
    highlightStyle?: HighlightStyle
  }>(),
  { highlightStyle: 'underline' as HighlightStyle },
)

const ctx = useMarkdownTheme()

const paragraphStyle = computed(() => {
  const bodySize = ctx?.bodySize.value ?? 16
  const lineHeight = ctx?.lineHeight.value ?? 1.8
  return {
    fontSize: `${bodySize}px`,
    lineHeight: String(lineHeight),
    color: 'var(--card-text)',
    marginBottom: `calc(${bodySize}px * 0.8)`,
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const,
  }
})
</script>

<style scoped>
.md-paragraph {
  word-break: break-word;
  overflow-wrap: break-word;
}
</style>
