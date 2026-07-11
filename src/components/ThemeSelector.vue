<template>
  <div class="flex flex-col gap-2.5">
    <!-- ── Category filter pills ────────────────────────────────────── -->
    <div v-if="categories.length > 1" class="flex gap-1.5 flex-wrap">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="text-xs font-medium px-3 py-[3px] rounded-full border cursor-pointer transition-all duration-200 whitespace-nowrap"
        :class="activeCategory === cat.key
          ? 'bg-base-content/10 border-base-content/25 text-base-content font-semibold'
          : 'border-base-content/10 text-base-content/60 hover:border-base-content/25 hover:text-base-content'"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- ── Horizontal scroll track ──────────────────────────────────── -->
    <div
      ref="scrollRef"
      class="flex gap-3 overflow-x-auto overflow-y-hidden pt-1 pb-1.5 px-0.5 scrollbar-none"
      role="radiogroup"
      :aria-label="label || '卡片主题'"
      @scroll="onScroll"
      @wheel="onWheel"
      @keydown="onKeydown"
    >
      <button
        v-for="(theme, idx) in filteredThemes"
        :key="theme.id"
        :ref="(el: unknown) => setRadioRef(el, idx)"
        class="flex flex-col items-center gap-2 shrink-0 w-[146px] p-1.5 rounded-lg border-1.5 bg-transparent cursor-pointer transition-all duration-200"
        :class="theme.id === modelValue
          ? 'border-primary/50 bg-primary/5'
          : 'border-transparent hover:bg-base-200/40 hover:-translate-y-px'"
        :aria-checked="theme.id === modelValue"
        :tabindex="theme.id === modelValue ? 0 : -1"
        role="radio"
        :title="`${theme.name} — ${theme.mood}`"
        @click="select(theme.id, idx)"
      >
        <!-- Theme preview thumbnail -->
        <div
          class="relative w-[134px] h-[82px] rounded-md overflow-hidden shrink-0 transition-shadow duration-250"
          :style="{
            background: theme.palette.page,
            boxShadow: theme.id === modelValue
              ? `0 0 0 2px ${theme.palette.accent}, 0 4px 20px ${theme.palette.glow}`
              : `0 2px 8px ${theme.palette.shadow}`,
          }"
        >
          <!-- Grain texture overlay -->
          <div
            class="absolute inset-0 pointer-events-none theme-preview-grain"
            :style="{ opacity: theme.surface.grainAlpha * 3 }"
          />
          <!-- Accent bar -->
          <div
            class="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-[2px]"
            :style="{ background: theme.palette.accent, opacity: Math.max(0.35, theme.surface.titleAccentMix) }"
          />
          <!-- Content lines preview -->
          <div class="relative z-[1] p-2.5 pl-3.5 flex flex-col gap-[3px]">
            <div class="h-[3px] rounded-[1.5px] mb-[3px]" :style="{ background: theme.palette.text, opacity: 0.65, width: '72%' }" />
            <div class="h-[2px] rounded-[1px]" :style="{ background: theme.palette.text, opacity: 0.30, width: '94%' }" />
            <div class="h-[2px] rounded-[1px]" :style="{ background: theme.palette.text, opacity: 0.30, width: '88%' }" />
            <div class="h-[2px] rounded-[1px]" :style="{ background: theme.palette.muted, opacity: 0.22, width: '60%' }" />
          </div>
          <!-- Mood badge -->
          <span
            class="absolute bottom-1 right-1 text-2xs font-medium px-1.5 rounded-full leading-[1.4] whitespace-nowrap max-w-[70px] overflow-hidden text-ellipsis pointer-events-none"
            :style="{ background: theme.palette.accentSoft, color: theme.palette.accent }"
          >{{ theme.mood }}</span>
          <!-- Check mark (animated) -->
          <Transition name="check-pop">
            <div
              v-if="showCheck && theme.id === modelValue"
              class="absolute top-1 right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center z-[2] shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
              :style="{ background: theme.palette.accent }"
            >
              <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </Transition>
        </div>

        <!-- Card metadata -->
        <div class="flex flex-col items-center gap-px w-full min-w-0">
          <span
            class="text-sm font-medium leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px] transition-colors duration-200"
            :class="theme.id === modelValue ? 'text-base-content font-bold' : 'text-base-content/70'"
          >{{ theme.name }}</span>
          <span class="text-2xs text-base-content/50 whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]">{{ theme.preset }}</span>
        </div>
      </button>
    </div>

    <!-- ── Custom scrollbar ─────────────────────────────────────────── -->
    <div
      v-if="scrollViewW > 0 && scrollContentW > scrollViewW"
      ref="scrollbarRef"
      class="relative h-[5px] bg-base-content/5 rounded-full cursor-pointer shrink-0"
      @mousedown="onScrollbarClick"
    >
      <div
        class="absolute top-0 bottom-0 rounded-full bg-base-content/18 cursor-grab transition-[background] duration-150 will-change-transform active:bg-base-content/35 active:cursor-grabbing"
        :style="thumbStyle"
        @mousedown.stop="onThumbDragStart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import type { ThemeDefinition } from '@/card'

