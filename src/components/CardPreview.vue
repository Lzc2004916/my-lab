<template>
  <div
    ref="containerRef"
    class="flex flex-col items-center justify-center gap-4 w-full min-h-full p-4 sm:p-3 lg:p-6 rounded-xl bg-transparent"
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
        class="card-canvas block h-auto shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_28px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]"
        :style="canvasDisplayStyle"
      ></canvas>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         Single card mode
         ═══════════════════════════════════════════════════════════════ -->
    <canvas
      v-else-if="canvases.length > 0"
      ref="singleCanvasRef"
      class="card-canvas block h-auto shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_28px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]"
      :style="canvasDisplayStyle"
    ></canvas>

    <!-- Empty / loading state -->
    <div
      v-else
      class="flex items-center justify-center border-1.5 border-dashed border-base-content/12 shrink-0 text-base-content/50 text-sm rounded-lg"
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
import type { HighlightStyle, FooterRightMode, CardCornerMode, TypographySettings, GradientConfig, CardPage, HeadingStyleOverrides } from '@/card'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

// ── Props ───────────────────────────────────────────────────────────────

interface Props {
  /** Markdown 源文本 */
  source: string
  /** 0-based index of the active page */
  currentPage?: number
  /** 主题 ID（例如 'moss-paper'） */
  themeId?: string
  /** 排版设置 */
  typography?: TypographySettings
  /** 背景渐变配置 */
  gradientConfig?: GradientConfig
  /** 高亮样式 */
  highlightStyle?: HighlightStyle
  /** 页脚左侧文本 */
  footerLeft?: string
  /** 页脚右侧显示模式 */
  footerRightMode?: FooterRightMode
  /** 是否显示页脚 */
  footerEnabled?: boolean
  /** 卡片圆角模式 */
  cardCornerMode?: CardCornerMode
  /** 预览缩放因子（0-1，默认 1.0）。作为最大缩放上限。 */
  previewScale?: number
  /** 用户自定义标题样式覆盖 */
  headingOverrides?: HeadingStyleOverrides | null
  /** 自定义高亮颜色（null = 使用主题强调色） */
  highlightColor?: string | null
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
  highlightColor: null,
  highlightStyle: 'underline' as HighlightStyle,
  footerLeft: '',
  footerRightMode: 'page' as FooterRightMode,
  footerEnabled: true,
  cardCornerMode: 'square' as CardCornerMode,
  previewScale: 1.0,
  gradientConfig: () => ({ enabled: false, color1: '#6c5ce7', color2: '#a29bfe', angle: 135 }),
  headingOverrides: null,
})

// ── Emits ────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

// ── Layout constants ─────────────────────────────────────────────────────

/** 停止缩放的最小卡片宽度（px，可读性底线）。 */
const MIN_CARD_WIDTH = 180
/** 滚动模式下卡片之间的间距（px）。 */
const CARD_GAP = 24

// ── State ────────────────────────────────────────────────────────────────

const canvases = ref<HTMLCanvasElement[]>([])

const containerRef = ref<HTMLDivElement | null>(null)
const scrollRef = ref<HTMLDivElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRefs = ref<Record<number, HTMLCanvasElement | null>>({})
const activeIdx = ref(props.currentPage)

// ── Dynamic scale computation ────────────────────────────────────────────

/**
 * 卡片画布的显示缩放比例。
 * 完全由用户控制的 previewScale 决定，下限为 MIN_CARD_WIDTH 保证可读性。
 * 放大到超出容器时，外层 overflow-auto 自动滚动。
 */
const displayScale = computed(() => {
  const floor = MIN_CARD_WIDTH / PAGE_WIDTH
  return Math.max(floor, props.previewScale)
})

/**
 * 仅设置 CSS width；height 由 canvas 内联宽高比 + h-auto 自动计算，
 * 确保 max-w-full 限制宽度时高度按比例缩放，不产生拉伸变形。
 */
