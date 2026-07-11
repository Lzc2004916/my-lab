<template>
  <div class="md-renderer" :class="{ 'theme-transitioning': ctx?.isTransitioning.value }">
    <template v-if="blocks.length === 0">
      <p class="md-empty" :style="emptyStyle">在左侧输入 Markdown 内容后，这里会实时渲染。</p>
    </template>

    <template v-else>
      <template v-for="(block, idx) in blocks" :key="idx">
        <!-- ── Heading ──────────────────────────────────────────── -->
        <MdHeading
          v-if="block.kind === 'subheading'"
          :raw="block.raw"
          :level="block.headingLevel ?? 2"
        />

        <!-- ── Body paragraph ───────────────────────────────────── -->
        <MdParagraph
          v-else-if="block.kind === 'body'"
          :raw="block.raw"
          :highlight-style="highlightStyle"
        />

        <!-- ── Quote ────────────────────────────────────────────── -->
        <MdQuote
          v-else-if="block.kind === 'quote'"
          :raw="block.raw"
          :highlight-style="highlightStyle"
        />

        <!-- ── Divider ──────────────────────────────────────────── -->
        <MdDivider
          v-else-if="block.kind === 'divider'"
        />

        <!-- ── Code block ───────────────────────────────────────── -->
        <MdCodeBlock
          v-else-if="block.kind === 'code'"
          :language="block.language"
          :code="block.code"
          :show-line-numbers="showLineNumbers"
        />

        <!-- ── Table ────────────────────────────────────────────── -->
        <MdTable
          v-else-if="block.kind === 'table'"
          :headers="block.headers"
          :alignments="block.alignments"
          :rows="block.rows"
        />

        <!-- ── Column container ─────────────────────────────────── -->
        <MdColumns
          v-else-if="block.kind === 'columnContainer'"
          :left-blocks="block.leftBlocks"
          :right-blocks="block.rightBlocks"
          :highlight-style="highlightStyle"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { Block, HighlightStyle } from '@/card'
import { parseInputBlocks } from '@/card/layout'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'
import MdHeading from './MdHeading.vue'
import MdParagraph from './MdParagraph.vue'
import MdQuote from './MdQuote.vue'
import MdDivider from './MdDivider.vue'
import MdCodeBlock from './MdCodeBlock.vue'
import MdTable from './MdTable.vue'
import MdColumns from './MdColumns.vue'

// ── Props ──────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** Raw markdown source text. When empty, renders the parseInputBlocks auto-generated source. */
    source?: string
    /** Pre-parsed blocks (mutually exclusive with source). When provided, skips parsing. */
    blocks?: Block[]
    /** Highlight style applied to ==marked== text. */
    highlightStyle?: HighlightStyle
    /** Show line numbers on code blocks. */
    showLineNumbers?: boolean
    /** Compact mode reduces vertical spacing. */
    compact?: boolean
  }>(),
  {
    source: '',
    blocks: undefined,
    highlightStyle: 'underline' as HighlightStyle,
    showLineNumbers: true,
    compact: false,
  },
)

// ── Theme ──────────────────────────────────────────────────────────────────

const ctx = useMarkdownTheme()

// ── Blocks ─────────────────────────────────────────────────────────────────
// Use shallowRef to avoid deep reactivity tracking on the parsed block tree.
// Blocks are replaced wholesale (never mutated in place), so shallowRef
// gives correct rendering with zero overhead on nested block properties.

const parsedBlocks = shallowRef<Block[]>([])

/** Re-parse only when the input source or pre-parsed blocks change. */
const sourceKey = computed(() => props.blocks ? `blocks:${props.blocks.length}` : props.source)

watch(
  sourceKey,
  () => {
    if (props.blocks && props.blocks.length > 0) {
      parsedBlocks.value = props.blocks
    } else if (props.source && props.source.trim()) {
      parsedBlocks.value = parseInputBlocks(props.source)
    } else {
      parsedBlocks.value = []
    }
  },
  { immediate: true },
)

/** Blocks to render — always reads from the shallowRef. */
const blocks = computed<Block[]>(() => parsedBlocks.value)

// ── Empty state ────────────────────────────────────────────────────────────

const emptyStyle = computed(() => ({
  color: 'var(--card-text-muted)',
  fontSize: ctx ? `${ctx.bodySize.value}px` : '16px',
  textAlign: 'center' as const,
  padding: '2rem 1rem',
}))
</script>

<style scoped>
.md-renderer {
  padding: 1.5rem;
  word-break: break-word;
  overflow-wrap: break-word;
  background-color: var(--card-page);
  color: var(--card-text);
  border-radius: var(--card-radius, 12px);
  box-shadow: var(--card-preview-shadow, none);
}

.md-renderer.compact {
  padding: 0.75rem;
}

.md-empty {
  border: 2px dashed var(--card-border);
  border-radius: 8px;
  font-style: italic;
}
</style>
