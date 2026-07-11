<template>
  <div class="md-table-wrapper" :style="wrapperStyle">
    <table class="md-table" :style="tableStyle">
      <thead v-if="headers.length > 0">
        <tr>
          <th
            v-for="(header, idx) in headers"
            :key="idx"
            :style="cellStyle(alignments[idx] ?? 'left', true)"
          >
            <InlineRenderer
              :raw="header"
              :font-size="ctx?.bodySize.value ?? 16"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td
            v-for="(cell, ci) in row"
            :key="ci"
            :style="cellStyle(alignments[ci] ?? 'left', false)"
          >
            <InlineRenderer
              :raw="cell"
              :font-size="ctx?.bodySize.value ?? 16"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'
import { InlineRenderer } from './InlineRenderer'

defineProps<{
  headers: string[]
  alignments: ('left' | 'center' | 'right')[]
  rows: string[][]
}>()

const ctx = useMarkdownTheme()

const wrapperStyle = computed(() => ({
  margin: '1em 0',
  borderRadius: 'var(--card-table-radius)',
  overflow: 'hidden',
  border: '1px solid var(--card-table-border-color)',
}))

const tableStyle = computed(() => ({
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: ctx ? `${Math.round(ctx.bodySize.value * 0.9)}px` : '14px',
}))

function cellStyle(align: string, isHeader: boolean): Record<string, string> {
  const s: Record<string, string> = {
    padding: '8px 12px',
    textAlign: align,
    borderBottom: '1px solid var(--card-table-border-color)',
  }
  if (isHeader) {
    s.backgroundColor = 'var(--card-table-header-bg)'
    s.fontWeight = '600'
    s.color = 'var(--card-text)'
  }
  return s
}
</script>

<style scoped>
.md-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.md-table {
  min-width: 100%;
}

.md-table th,
.md-table td {
  white-space: nowrap;
}

.md-table th:last-child,
.md-table td:last-child {
  border-right: none;
}
</style>
