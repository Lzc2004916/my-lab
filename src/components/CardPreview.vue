<template>
  <div
    ref="containerRef"
    class="preview-root"
  >
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
        v-for="(_, idx) in canvases"
        :key="idx"
        :ref="(el: unknown) => setCanvasRef(el, idx)"
        class="card-canvas"
        :style="canvasDisplayStyle"
      ></canvas>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Single card mode
         ═══════════════════════════════════════════════════════════════ -->
    <canvas
      v-else-if="canvases.length > 0"
      ref="singleCanvasRef"
      class="card-canvas"
      :style="canvasDisplayStyle"
    ></canvas>

    <!-- Empty / loading state -->
    <div
      v-else
      class="empty-state"
      :style="canvasDisplayStyle"
    >
      <LoadingSpinner
        variant="spinner"
        size="lg"
        text="渲染中…"
      />
    </div>

    <!-- Page indicator -->
    <div v-if="canvases.length > 1" class="page-indicator">
      <span class="text-sm tabular-nums text-base-content/70">
        {{ currentPage + 1 }} / {{ canvases.length }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { renderAllPagesAsync, renderAllPages, PAGE_WIDTH, PAGE_HEIGHT, getTheme, extractTokens, applyTokensToElement } from '@/card'
import type { HighlightStyle, FooterRightMode, CardCornerMode, TypographySettings, GradientConfig } from '@/card'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

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
  manualTitle: '',
  currentPage: 0,
  themeId: 'moss-paper',
  typography: () => ({
    titleSize: 75,
    bodySize: 30,
    lineHeight: 1.84,
    titleFontMode: 'serif' as const,
    bodyFontMode: 'wenkai' as const,
    subheadingStyle: 'large' as const,
    titleCustom: { color: '', alignment: 'left' as const, fontWeight: 0, letterSpacing: 0 },
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
  // Observe the right panel (parent of .preview-root) so we know
  // exactly how much space is available for the card.
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
  // Try to read actual DOM element height
  const container = scrollRef.value
  if (container) {
    const firstCanvas = container.querySelector('canvas')
    if (firstCanvas) return firstCanvas.offsetHeight
  }
  if (singleCanvasRef.value) {
    return singleCanvasRef.value.offsetHeight
  }
  // Fallback: compute from current scale
  return Math.round(PAGE_HEIGHT * displayScale.value)
}

// ── Render ───────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRender(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doRender, 150)
}

async function doRender(): Promise<void> {
  try {
    const result = await renderAllPagesAsync({
      source: props.source,
      manualTitle: props.manualTitle,
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

    // Clamp current page
    if (props.currentPage >= result.canvases.length && result.canvases.length > 0) {
      emit('update:currentPage', Math.max(0, result.canvases.length - 1))
    }
  } catch (e) {
    console.warn('[CardPreview] Render failed:', e)
    // Fallback to sync render
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
        gradientConfig: props.gradientConfig,
      })
      canvases.value = result.canvases
    } catch { /* both failed */ }
  }
}

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
    props.gradientConfig,
  ] as const,
  scheduleRender,
  { immediate: true, deep: true },
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
  () => [props.themeId, props.gradientConfig, props.typography?.titleCustom] as const,
  () => {
    const theme = getTheme(props.themeId ?? 'moss-paper')
    const tokens = extractTokens(
      theme,
      props.gradientConfig,
      props.typography?.titleCustom,
    )
    if (containerRef.value) {
      applyTokensToElement(containerRef.value, tokens)
    }
  },
  { immediate: true, deep: true },
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
   .preview-root — Flexbox container
   Uses flexbox to fill the parent container both horizontally and vertically.
   Cards are centered within available space.
   ═══════════════════════════════════════════════════════════════════════ */

.preview-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  gap: 1rem;
  width: 100%;
  min-height: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: oklch(0.95 0.008 260);

  /* Enable container queries for progressive enhancement */
  container-type: inline-size;
  container-name: preview;
}

/* ── Card canvas — responsive display ─────────────────────────────────── */

.card-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  flex-shrink: 0;
  box-shadow:
    0 1px 3px oklch(0 0 0 / 0.04),
    0 4px 12px oklch(0 0 0 / 0.06),
    0 8px 28px oklch(0 0 0 / 0.05),
    0 0 0 1px oklch(0 0 0 / 0.04);
}

/* ── Empty state placeholder ──────────────────────────────────────────── */

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed oklch(0 0 0 / 0.12);
  flex-shrink: 0;
  color: oklch(0 0 0 / 0.4);
  font-size: 0.875rem;
}

/* ── Scroll container (multi-page mode) ───────────────────────────────── */

.scroll-container {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem 0 1rem;

  /* Flex column: stack cards vertically, center horizontally */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* ── Page indicator ───────────────────────────────────────────────────── */

.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Responsive Breakpoints
   ═══════════════════════════════════════════════════════════════════════ */

/* Small screens (phones, < 640px):
   Minimize padding, let card fill nearly full width. */
@media (max-width: 639px) {
  .preview-root {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .scroll-container {
    padding: 0.25rem 0 0.5rem;
    gap: 0.75rem;
  }
}

/* Medium screens (tablets, 640px – 1023px):
   Moderate padding. Card may scale slightly. */
@media (min-width: 640px) and (max-width: 1023px) {
  .preview-root {
    padding: 0.75rem;
  }

  .scroll-container {
    gap: 1rem;
  }
}

/* Large screens (desktops, ≥ 1024px):
   Full padding, card displays at up to previewScale × PAGE_WIDTH.
   The ResizeObserver handles fine-tuning. */
@media (min-width: 1024px) {
  .preview-root {
    padding: 1.5rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Container Queries (progressive enhancement)
   When the preview container itself is narrow (e.g. in a small panel),
   reduce decorative padding so the card gets more relative space.
   ═══════════════════════════════════════════════════════════════════════ */

@container preview (max-width: 400px) {
  .card-canvas {
    box-shadow:
      0 1px 2px oklch(0 0 0 / 0.04),
      0 2px 6px oklch(0 0 0 / 0.05);
  }
}

@container preview (max-width: 300px) {
  .page-indicator {
    font-size: 0.75rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Print styles — cards output at full resolution
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
