<template>
  <div class="preview-root">
    <!-- ═══════════════════════════════════════════════════════════════════
         Scroll mode — multi-page, each page is a <canvas>
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="useScroll"
      ref="scrollRef"
      class="scroll-container"
      @scroll="onScroll"
    >
      <canvas
        v-for="(canvas, idx) in canvases"
        :key="idx"
        :ref="(el) => setCanvasRef(el, idx)"
        class="card-canvas"
        :width="canvas.width"
        :height="canvas.height"
      ></canvas>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Single card mode (1 page or no split constraint)
         ═══════════════════════════════════════════════════════════════ -->
    <canvas
      v-else-if="canvases.length > 0"
      ref="singleCanvasRef"
      class="card-canvas"
      :width="canvases[0].width"
      :height="canvases[0].height"
    ></canvas>

    <!-- Loading / empty state -->
    <div
      v-else
      class="flex items-center justify-center"
      :style="{ width: canvasStyle.width, height: canvasStyle.height }"
    >
      <LoadingSpinner
        variant="spinner"
        size="md"
        :text="t('loading.rendering')"
      />
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Page indicator
         ═══════════════════════════════════════════════════════════════ -->
    <div v-if="canvases.length > 1" class="page-indicator">
      <span class="text-sm tabular-nums text-base-content/70">
        {{ currentPage + 1 }} / {{ canvases.length }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  CardPage,
  HighlightStyle,
  FooterRightMode,
  CardCornerMode,
  TypographySettings,
} from './types'
import { PAGE_WIDTH, PAGE_HEIGHT } from './types'
import { renderAllPages } from './engine'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { t } = useI18n()

// ── Props ───────────────────────────────────────────────────────────────

interface Props {
  /** Markdown source text */
  source: string
  /** Optional override title */
  manualTitle?: string
  /** 0-based index of the active page */
  currentPage?: number
  /** Theme ID (e.g. 'moss-paper') */
  themeId?: string
  /** Typography settings */
  typography?: TypographySettings
  /** Highlight style */
  highlightStyle?: HighlightStyle
  /** Footer left text */
  footerLeft?: string
  /** Footer right display mode */
  footerRightMode?: FooterRightMode
  /** Whether footer is visible */
  footerEnabled?: boolean
  /** Card corner mode */
  cardCornerMode?: CardCornerMode
  /** Preview scale factor (0-1, default 0.95) */
  previewScale?: number
}

const props = withDefaults(defineProps<Props>(), {
  manualTitle: '',
  currentPage: 0,
  themeId: 'moss-paper',
  typography: () => ({
    titleSize: 75,
    bodySize: 30,
    lineHeight: 1.84,
    titleFontMode: 'serif' as const,
    subheadingStyle: 'large' as const,
    titleCustom: { color: '', alignment: 'left' as const, fontWeight: 0, letterSpacing: 0 },
  }),
  highlightStyle: 'underline' as HighlightStyle,
  footerLeft: '',
  footerRightMode: 'page' as FooterRightMode,
  footerEnabled: true,
  cardCornerMode: 'square' as CardCornerMode,
  previewScale: 0.95,
})

// ── Emits ────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'pagesChange', pages: CardPage[]): void
}>()

// ── State ────────────────────────────────────────────────────────────────

const canvases = ref<HTMLCanvasElement[]>([])
const pages = ref<CardPage[]>([])
const renderKey = ref(0)

const scrollRef = ref<HTMLDivElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRefs = ref<Record<number, HTMLCanvasElement | null>>({})
const activeIdx = ref(props.currentPage)

// ── Computed ─────────────────────────────────────────────────────────────

const useScroll = computed(() => canvases.value.length > 1)

const canvasStyle = computed(() => {
  const scale = props.previewScale
  return {
    width: `${Math.round(PAGE_WIDTH * scale)}px`,
    height: `${Math.round(PAGE_HEIGHT * scale)}px`,
  }
})

// ── Render logic ─────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 360

function scheduleRender(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doRender, DEBOUNCE_MS)
}

function doRender(): void {
  try {
    const result = renderAllPages({
      source: props.source,
      manualTitle: props.manualTitle,
      themeId: props.themeId,
      typography: props.typography,
      highlightStyle: props.highlightStyle,
      footerLeft: props.footerLeft,
      footerRightMode: props.footerRightMode,
      footerEnabled: props.footerEnabled,
      cardCornerMode: props.cardCornerMode,
    })

    pages.value = result.pages
    canvases.value = result.canvases
    renderKey.value++

    emit('pagesChange', result.pages)

    // Clamp current page
    if (props.currentPage >= result.canvases.length && result.canvases.length > 0) {
      emit('update:currentPage', Math.max(0, result.canvases.length - 1))
    }
  } catch (e) {
    console.warn('[CardPreview] Render failed:', e)
  }
}

