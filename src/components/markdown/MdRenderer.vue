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
    /** 原始 markdown 源文本。为空时，渲染 parseInputBlocks 自动生成的源。 */
    source?: string
    /** 预解析的块（与 source 互斥）。提供时跳过解析。 */
    blocks?: Block[]
    /** 应用于 ==标记== 文本的高亮样式。 */
    highlightStyle?: HighlightStyle
    /** 在代码块上显示行号。 */
    showLineNumbers?: boolean
    /** 紧凑模式减少垂直间距。 */
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
// 使用 shallowRef 避免对解析后的块树进行深度响应式跟踪。
// 块是整体替换的（从不原地修改），所以 shallowRef
// gives correct rendering with zero overhead on nested block properties.

const parsedBlocks = shallowRef<Block[]>([])

/** 仅在输入源或预解析块变更时重新解析。 */
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

/** 要渲染的块 — 始终从 shallowRef 读取。 */
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

  /* 响应式标题缩放因子 — 子标题组件通过 var() 引用 */
  --heading-responsive-scale: 1.0;
}

/* 移动端（< 640px）：标题缩小 22% */
@media (max-width: 639px) {
  .md-renderer {
    --heading-responsive-scale: 0.78;
  }
}

/* 平板端（640px - 1024px）：标题缩小 10% */
@media (min-width: 640px) and (max-width: 1024px) {
  .md-renderer {
    --heading-responsive-scale: 0.90;
  }
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