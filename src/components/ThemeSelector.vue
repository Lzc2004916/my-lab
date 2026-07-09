<template>
  <div class="theme-selector">
    <!-- Section label -->
    <span
      v-if="label"
      class="text-[10px] font-semibold text-base-content/35 uppercase tracking-widest whitespace-nowrap mb-1.5 block"
    >{{ label }}</span>

    <!-- Theme grid — radiogroup for accessibility -->
    <!-- Category filter tabs -->
    <div v-if="categories.length > 1" class="flex flex-wrap gap-1 mb-2">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-150"
        :class="{
          'bg-base-content/10 border-base-content/20 text-base-content/80': activeCategory === cat.key,
          'border-transparent text-base-content/40 hover:text-base-content/60': activeCategory !== cat.key,
        }"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <div
      ref="radioGroupRef"
      class="theme-grid"
      role="radiogroup"
      :aria-label="label || '卡片主题'"
      @keydown="onKeydown"
    >
      <button
        v-for="(theme, idx) in filteredThemes"
        :key="theme.id"
        :ref="(el: unknown) => setRadioRef(el, idx)"
        class="theme-card-radio"
        :class="{ selected: theme.id === modelValue }"
        :aria-checked="theme.id === modelValue"
        :tabindex="theme.id === modelValue ? 0 : -1"
        role="radio"
        :title="`${theme.name} — ${theme.description}`"
        @click="select(theme.id, idx)"
      >
        <!-- Miniature card visual -->
        <div
          class="theme-visual"
          :style="{
            background: theme.palette.page,
            borderColor: theme.palette.border,
            boxShadow: theme.id === modelValue
              ? `0 0 0 1px ${theme.palette.border}, 0 0 12px ${theme.palette.glow}`
              : `0 1px 3px ${theme.palette.shadow}`,
          }"
        >
          <!-- Accent bar (left edge) -->
          <div
            class="theme-visual-accent-bar"
            :style="{ background: theme.palette.accent, opacity: theme.surface.titleAccentMix }"
          ></div>

          <!-- Simulated content lines -->
          <div class="theme-visual-lines">
            <!-- Title line — thicker, more opaque -->
            <div
              class="theme-visual-line"
              :style="{
                background: theme.palette.text,
                opacity: 0.55,
                width: '70%',
                height: '3px',
              }"
            ></div>
            <!-- Body text line 1 -->
            <div
              class="theme-visual-line"
              :style="{ background: theme.palette.text, opacity: 0.28, width: '92%' }"
            ></div>
            <!-- Body text line 2 -->
            <div
              class="theme-visual-line"
              :style="{ background: theme.palette.text, opacity: 0.28, width: '82%' }"
            ></div>
            <!-- Muted line — represents secondary text -->
            <div
              class="theme-visual-line"
              :style="{ background: theme.palette.muted, opacity: 0.20, width: '55%' }"
            ></div>
          </div>

          <!-- Selection check overlay -->
          <Transition name="check-pop">
            <div
              v-if="showCheck && theme.id === modelValue"
              class="theme-visual-check"
              :style="{ background: theme.palette.accent }"
            >
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </Transition>
        </div>

        <!-- Theme name label -->
        <span
          class="theme-name"
          :class="{ 'theme-name--active': theme.id === modelValue }"
        >{{ theme.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ThemeDefinition } from '@/card'

// ── Props ──────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** Currently selected theme ID (v-model). */
    modelValue: string
    /** All available theme definitions. */
    themes: ThemeDefinition[]
    /** Optional section label above the grid. */
    label?: string
  }>(),
  {
    label: '卡片主题',
  },
)

// ── Emits ───────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

// ── Category filtering ──────────────────────────────────────────────────────

type CategoryKey = 'all' | 'light' | 'dark' | 'artistic' | 'professional'

interface CategoryTab {
  key: CategoryKey
  label: string
}

const activeCategory = ref<CategoryKey>('all')

const allCategories: CategoryTab[] = [
  { key: 'all', label: '全部' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '暗色' },
  { key: 'artistic', label: '艺术' },
  { key: 'professional', label: '专业' },
]

const categories = computed<CategoryTab[]>(() => {
  // Only show categories that have themes
  const available = new Set<string>()
  for (const t of props.themes) {
    if (t.category) available.add(t.category)
  }
  return allCategories.filter((c) => c.key === 'all' || available.has(c.key))
})

const filteredThemes = computed<ThemeDefinition[]>(() => {
  if (activeCategory.value === 'all') return props.themes
  return props.themes.filter((t) => t.category === activeCategory.value)
})

