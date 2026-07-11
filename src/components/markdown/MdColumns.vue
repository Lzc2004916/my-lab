<template>
  <div class="md-columns" :style="columnsStyle">
    <div class="md-column md-column-left" :style="columnStyle">
      <MdRenderer
        v-if="leftBlocks.length > 0"
        :blocks="leftBlocks"
        :highlight-style="highlightStyle"
      />
      <div v-else class="md-column-empty">{{ emptyText }}</div>
    </div>
    <div class="md-column-divider" :style="dividerStyle" />
    <div class="md-column md-column-right" :style="columnStyle">
      <MdRenderer
        v-if="rightBlocks.length > 0"
        :blocks="rightBlocks"
        :highlight-style="highlightStyle"
      />
      <div v-else class="md-column-empty">{{ emptyText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Block, HighlightStyle } from '@/card'

withDefaults(
  defineProps<{
    leftBlocks: Block[]
    rightBlocks: Block[]
    highlightStyle?: HighlightStyle
    emptyText?: string
  }>(),
  {
    highlightStyle: 'underline' as HighlightStyle,
    emptyText: '',
  },
)

const columnsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  margin: '1em 0',
} as const

const columnStyle = {
  minWidth: 0,
  overflow: 'hidden',
} as const

const dividerStyle = {
  display: 'none',
} as const
</script>

<style scoped>
.md-columns {
  word-break: break-word;
  overflow-wrap: break-word;
}

.md-column-empty {
  color: var(--card-text-muted);
  font-style: italic;
  padding: 1rem;
  text-align: center;
  border: 1px dashed var(--card-border);
  border-radius: 8px;
}

/* Responsive: stack columns on narrow screens */
@media (max-width: 640px) {
  .md-columns {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .md-column-divider {
    display: block;
    border-top: 1px solid var(--card-divider-color);
    opacity: 0.4;
  }
}
</style>
