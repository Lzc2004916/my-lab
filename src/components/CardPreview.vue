<template>
  <div
    ref="containerRef"
    class="flex flex-col items-center justify-center gap-4 w-full min-h-full p-4 sm:p-3 lg:p-6 rounded-xl"
    :style="{ backgroundColor: 'oklch(0.95 0.008 260)' }"
  >
    <!-- ═══════════════════════════════════════════════════════════════════
         Scroll mode — multi-page, each page is a <canvas>
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="useScroll"
      ref="scrollRef"
      class="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 flex flex-col items-center gap-4 sm:gap-4 lg:gap-6"
      @scroll="onScroll"
    >
      <canvas
        v-for="(_, idx) in canvases"
        :key="idx"
        :ref="(el: unknown) => setCanvasRef(el, idx)"
        class="card-canvas block max-w-full h-auto shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_28px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]"
        :style="canvasDisplayStyle"
      ></canvas>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Single card mode
         ═══════════════════════════════════════════════════════════════ -->
    <canvas
      v-else-if="canvases.length > 0"
      ref="singleCanvasRef"
      class="card-canvas block max-w-full h-auto shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_28px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]"
      :style="canvasDisplayStyle"
    ></canvas>

    <!-- Empty / loading state -->
    <div
      v-else
      class="flex items-center justify-center border-1.5 border-dashed border-base-content/12 shrink-0 text-base-content/40 text-sm rounded-lg"
      :style="canvasDisplayStyle"
    >
      <LoadingSpinner
        variant="spinner"
        size="lg"
        text="渲染中…"
      />
    </div>

    <!-- Page indicator -->
    <div v-if="canvases.length > 1" class="flex items-center gap-2 shrink-0">
      <span class="text-sm tabular-nums text-base-content/70">
        {{ currentPage + 1 }} / {{ canvases.length }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { renderAllPagesAsync, renderAllPages, renderCard, PAGE_WIDTH, PAGE_HEIGHT, getTheme, extractTokens, applyTokensToElement } from '@/card'
import type { HighlightStyle, FooterRightMode, CardCornerMode, TypographySettings, GradientConfig, CardPage } from '@/card'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

// ── Props ───────────────────────────────────────────────────────────────

interface Props {
  /** Markdown source text */
  source: string
  /** 0-based index of the active page */
  currentPage?: number
  /** Theme ID (e.g. 'moss-paper') */
  themeId?: string
  /** Typography settings */
  typography?: TypographySettings
  /** Background gradient config */
  gradientConfig?: GradientConfig
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
  /** Preview scale factor (0-1, default 1.0). Acts as max scale cap. */
  previewScale?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 0,
  themeId: 'moss-paper',
  typography: () => ({
    bodySize: 30,
    lineHeight: 1.84,
    bodyFontMode: 'wenkai' as const,
    subheadingStyle: 'large' as const,
  }),
  highlightStyle: 'underline' as HighlightStyle,
  footerLeft: '',
  footerRightMode: 'page' as FooterRightMode,
  footerEnabled: true,
  cardCornerMode: 'square' as CardCornerMode,
  previewScale: 1.0,
  gradientConfig: () => ({ enabled: false, color1: '#6c5ce7', color2: '#a29bfe', angle: 135 }),
})

// ── Emits ────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

// ── Layout constants ─────────────────────────────────────────────────────

/** Minimum card width in px before we stop scaling down (readability floor). */
const MIN_CARD_WIDTH = 260
/** Horizontal padding inside .preview-root (1.5rem × 2 sides at 16px base). */
const ROOT_PADDING_X = 48
/** Vertical padding inside .preview-root (1rem × 2 sides at 16px base). */
const ROOT_PADDING_Y = 32
/** Gap between cards in scroll mode (px). */
const CARD_GAP = 24

// ── State ────────────────────────────────────────────────────────────────

const canvases = ref<HTMLCanvasElement[]>([])

const containerRef = ref<HTMLDivElement | null>(null)
const scrollRef = ref<HTMLDivElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRefs = ref<Record<number, HTMLCanvasElement | null>>({})
const activeIdx = ref(props.currentPage)

/** Current pixel dimensions of the right panel (from ResizeObserver on the parent). */
const containerWidth = ref(0)
const containerHeight = ref(0)

// ── ResizeObserver — track parent (right panel) size for responsive fit ──

let resizeObserver: ResizeObserver | null = null

function setupResizeObserver(): void {
  if (typeof ResizeObserver === 'undefined') return
  const el = containerRef.value?.parentElement
  if (!el) return

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (width > 0 && width !== containerWidth.value) {
        containerWidth.value = width
      }
      if (height > 0 && height !== containerHeight.value) {
        containerHeight.value = height
      }
    }
  })
  resizeObserver.observe(el)
}

