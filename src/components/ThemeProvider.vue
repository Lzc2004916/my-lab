<template>
  <div
    class="theme-provider-root"
    :class="{ 'theme-transitioning': isTransitioning }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, onMounted } from 'vue'
import type { ThemeDefinition } from '@/card'
import { getTheme, getAllThemes, onRegistryChange } from '@/card/theme-registry'
import { type ThemeContext, THEME_CONTEXT_KEY } from '@/composables/themeContext'

// ── Props ──────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** Initial theme ID to activate. */
    themeId?: string
  }>(),
  {
    themeId: 'moss-paper',
  },
)

// ── Emits ───────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'theme-change', themeId: string): void
}>()

// ── State ───────────────────────────────────────────────────────────────────

const activeThemeId = ref<string>(props.themeId)
const activeTheme = ref<ThemeDefinition>(getTheme(props.themeId))
const isTransitioning = ref(false)
const availableThemes = ref<ThemeDefinition[]>(getAllThemes())

// ── CSS variable application ───────────────────────────────────────────────

function applyThemeToDOM(theme: ThemeDefinition): void {
  const root = document.documentElement

  // Palette
  root.style.setProperty('--card-page', theme.palette.page)
  root.style.setProperty('--card-page-alt', theme.palette.pageAlt)
  root.style.setProperty('--card-text', theme.palette.text)
  root.style.setProperty('--card-text-muted', theme.palette.muted)
  root.style.setProperty('--card-accent', theme.palette.accent)
  root.style.setProperty('--card-accent-soft', theme.palette.accentSoft)
  root.style.setProperty('--card-border', theme.palette.border)
  root.style.setProperty('--card-shadow', theme.palette.shadow)
  root.style.setProperty('--card-glow', theme.palette.glow)

  // Surface
  root.style.setProperty('--card-grain-opacity', String(theme.surface.grainAlpha))
  root.style.setProperty('--card-inner-frame-opacity', String(theme.surface.innerFrameAlpha))
  root.style.setProperty('--card-preview-shadow', theme.surface.previewShadow)

  // Editor / typography
  root.style.setProperty('--body-size', `${theme.editor.bodySize}px`)
  root.style.setProperty('--body-line-height', String(theme.editor.lineHeight))

  // ── Heading scales ──────────────────────────────────────────────
  root.style.setProperty('--card-heading-scale-h1', '2.20')
  root.style.setProperty('--card-heading-scale-h2', '1.65')
  root.style.setProperty('--card-heading-scale-h3', '1.35')
  root.style.setProperty('--card-heading-scale-h4', '1.15')
  root.style.setProperty('--card-heading-scale-h5', '1.04')
  root.style.setProperty('--card-heading-scale-h6', '0.98')

  // ── Code block ──────────────────────────────────────────────────
  const codeBg = `rgba(${parseInt(theme.palette.text.slice(1,3),16)},${parseInt(theme.palette.text.slice(3,5),16)},${parseInt(theme.palette.text.slice(5,7),16)},0.06)`
  root.style.setProperty('--card-code-bg', codeBg)
  root.style.setProperty('--card-code-text', theme.palette.text)
  root.style.setProperty('--card-code-radius', theme.mode === 'brutal' ? '0px' : '8px')
  root.style.setProperty('--card-code-border', theme.palette.border)
  root.style.setProperty('--card-code-line-color', theme.palette.muted)

  // ── Quote block ─────────────────────────────────────────────────
  const [qr, qg, qb] = [parseInt(theme.palette.accent.slice(1,3),16), parseInt(theme.palette.accent.slice(3,5),16), parseInt(theme.palette.accent.slice(5,7),16)]
  root.style.setProperty('--card-quote-bg', `rgba(${qr},${qg},${qb},${theme.components.quoteFillAlpha})`)
  root.style.setProperty('--card-quote-bar-color', `rgba(${qr},${qg},${qb},${theme.components.quoteBarAlpha})`)
  root.style.setProperty('--card-quote-bar-width', theme.components.quoteTreatment === 'code' ? '4px' : '5px')
  root.style.setProperty('--card-quote-radius', `${theme.components.quoteRadius}px`)

  // ── Table ───────────────────────────────────────────────────────
  root.style.setProperty('--card-table-border-color', theme.palette.border)
  root.style.setProperty('--card-table-header-bg', theme.palette.accentSoft)
  root.style.setProperty('--card-table-radius', theme.mode === 'brutal' ? '0px' : '8px')

  // ── Divider ─────────────────────────────────────────────────────
  root.style.setProperty('--card-divider-color', theme.palette.border)

  // ── Highlight styles ────────────────────────────────────────────
  root.style.setProperty('--card-highlight-underline-color', `rgba(${qr},${qg},${qb},${theme.components.highlightUnderlineAlpha})`)
  root.style.setProperty('--card-highlight-marker-bg', `rgba(${qr},${qg},${qb},${theme.components.highlightMarkerAlpha})`)
  root.style.setProperty('--card-highlight-border-color', `rgba(${qr},${qg},${qb},${theme.components.highlightDashAlpha})`)
  root.style.setProperty('--card-highlight-bold-accent-color', theme.palette.accent)

  // ── General ─────────────────────────────────────────────────────
  root.style.setProperty('--card-list-marker-color', theme.palette.accent)
  root.style.setProperty('--card-link-color', theme.palette.accent)
}

// ── Theme switching ────────────────────────────────────────────────────────

let transitionTimer: ReturnType<typeof setTimeout> | null = null

function setTheme(id: string): void {
  const theme = getTheme(id)
  if (!theme || theme.id === activeThemeId.value) return

  // Trigger transition class
  isTransitioning.value = true

  activeThemeId.value = id
  activeTheme.value = theme
  applyThemeToDOM(theme)
  emit('theme-change', id)

  // Clear transition class after animation completes
  if (transitionTimer) clearTimeout(transitionTimer)
  transitionTimer = setTimeout(() => {
    isTransitioning.value = false
  }, 400)
}

// ── Provide context ────────────────────────────────────────────────────────

const context: ThemeContext = {
  theme: activeTheme,
  themeId: activeThemeId,
  setTheme,
  themes: availableThemes,
  isTransitioning,
}

provide(THEME_CONTEXT_KEY, context)

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  // Apply initial theme
  applyThemeToDOM(activeTheme.value)

  // Sync with registry changes
  onRegistryChange(() => {
    availableThemes.value = getAllThemes()
    // Re-resolve active theme (may have been updated in registry)
    activeTheme.value = getTheme(activeThemeId.value)
    applyThemeToDOM(activeTheme.value)
  })
})

// Sync with prop changes
watch(
  () => props.themeId,
  (newId) => {
    if (newId !== activeThemeId.value) {
      setTheme(newId)
    }
  },
)
</script>

<style scoped>
.theme-provider-root {
  min-height: 100%;
}
</style>
