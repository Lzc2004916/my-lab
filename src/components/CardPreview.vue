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
      <span class="flex items-center gap-2">
        <svg class="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        渲染中…
      </span>
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
import { renderAllPages, PAGE_WIDTH, PAGE_HEIGHT } from '@/card'
import type { HighlightStyle, FooterRightMode, CardCornerMode, TypographySettings } from '@/card'

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
  /** Preview scale factor (0-1, default 0.95). Acts as max scale cap. */
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
}>()

// ── Layout constants ─────────────────────────────────────────────────────

/** Minimum card width in px before we stop scaling down (readability floor). */
const MIN_CARD_WIDTH = 260
/** Horizontal padding inside .preview-root (1.5rem × 2 sides at 16px base). */
const ROOT_PADDING_X = 48
/** Gap between cards in scroll mode (px). */
const CARD_GAP = 24

// ── State ────────────────────────────────────────────────────────────────

const canvases = ref<HTMLCanvasElement[]>([])

const containerRef = ref<HTMLDivElement | null>(null)
const scrollRef = ref<HTMLDivElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRefs = ref<Record<number, HTMLCanvasElement | null>>({})
const activeIdx = ref(props.currentPage)

/** Current pixel width of the .preview-root container (from ResizeObserver). */
const containerWidth = ref(0)

// ── ResizeObserver — track container width for responsive sizing ─────────

let resizeObserver: ResizeObserver | null = null

function setupResizeObserver(): void {
  if (typeof ResizeObserver === 'undefined') return
  const el = containerRef.value
  if (!el) return

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = entry.contentRect.width
      if (w > 0 && w !== containerWidth.value) {
        containerWidth.value = w
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
 * Logic (priority order):
 *  1. If container is wide enough → use previewScale as-is (max quality)
 *  2. If container is narrower → scale down to fit, but not below floor
 *  3. If ResizeObserver hasn't fired yet → use previewScale as initial guess
 */
const displayScale = computed(() => {
  const maxScale = props.previewScale
  const availableWidth = containerWidth.value - ROOT_PADDING_X

  // ResizeObserver hasn't fired yet — use prop as fallback
  if (availableWidth <= 0) return maxScale

  const maxCardWidth = PAGE_WIDTH * maxScale

  // Container is wide enough for full-size card
  if (availableWidth >= maxCardWidth) return maxScale

  // Container is narrow — scale down
  const fitScale = availableWidth / PAGE_WIDTH

  // Clamp to readability floor
  return Math.max(MIN_CARD_WIDTH / PAGE_WIDTH, fitScale)
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
  debounceTimer = setTimeout(doRender, 360)
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

    canvases.value = result.canvases

    // Clamp current page
    if (props.currentPage >= result.canvases.length && result.canvases.length > 0) {
      emit('update:currentPage', Math.max(0, result.canvases.length - 1))
    }
  } catch (e) {
    console.warn('[CardPreview] Render failed:', e)
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
  background-color: oklch(0.95 0.008 260 / 0.5);

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
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.card-canvas:hover {
  box-shadow:
    0 2px 6px oklch(0 0 0 / 0.06),
    0 6px 18px oklch(0 0 0 / 0.08),
    0 12px 36px oklch(0 0 0 / 0.06),
    0 0 0 1px oklch(0 0 0 / 0.06);
  transform: translateY(-2px);
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