function teardownResizeObserver(): void {
  resizeObserver?.disconnect()
  resizeObserver = null
}

// ── Dynamic scale computation ────────────────────────────────────────────

/**
 * Compute the optimal display scale for the card canvas.
 *
 * Fills the available space in BOTH dimensions (fit-to-container):
 *  1. Compute scale that fits the card within available width & height
 *  2. Cap at previewScale (max quality) and floor at MIN_CARD_WIDTH
 *  3. Falls back to previewScale when ResizeObserver hasn't fired yet
 */
const displayScale = computed(() => {
  const maxScale = props.previewScale
  const availableWidth = containerWidth.value - ROOT_PADDING_X
  const availableHeight = containerHeight.value - ROOT_PADDING_Y

  // ResizeObserver hasn't fired yet — use prop as fallback
  if (availableWidth <= 0 || availableHeight <= 0) return maxScale

  // Fit to BOTH dimensions (maintain aspect ratio)
  const fitScaleW = availableWidth / PAGE_WIDTH
  const fitScaleH = availableHeight / PAGE_HEIGHT
  const fitScale = Math.min(fitScaleW, fitScaleH)

  // Cap at maxScale (prevents over-scaling on huge screens)
  // Floor at MIN_CARD_WIDTH for readability
  const floor = MIN_CARD_WIDTH / PAGE_WIDTH
  return Math.max(floor, Math.min(maxScale, fitScale))
})

/** CSS width/height for the canvas display element. */
const canvasDisplayStyle = computed(() => {
  const scale = displayScale.value
  const w = Math.round(PAGE_WIDTH * scale)
  const h = Math.round(PAGE_HEIGHT * scale)
  return {
    width: `${w}px`,
    height: `${h}px`,
  }
})

// ── Computed ─────────────────────────────────────────────────────────────

const useScroll = computed(() => canvases.value.length > 1)

// ── Helper: get actual rendered card height from DOM ─────────────────────

function getRenderedCardHeight(): number {
  const container = scrollRef.value
  if (container) {
    const firstCanvas = container.querySelector('canvas')
    if (firstCanvas) return firstCanvas.offsetHeight
  }
  if (singleCanvasRef.value) {
    return singleCanvasRef.value.offsetHeight
  }
  return Math.round(PAGE_HEIGHT * displayScale.value)
}

// ── Render ───────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** Cached page layout — reused when only theme/style changes (not source). */
let lastSourceKey = ''
let cachedLayoutPages: CardPage[] = []

function scheduleRender(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doRender, 150)
}

async function doRender(): Promise<void> {
  try {
    const sourceChanged = props.source !== lastSourceKey

    if (sourceChanged) {
      // Full pipeline: layout + render
      const result = await renderAllPagesAsync({
        source: props.source,
        themeId: props.themeId,
        typography: props.typography,
        highlightStyle: props.highlightStyle,
        footerLeft: props.footerLeft,
        footerRightMode: props.footerRightMode,
        footerEnabled: props.footerEnabled,
        cardCornerMode: props.cardCornerMode,
        gradientConfig: props.gradientConfig,
      })
      canvases.value = result.canvases
      cachedLayoutPages = result.pages
      lastSourceKey = props.source
    } else {
      // Style-only change: reuse layout, re-render only
      if (cachedLayoutPages.length === 0) {
        // Fallback: full render if no cache
        const result = await renderAllPagesAsync({
          source: props.source,
          themeId: props.themeId,
          typography: props.typography,
          highlightStyle: props.highlightStyle,
          footerLeft: props.footerLeft,
          footerRightMode: props.footerRightMode,
          footerEnabled: props.footerEnabled,
          cardCornerMode: props.cardCornerMode,
          gradientConfig: props.gradientConfig,
        })
        canvases.value = result.canvases
        cachedLayoutPages = result.pages
      } else {
        const theme = getTheme(props.themeId ?? 'moss-paper')
        canvases.value = cachedLayoutPages.map((page, index) =>
          renderCard({
            page,
            theme,
            settings: props.typography,
            highlightStyle: props.highlightStyle ?? theme.editor.highlightStyle,
            pageIndex: index,
            totalPages: cachedLayoutPages.length,
            footerLeft: props.footerLeft ?? '',
            footerRightMode: props.footerRightMode ?? 'page',
            footerEnabled: props.footerEnabled ?? true,
            cardCornerMode: props.cardCornerMode ?? 'square',
            gradientConfig: props.gradientConfig,
          }),
        )
      }
    }

    // Clamp current page
    if (props.currentPage >= canvases.value.length && canvases.value.length > 0) {
      emit('update:currentPage', Math.max(0, canvases.value.length - 1))
    }
  } catch (e) {
    console.warn('[CardPreview] Render failed:', e)
    try {
      const result = renderAllPages({
        source: props.source,
          themeId: props.themeId,
        typography: props.typography,
        highlightStyle: props.highlightStyle,
        footerLeft: props.footerLeft,
        footerRightMode: props.footerRightMode,
        footerEnabled: props.footerEnabled,
        cardCornerMode: props.cardCornerMode,
        gradientConfig: props.gradientConfig,
      })
      canvases.value = result.canvases
      cachedLayoutPages = result.pages
      lastSourceKey = props.source
    } catch { /* both failed */ }
  }
}

