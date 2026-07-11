<template>
  <blockquote class="md-quote theme-aware" :class="treatmentClass" :style="quoteStyle">
    <div class="md-quote-bar" :style="barStyle" />
    <div class="md-quote-content">
      <InlineRenderer
        :raw="raw"
        :font-size="ctx?.bodySize.value ?? 16"
        :highlight-style="highlightStyle"
      />
    </div>
  </blockquote>
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

const treatmentClass = computed(() => {
  const t = ctx?.quoteTreatment.value
  if (t === 'callout') return 'quote-callout'
  if (t === 'code') return 'quote-code'
  return 'quote-paper'
})

const quoteStyle = computed(() => ({
  borderRadius: `${ctx?.quoteRadius.value ?? 16}px`,
  backgroundColor: 'var(--card-quote-bg)',
}))

const barStyle = computed(() => ({
  backgroundColor: 'var(--card-quote-bar-color)',
  width: 'var(--card-quote-bar-width)',
}))
</script>

<style scoped>
.md-quote {
  display: flex;
  gap: 0;
  padding: 1rem 1.25rem;
  border: 1px solid transparent;
  margin: 1em 0;
  position: relative;
  word-break: break-word;
  overflow-wrap: break-word;
}

.md-quote-bar {
  flex-shrink: 0;
  border-radius: 3px;
  margin-right: 1rem;
  align-self: stretch;
}

.md-quote-content {
  flex: 1;
  min-width: 0;
}

.quote-callout {
  border-color: var(--card-border);
}

.quote-code {
  font-family: var(--font-mono, 'JetBrains Mono', 'Cascadia Code', monospace);
  background-color: var(--card-accent-soft);
}
</style>
