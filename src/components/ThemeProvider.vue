<template>
  <div
    class="theme-provider-root"
    :class="{ 'theme-transitioning': isTransitioning }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, onMounted, type Ref, type InjectionKey } from 'vue'
import type { ThemeDefinition } from '@/card'
import { getTheme, getAllThemes, onRegistryChange } from '@/card/theme-registry'

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

// ── Injection key ──────────────────────────────────────────────────────────

export interface ThemeContext {
  theme: Ref<ThemeDefinition>
  themeId: Ref<string>
  setTheme: (id: string) => void
  themes: Ref<ThemeDefinition[]>
}

export const THEME_CONTEXT_KEY: InjectionKey<ThemeContext> = Symbol('theme-context')

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
  root.style.setProperty('--title-size', `${theme.editor.titleSize}px`)
  root.style.setProperty('--body-size', `${theme.editor.bodySize}px`)
  root.style.setProperty('--body-line-height', String(theme.editor.lineHeight))
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