const props = withDefaults(
  defineProps<{
    modelValue: string
    themes: ThemeDefinition[]
    label?: string
  }>(),
  { label: '卡片主题' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

// ── Category filtering ─────────────────────────────────────────────────────

type CategoryKey = 'all' | 'light' | 'dark' | 'artistic' | 'professional'
interface CategoryTab { key: CategoryKey; label: string }

const activeCategory = ref<CategoryKey>('all')
const allCategories: CategoryTab[] = [
  { key: 'all', label: '全部' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '暗色' },
  { key: 'artistic', label: '艺术' },
  { key: 'professional', label: '专业' },
]

const categories = computed<CategoryTab[]>(() => {
  const available = new Set(props.themes.map((t) => t.category).filter(Boolean))
  return allCategories.filter((c) => c.key === 'all' || available.has(c.key))
})

const filteredThemes = computed<ThemeDefinition[]>(() => {
  if (activeCategory.value === 'all') return props.themes
  return props.themes.filter((t) => t.category === activeCategory.value)
})

// ── RAF-based smooth scroll ────────────────────────────────────────────────

const scrollRef = ref<HTMLDivElement | null>(null)
const scrollbarRef = ref<HTMLDivElement | null>(null)

let targetScrollLeft = 0
let scrollRaf: number | null = null

// 响应式滚动指标 — 在 RAF 循环中更新，实现 60fps 视觉同步
const scrollContentW = ref(0)
const scrollViewW = ref(0)
const scrollPos = ref(0)

/** 缩略图几何 — 由响应式 ref 驱动，CSS 追踪动画。 */
const thumbStyle = computed(() => {
  const cw = scrollContentW.value
  const vw = scrollViewW.value
  if (cw <= vw || vw <= 0) return { display: 'none' }

  // 滑块最小宽度约 24px；比例反映视口占比
  const thumbW = Math.max(24, (vw / cw) * vw)
  const trackW = vw - thumbW
  const maxPos = cw - vw
  const ratio = maxPos > 0 ? scrollPos.value / maxPos : 0
  const left = trackW * Math.min(1, Math.max(0, ratio))

  return {
    width: `${thumbW}px`,
    transform: `translateX(${left}px)`,
  }
})

function readMetrics(): void {
  const el = scrollRef.value
  if (!el) return
  scrollContentW.value = el.scrollWidth
  scrollViewW.value = el.clientWidth
  scrollPos.value = el.scrollLeft
}

function animateScroll(): void {
  if (scrollRaf !== null) return
  const el = scrollRef.value
  if (!el) return

  const step = (): void => {
    if (!el) { scrollRaf = null; return }
    const current = el.scrollLeft
    const diff = targetScrollLeft - current

    if (Math.abs(diff) < 0.5) {
      el.scrollLeft = targetScrollLeft
      scrollPos.value = targetScrollLeft
      scrollRaf = null
      return
    }

    el.scrollLeft = current + diff * 0.28
    scrollPos.value = el.scrollLeft
    scrollRaf = requestAnimationFrame(step)
  }

  scrollRaf = requestAnimationFrame(step)
}

function onScroll(): void {
  // 仅在 RAF 未驱动时从原生滚动更新（避免冲突）
  if (scrollRaf !== null) return
  scrollPos.value = scrollRef.value?.scrollLeft ?? 0
}

function onWheel(e: WheelEvent): void {
  const el = scrollRef.value
  if (!el) return

  const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  const delta = raw * 1.6

  const atStart = el.scrollLeft <= 0 && delta < 0
  const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && delta > 0

  if (!atStart && !atEnd) {
    e.preventDefault()
    targetScrollLeft = Math.max(0, Math.min(
      el.scrollWidth - el.clientWidth,
      targetScrollLeft + delta,
    ))
    animateScroll()
  }
}

function scrollToCard(idx: number): void {
  const el = scrollRef.value
  if (!el) return
  const card = el.children[idx] as HTMLElement | undefined
  if (!card) return
  targetScrollLeft = Math.max(0, card.offsetLeft - el.clientWidth / 2 + card.offsetWidth / 2)
  animateScroll()
}

// ── Custom scrollbar: thumb drag & track click ─────────────────────────────

let dragging = false
let dragStartX = 0
let dragStartScroll = 0

function onThumbDragStart(e: MouseEvent): void {
  dragging = true
  dragStartX = e.clientX
  dragStartScroll = targetScrollLeft
  document.addEventListener('mousemove', onThumbDragMove)
  document.addEventListener('mouseup', onThumbDragEnd)
}

function onThumbDragMove(e: MouseEvent): void {
  if (!dragging) return
  const el = scrollRef.value
  if (!el) return
  const trackW = scrollViewW.value
  const thumbW = parseFloat((e.target as HTMLElement).style.width || '24')
  const usableTrack = trackW - thumbW
  if (usableTrack <= 0) return

  const dx = e.clientX - dragStartX
  const maxScroll = scrollContentW.value - scrollViewW.value
  const scrollPerPx = maxScroll / usableTrack
  targetScrollLeft = Math.max(0, Math.min(maxScroll, dragStartScroll + dx * scrollPerPx))
  animateScroll()
}

function onThumbDragEnd(): void {
  dragging = false
  document.removeEventListener('mousemove', onThumbDragMove)
  document.removeEventListener('mouseup', onThumbDragEnd)
}

function onScrollbarClick(e: MouseEvent): void {
  const bar = scrollbarRef.value
  const el = scrollRef.value
  if (!bar || !el || (e.target as HTMLElement).classList.contains('custom-scrollbar-thumb')) return

  const rect = bar.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const trackW = scrollViewW.value
  const thumbW = parseFloat(
    (bar.querySelector('.custom-scrollbar-thumb') as HTMLElement)?.style.width || '24',
  )
  const usableTrack = trackW - thumbW
  if (usableTrack <= 0) return

  const maxScroll = scrollContentW.value - scrollViewW.value
  const ratio = Math.max(0, Math.min(1, clickX / trackW))
  targetScrollLeft = ratio * maxScroll
  animateScroll()
}

// ── Selection ──────────────────────────────────────────────────────────────

const showCheck = ref(false)
const focusedIdx = ref(0)
let checkTimer: ReturnType<typeof setTimeout> | null = null

function select(id: string, idx: number): void {
  focusedIdx.value = idx
  emit('update:modelValue', id)
  showCheck.value = true
  if (checkTimer) clearTimeout(checkTimer)
  checkTimer = setTimeout(() => { showCheck.value = false }, 400)
  nextTick(() => scrollToCard(idx))
}

// ── Keyboard navigation ────────────────────────────────────────────────────

const radioRefs = ref<Record<number, HTMLButtonElement | null>>({})

function setRadioRef(el: unknown, idx: number): void {
  if (el) radioRefs.value[idx] = el as HTMLButtonElement
}

function onKeydown(e: KeyboardEvent): void {
  const len = filteredThemes.value.length
  if (len === 0) return

  let next = focusedIdx.value
  switch (e.key) {
    case 'ArrowRight': e.preventDefault(); next = (focusedIdx.value + 1) % len; break
    case 'ArrowLeft':  e.preventDefault(); next = (focusedIdx.value - 1 + len) % len; break
    case 'Home':       e.preventDefault(); next = 0; break
    case 'End':        e.preventDefault(); next = len - 1; break
    case 'Enter':
    case ' ': {
      e.preventDefault()
      select(filteredThemes.value[focusedIdx.value]!.id, focusedIdx.value)
      return
    }
    default: return
  }
  focusedIdx.value = next
  radioRefs.value[next]?.focus()
  nextTick(() => scrollToCard(next))
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    readMetrics()
    if (scrollRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => readMetrics())
      resizeObserver.observe(scrollRef.value)
    }
  })
})

