<template>
  <div class="theme-selector">
    <!-- ── Category filter pills ────────────────────────────────────── -->
    <div v-if="categories.length > 1" class="filter-row">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="filter-pill"
        :class="{ 'filter-pill--active': activeCategory === cat.key }"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- ── Horizontal scroll track ──────────────────────────────────── -->
    <div
      ref="scrollRef"
      class="scroll-track"
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
        class="theme-card"
        :class="{ 'theme-card--selected': theme.id === modelValue }"
        :aria-checked="theme.id === modelValue"
        :tabindex="theme.id === modelValue ? 0 : -1"
        role="radio"
        :title="`${theme.name} — ${theme.mood}`"
        @click="select(theme.id, idx)"
      >
        <div
          class="theme-preview"
          :style="{
            background: theme.palette.page,
            boxShadow: theme.id === modelValue
              ? `0 0 0 2px ${theme.palette.accent}, 0 4px 20px ${theme.palette.glow}`
              : `0 2px 8px ${theme.palette.shadow}`,
          }"
        >
          <div class="theme-preview-grain" :style="{ opacity: theme.surface.grainAlpha * 3 }" />
          <div class="theme-preview-accent" :style="{ background: theme.palette.accent, opacity: Math.max(0.35, theme.surface.titleAccentMix) }" />
          <div class="theme-preview-content">
            <div class="preview-title-line" :style="{ background: theme.palette.text, opacity: 0.65, width: theme.editor.titleFontMode === 'handwriting' ? '65%' : '72%' }" />
            <div class="preview-body-line" :style="{ background: theme.palette.text, opacity: 0.30, width: '94%' }" />
            <div class="preview-body-line" :style="{ background: theme.palette.text, opacity: 0.30, width: '88%' }" />
            <div class="preview-body-line" :style="{ background: theme.palette.muted, opacity: 0.22, width: '60%' }" />
          </div>
          <span class="preview-mood-badge" :style="{ background: theme.palette.accentSoft, color: theme.palette.accent }">{{ theme.mood }}</span>
          <Transition name="check-pop">
            <div v-if="showCheck && theme.id === modelValue" class="preview-check" :style="{ background: theme.palette.accent }">
              <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </Transition>
        </div>
        <div class="theme-meta">
          <span class="theme-name" :class="{ 'theme-name--selected': theme.id === modelValue }">{{ theme.name }}</span>
          <span class="theme-preset">{{ theme.preset }}</span>
        </div>
      </button>
    </div>

    <!-- ── Custom scrollbar ─────────────────────────────────────────── -->
    <div
      v-if="scrollViewW > 0 && scrollContentW > scrollViewW"
      ref="scrollbarRef"
      class="custom-scrollbar"
      @mousedown="onScrollbarClick"
    >
      <div
        class="custom-scrollbar-thumb"
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

// Reactive scroll metrics — updated in RAF loop for 60fps visual sync
const scrollContentW = ref(0)
const scrollViewW = ref(0)
const scrollPos = ref(0)

/** Thumb geometry — driven by reactive refs so CSS tracks the animation. */
const thumbStyle = computed(() => {
  const cw = scrollContentW.value
  const vw = scrollViewW.value
  if (cw <= vw || vw <= 0) return { display: 'none' }

  // Min thumb width ~24px; ratio reflects viewport fraction
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
  // Only update from native scroll when RAF isn't driving (avoids fighting)
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
/* ═══════════════════════════════════════════════════════════════════════════════
   Theme Selector — Horizontal scrollable theme gallery
   ═══════════════════════════════════════════════════════════════════════════ */

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Filter pills ─────────────────────────────────────────────────────────── */

.filter-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-pill {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 3px 12px;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.12);
  background: transparent;
  color: oklch(var(--bc) / 0.45);
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.filter-pill:hover {
  border-color: oklch(var(--bc) / 0.25);
  color: oklch(var(--bc) / 0.7);
}

.filter-pill--active {
  background: oklch(var(--bc) / 0.1);
  border-color: oklch(var(--bc) / 0.25);
  color: oklch(var(--bc) / 0.85);
  font-weight: 600;
}

/* ── Scroll track ─────────────────────────────────────────────────────────── */

.scroll-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px 6px;
  /* Hide native scrollbar — custom one below takes over */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-track::-webkit-scrollbar {
  display: none;
}

/* ── Custom scrollbar ─────────────────────────────────────────────────────── */

.custom-scrollbar {
  position: relative;
  height: 5px;
  background: oklch(var(--bc) / 0.05);
  border-radius: 9999px;
  cursor: pointer;
  flex-shrink: 0;
}

.custom-scrollbar-thumb {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 9999px;
  background: oklch(var(--bc) / 0.18);
  cursor: grab;
  transition: background 0.15s ease;
  will-change: transform;
}

.custom-scrollbar-thumb:hover,
.custom-scrollbar-thumb:active {
  background: oklch(var(--bc) / 0.35);
}

.custom-scrollbar-thumb:active {
  cursor: grabbing;
}

/* ── Individual theme card ────────────────────────────────────────────────── */

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 146px;
  padding: 6px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.theme-card:hover {
  background-color: oklch(var(--b2) / 0.4);
  transform: translateY(-1px);
}

.theme-card:focus-visible {
  outline: 2px solid oklch(0.62 0.19 250);
  outline-offset: 3px;
  border-radius: 10px;
}

.theme-card--selected {
  border-color: oklch(0.62 0.19 250 / 0.5);
  background-color: oklch(0.62 0.19 250 / 0.05);
}

/* ── Theme preview ────────────────────────────────────────────────────────── */

.theme-preview {
  position: relative;
  width: 134px;
  height: 82px;
  border-radius: 6px;
  overflow: hidden;
  transition: box-shadow 0.25s ease;
  flex-shrink: 0;
}

.theme-preview-grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 64px 64px;
  pointer-events: none;
}

.theme-preview-accent {
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 2px 2px 0;
}

.theme-preview-content {
  position: relative;
  z-index: 1;
  padding: 10px 10px 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preview-title-line { height: 3px; border-radius: 1.5px; margin-bottom: 3px; }
.preview-body-line  { height: 2px; border-radius: 1px; }

.preview-mood-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 0.5625rem;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 9999px;
  line-height: 1.4;
  white-space: nowrap;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.preview-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 2px 4px oklch(0 0 0 / 0.15);
}

.check-pop-enter-active { transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); }
.check-pop-leave-active { transition: all 0.2s ease-in; }
.check-pop-enter-from   { opacity: 0; transform: scale(0.4); }
.check-pop-leave-to     { opacity: 0; transform: scale(1.2); }

/* ── Card metadata ────────────────────────────────────────────────────────── */

.theme-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  width: 100%;
  min-width: 0;
}

.theme-name {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  color: oklch(var(--bc) / 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  transition: color 0.2s ease;
}

.theme-name--selected {
  color: oklch(var(--bc) / 0.9);
  font-weight: 700;
}

.theme-preset {
  font-size: 0.625rem;
  color: oklch(var(--bc) / 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}
</style>
