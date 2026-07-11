<template>
  <hr class="md-divider" :style="dividerStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'

const ctx = useMarkdownTheme()

const dividerStyle = computed(() => ({
  border: 'none',
  borderTop: `1px solid var(--card-divider-color)`,
  margin: ctx
    ? `${ctx.bodySize.value * 0.6}px 0 ${ctx.bodySize.value * 0.6}px 0`
    : '12px 0',
  opacity: '0.6',
}))
</script>

<style scoped>
.md-divider {
  width: 100%;
}
</style>