// ── Refs ────────────────────────────────────────────────────────────────────

const radioGroupRef = ref<HTMLDivElement | null>(null)
const radioRefs = ref<Record<number, HTMLButtonElement | null>>({})
const showCheck = ref(false)
const focusedIdx = ref(0)

// ── Selection ───────────────────────────────────────────────────────────────

let checkTimer: ReturnType<typeof setTimeout> | null = null

function select(id: string, idx: number): void {
  focusedIdx.value = idx
  emit('update:modelValue', id)

  // Brief checkmark overlay animation
  showCheck.value = true
  if (checkTimer) clearTimeout(checkTimer)
  checkTimer = setTimeout(() => {
    showCheck.value = false
  }, 400)
}

// ── Keyboard navigation ─────────────────────────────────────────────────────

function setRadioRef(el: unknown, idx: number): void {
  if (el) radioRefs.value[idx] = el as HTMLButtonElement
}

function onKeydown(e: KeyboardEvent): void {
  const len = filteredThemes.value.length
  if (len === 0) return

  let next = focusedIdx.value

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault()
      next = (focusedIdx.value + 1) % len
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault()
      next = (focusedIdx.value - 1 + len) % len
      break
    case 'Home':
      e.preventDefault()
      next = 0
      break
    case 'End':
      e.preventDefault()
      next = len - 1
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      select(filteredThemes.value[focusedIdx.value]!.id, focusedIdx.value)
      return
    default:
      return
  }

  focusedIdx.value = next
  radioRefs.value[next]?.focus()
}

// ── Sync focus index with external modelValue changes ───────────────────────

watch(
  () => props.modelValue,
  (val) => {
    // First try in filtered themes, then in all themes
    let idx = filteredThemes.value.findIndex((t) => t.id === val)
    if (idx < 0) idx = props.themes.findIndex((t) => t.id === val)
    if (idx >= 0) focusedIdx.value = idx
  },
)
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════════
   Theme Selector — Visual preview grid
   ═══════════════════════════════════════════════════════════════════════════ */

.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

/* ── Individual theme preview ─────────────────────────────────────────────── */

.theme-card-radio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  /* DaisyUI base-300 via Tailwind — fallback solid */
  --tw-ring-color: oklch(0.62 0.19 250);
}

.theme-card-radio:hover {
  transform: translateY(-2px);
  background-color: oklch(var(--b2) / 0.5);
}

.theme-card-radio:focus-visible {
  outline: 2px solid oklch(0.62 0.19 250);
  outline-offset: 2px;
}

/* Selected state */
.theme-card-radio.selected {
  border-color: oklch(0.62 0.19 250);
  box-shadow: 0 0 0 2px oklch(0.62 0.19 250 / 0.25);
  background-color: oklch(0.62 0.19 250 / 0.06);
}

/* ── Miniature card visual ────────────────────────────────────────────────── */

.theme-visual {
  position: relative;
  width: 100px;
  height: 70px;
  border-radius: 6px;
  border: 1px solid;
  overflow: hidden;
  transition: box-shadow 0.25s ease, border-color 0.2s ease;
  flex-shrink: 0;
}

.theme-visual-accent-bar {
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 0 2px 2px 0;
}

.theme-visual-lines {
  padding: 7px 8px 7px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  height: 100%;
}

.theme-visual-line {
  height: 2px;
  border-radius: 1px;
  flex-shrink: 0;
}

/* ── Selection check overlay ──────────────────────────────────────────────── */

.theme-visual-check {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transition: pop-in + fade-out */
.check-pop-enter-active {
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.check-pop-leave-active {
  transition: all 0.2s ease-in;
}
.check-pop-enter-from {
  opacity: 0;
  transform: scale(0.4);
}
.check-pop-leave-to {
  opacity: 0;
  transform: scale(1.2);
}

/* ── Theme name label ─────────────────────────────────────────────────────── */

.theme-name {
  font-size: 0.6875rem;
  line-height: 1.2;
  color: oklch(var(--bc) / 0.45);
  white-space: nowrap;
  transition: color 0.2s ease, font-weight 0.2s ease;
  max-width: 104px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.theme-name--active {
  color: oklch(var(--bc) / 0.85);
  font-weight: 600;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Responsive
   ═══════════════════════════════════════════════════════════════════════════ */

@media (max-width: 639px) {
  .theme-grid {
    gap: 0.5rem;
  }

  .theme-visual {
    width: 76px;
    height: 53px;
  }

  .theme-name {
    font-size: 0.625rem;
    max-width: 80px;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .theme-visual {
    width: 88px;
    height: 62px;
  }
}
</style>