// Shallow watch: each element in the array is a prop value tracked by Vue's
// reactivity. `deep: true` is unnecessary because props are replaced (not
// mutated) when they change from the parent. Removing deep saves significant
// dependency-tracking overhead on complex objects like typography & gradientConfig.
watch(
  () => [
    props.source,
    props.themeId,
    props.typography,
    props.highlightStyle,
    props.footerLeft,
    props.footerRightMode,
    props.footerEnabled,
    props.cardCornerMode,
    props.gradientConfig,
  ] as const,
  scheduleRender,
  { immediate: true },
)

// Copy rendered canvases into DOM canvas elements
watch(
  () => canvases.value,
  async () => {
    await nextTick()

    if (!useScroll.value && singleCanvasRef.value && canvases.value.length > 0) {
      const src = canvases.value[0]!
      const dest = singleCanvasRef.value
      dest.width = src.width
      dest.height = src.height
      const dCtx = dest.getContext('2d')
      if (dCtx) dCtx.drawImage(src, 0, 0)
    }

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

// ── Scroll sync (multi-page mode) ────────────────────────────────────────

function setCanvasRef(el: unknown, idx: number): void {
  if (el) canvasRefs.value[idx] = el as HTMLCanvasElement
}

let isProgrammaticScroll = false
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function onScroll(): void {
  if (isProgrammaticScroll) return
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    const container = scrollRef.value
    if (!container) return
    const cardH = getRenderedCardHeight()
    if (cardH <= 0) return
    const pageH = cardH + CARD_GAP
    const idx = Math.round(container.scrollTop / pageH)
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
    const cardH = getRenderedCardHeight()
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

// ── CSS Design Tokens ────────────────────────────────────────────────────

/** Apply design tokens as CSS custom properties on the preview root element. */
watch(
  () => [props.themeId, props.gradientConfig] as const,
  () => {
    const theme = getTheme(props.themeId ?? 'moss-paper')
    const tokens = extractTokens(
      theme,
      props.gradientConfig,
    )
    if (containerRef.value) {
      applyTokensToElement(containerRef.value, tokens)
    }
  },
  { immediate: true },
)

// ── Lifecycle ────────────────────────────────────────────────────────────

onMounted(() => {
  setupResizeObserver()
})

onBeforeUnmount(() => {
  teardownResizeObserver()
  if (debounceTimer) clearTimeout(debounceTimer)
  if (scrollTimer) clearTimeout(scrollTimer)
})

// ── Expose ───────────────────────────────────────────────────────────────

defineExpose({
  /** Get the current page's canvas element (for export). */
  getActiveCanvas: (): HTMLCanvasElement | null => {
    return canvases.value[props.currentPage] ?? null
  },
  /** Get all rendered canvases. */
  getAllCanvases: (): HTMLCanvasElement[] => {
    return canvases.value
  },
  /** Get current page count. */
  getPageCount: (): number => {
    return canvases.value.length
  },
  /** Force an immediate re-render. */
  forceRender: () => {
    doRender()
  },
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   Container Queries (Tailwind doesn't support these yet — must keep)
   ═══════════════════════════════════════════════════════════════════════ */

.preview-root {
  container-type: inline-size;
  container-name: preview;
}

@container preview (max-width: 400px) {
  .card-canvas {
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.04), 0 2px 6px oklch(0 0 0 / 0.05);
  }
}

@container preview (max-width: 300px) {
  .page-indicator {
    font-size: 0.75rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Print styles — full resolution output
   ═══════════════════════════════════════════════════════════════════════ */

@media print {
  .preview-root {
    background: none;
    padding: 0;
  }

  .card-canvas {
    box-shadow: none;
    border-radius: 0;
    max-width: 100%;
    page-break-after: always;
  }

  .page-indicator {
    display: none;
  }
}
</style>