// Watch all render-driving props
watch(
  () => [
    props.source,
    props.manualTitle,
    props.themeId,
    props.typography,
    props.highlightStyle,
    props.footerLeft,
    props.footerRightMode,
    props.footerEnabled,
    props.cardCornerMode,
  ] as const,
  scheduleRender,
  { immediate: true, deep: true },
)

// ── After canvases update, draw them into the DOM canvas elements ────────

watch(
  () => [canvases.value, renderKey.value] as const,
  async () => {
    await nextTick()

    // Draw into single canvas
    if (!useScroll.value && singleCanvasRef.value && canvases.value.length > 0) {
      const src = canvases.value[0]!
      const dest = singleCanvasRef.value
      dest.width = src.width
      dest.height = src.height
      const dCtx = dest.getContext('2d')
      if (dCtx) dCtx.drawImage(src, 0, 0)
    }

    // Draw into scroll canvases
    if (useScroll.value) {
      const refs = Object.values(canvasRefs.value).filter(Boolean) as HTMLCanvasElement[]
      for (let i = 0; i < Math.min(refs.length, canvases.value.length); i++) {
        const src = canvases.value[i]!
        const dest = refs[i]!
        dest.width = src.width
        dest.height = src.height
        const dCtx = dest.getContext('2d')
        if (dCtx) dCtx.drawImage(src, 0, 0)
      }
    }
  },
  { immediate: true },
)

// ── Scroll sync ──────────────────────────────────────────────────────────

function setCanvasRef(el: unknown, idx: number): void {
  if (el) canvasRefs.value[idx] = el as HTMLCanvasElement
}

const CARD_GAP = 24
let isProgrammaticScroll = false
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function onScroll(): void {
  if (isProgrammaticScroll) return
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    const container = scrollRef.value
    if (!container) return
    const firstCanvas = container.querySelector('canvas')
    const cardHeight = firstCanvas?.offsetHeight ?? Math.round(PAGE_HEIGHT * props.previewScale)
    if (cardHeight <= 0) return
    const pageHeight = cardHeight + CARD_GAP
    const idx = Math.round(container.scrollTop / pageHeight)
    const clamped = Math.max(0, Math.min(canvases.value.length - 1, idx))
    if (clamped !== activeIdx.value) {
      activeIdx.value = clamped
      emit('update:currentPage', clamped)
    }
  }, 120)
}

watch(
  () => props.currentPage,
  (page) => {
    const container = scrollRef.value
    if (!container || !useScroll.value) return
    if (page === activeIdx.value) return
    const firstCanvas = container.querySelector('canvas')
    const cardH = firstCanvas?.offsetHeight ?? Math.round(PAGE_HEIGHT * props.previewScale)
    const pageH = cardH + CARD_GAP
    const targetTop = page * pageH
    isProgrammaticScroll = true
    container.scrollTo({ top: Math.max(0, targetTop), behavior: 'instant' })
    setTimeout(() => {
      isProgrammaticScroll = false
      activeIdx.value = page
    }, 350)
  },
)

// ── Cleanup ──────────────────────────────────────────────────────────────

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (scrollTimer) clearTimeout(scrollTimer)
})

// ── Expose ───────────────────────────────────────────────────────────────

defineExpose({
  /** Get the current page's source canvas (for export purposes). */
  getActiveCanvas: (): HTMLCanvasElement | null => {
    return canvases.value[props.currentPage] ?? null
  },
  /** Get all rendered canvases. */
  getAllCanvases: (): HTMLCanvasElement[] => {
    return canvases.value
  },
  /** Get the current page count. */
  getPageCount: (): number => {
    return pages.value.length
  },
  /** Force immediate re-render. */
  forceRender: () => {
    doRender()
  },
})
</script>

<style scoped>
.preview-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  min-height: 200px;
}

/* Theme-adaptive preview root background */
html[data-theme='dark'] .preview-root {
  background-color: oklch(0.18 0.02 260);
}
html[data-theme='light'] .preview-root {
  background-color: oklch(0.95 0.01 260);
}
html[data-theme='cupcake'] .preview-root {
  background-color: oklch(0.93 0.02 300);
}
html[data-theme='cyberpunk'] .preview-root {
  background-color: oklch(0.12 0.06 320);
}

/* Card canvas styling */
.card-canvas {
  display: block;
  border-radius: 0;
  box-shadow: none;
  flex-shrink: 0;
  width: 100%;
  height: auto;
}

/* Scroll container */
.scroll-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  padding: 0.5rem 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Page indicator */
.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