const canvasDisplayStyle = computed(() => {
  const scale = displayScale.value
  const w = Math.round(PAGE_WIDTH * scale)
  return { width: `${w}px` }
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

/** 用于取消进行中渲染的 AbortController。新渲染启动时旧渲染被取消。 */
let abortController: AbortController | null = null

/** 缓存的页面布局 — 仅在主题/样式变化时复用（源文本不变）。 */
let lastSourceKey = ''
let cachedLayoutPages: CardPage[] = []

function scheduleRender(): void {
  // 取消上一次仍在进行中的渲染
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doRender, 300)
}

async function doRender(): Promise<void> {
  // 创建新的 AbortController 供本次渲染使用
  abortController = new AbortController()
  const signal = abortController.signal

  try {
    const sourceChanged = props.source !== lastSourceKey

    if (sourceChanged) {
      // 完整管线：布局 + 渲染（每页之间 yield 主线程）
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
        headingOverrides: props.headingOverrides,
        highlightColor: props.highlightColor,
      }, signal)
      canvases.value = result.canvases
      cachedLayoutPages = result.pages
      lastSourceKey = props.source
    } else {
      // 仅样式变更：复用布局，仅重新渲染（每页之间 yield 主线程）
      if (cachedLayoutPages.length === 0) {
        // 回退：无缓存时进行完整渲染
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
          headingOverrides: props.headingOverrides,
          highlightColor: props.highlightColor,
        }, signal)
        canvases.value = result.canvases
        cachedLayoutPages = result.pages
      } else {
        const theme = getTheme(props.themeId ?? 'moss-paper')
        const canvasesList: HTMLCanvasElement[] = []
        for (let i = 0; i < cachedLayoutPages.length; i++) {
          if (signal.aborted) return
          canvasesList.push(
            renderCard({
              page: cachedLayoutPages[i]!,
              theme,
              settings: props.typography,
              highlightStyle: props.highlightStyle ?? theme.editor.highlightStyle,
              pageIndex: i,
              totalPages: cachedLayoutPages.length,
              footerLeft: props.footerLeft ?? '',
              footerRightMode: props.footerRightMode ?? 'page',
              footerEnabled: props.footerEnabled ?? true,
              cardCornerMode: props.cardCornerMode ?? 'square',
              gradientConfig: props.gradientConfig,
              headingOverrides: props.headingOverrides,
              highlightColor: props.highlightColor,
            }),
          )
          // 每页渲染后 yield 主线程
          if (i < cachedLayoutPages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 0))
          }
        }
        canvases.value = canvasesList
      }
    }

    // 限制当前页码
    if (props.currentPage >= canvases.value.length && canvases.value.length > 0) {
      emit('update:currentPage', Math.max(0, canvases.value.length - 1))
    }
  } catch (e: unknown) {
    // AbortError 是预期行为——静默忽略
    if (e instanceof DOMException && e.name === 'AbortError') return

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
        headingOverrides: props.headingOverrides,
        highlightColor: props.highlightColor,
      })
      canvases.value = result.canvases
      cachedLayoutPages = result.pages
      lastSourceKey = props.source
    } catch { /* both failed */ }
  }
}

// 浅层 watch：数组中的每个元素都是 Vue 跟踪的 prop 值
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
    props.headingOverrides,
    props.highlightColor,
  ] as const,
  scheduleRender,
  { immediate: true },
)

// 将渲染好的 Canvas 复制到 DOM canvas 元素中
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

/** 将设计令牌作为 CSS 自定义属性应用到预览根元素。 */
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
  // ResizeObserver 已移除 — 缩放完全由用户控制
})

onBeforeUnmount(() => {
  // 取消进行中的渲染，防止组件销毁后更新已卸载的响应式状态
  if (abortController) abortController.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
  if (scrollTimer) clearTimeout(scrollTimer)
})

// ── Expose ───────────────────────────────────────────────────────────────

defineExpose({
  /** 获取当前页面的 canvas 元素（用于导出）。 */
  getActiveCanvas: (): HTMLCanvasElement | null => {
    return canvases.value[props.currentPage] ?? null
  },
  /** 获取所有渲染的 canvas。 */
  getAllCanvases: (): HTMLCanvasElement[] => {
    return canvases.value
  },
  /** 获取当前页数。 */
  getPageCount: (): number => {
    return canvases.value.length
  },
  /** 强制立即重新渲染。 */
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