onBeforeUnmount(() => {
  if (scrollRaf !== null) {
    cancelAnimationFrame(scrollRaf)
    scrollRaf = null
  }
  resizeObserver?.disconnect()
  if (dragging) {
    document.removeEventListener('mousemove', onThumbDragMove)
    document.removeEventListener('mouseup', onThumbDragEnd)
  }
})

// ── Watchers ───────────────────────────────────────────────────────────────

watch(() => props.modelValue, (val) => {
  const idx = filteredThemes.value.findIndex((t) => t.id === val)
  if (idx >= 0) focusedIdx.value = idx
})

watch(activeCategory, () => {
  const idx = filteredThemes.value.findIndex((t) => t.id === props.modelValue)
  focusedIdx.value = idx >= 0 ? idx : 0
  nextTick(() => readMetrics())
})
</script>

<style scoped>
/* ═══ Grain texture (SVG data URL — must be in CSS) ═══════════════════ */

.theme-preview-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 64px 64px;
}

/* ═══ Check animation (Vue Transition) ══════════════════════════════════ */

.check-pop-enter-active { transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); }
.check-pop-leave-active { transition: all 0.2s ease-in; }
.check-pop-enter-from   { opacity: 0; transform: scale(0.4); }
.check-pop-leave-to     { opacity: 0; transform: scale(1.2); }

/* ── Override daisyUI focus style on radio buttons ──────────────────── */
button[role="radio"]:focus-visible {
  outline: 2px solid oklch(0.55 0.22 252);
  outline-offset: 3px;
  border-radius: 10px;
}
</style>