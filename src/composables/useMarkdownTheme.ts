// ═══════════════════════════════════════════════════════════════════════════
// useMarkdownTheme — inject theme context + computed style tokens
// ═══════════════════════════════════════════════════════════════════════════

import { inject, computed, type ComputedRef } from 'vue'
import { THEME_CONTEXT_KEY, type ThemeContext } from '@/composables/themeContext'
import type { ThemeDefinition } from '@/card'
import { HEADING_SIZE_RATIOS } from '@/card/types'

// ── Public interface ──────────────────────────────────────────────────────

export interface MarkdownThemeTokens {
  /** Current theme definition (reactive). */
  theme: ComputedRef<ThemeDefinition>
  /** Main page background. */
  pageBg: ComputedRef<string>
  /** Primary text color. */
  textColor: ComputedRef<string>
  /** Muted / secondary text color. */
  mutedColor: ComputedRef<string>
  /** Accent / brand color. */
  accentColor: ComputedRef<string>
  /** Soft accent for washes. */
  accentSoft: ComputedRef<string>
  /** Border / divider color. */
  borderColor: ComputedRef<string>
  /** Shadow color. */
  shadowColor: ComputedRef<string>
  /** Glow / highlight wash. */
  glowColor: ComputedRef<string>
  /** Body font size (px). */
  bodySize: ComputedRef<number>
  /** Line-height multiplier. */
  lineHeight: ComputedRef<number>
  /** Quote border radius (px). */
  quoteRadius: ComputedRef<number>
  /** Quote treatment mode. */
  quoteTreatment: ComputedRef<string>
  /** Whether a theme transition is in progress. */
  isTransitioning: ComputedRef<boolean>
  /**
   * Compute the heading font size for a given level (1-6).
   * Uses theme's bodySize × HEADING_SIZE_RATIOS.
   */
  headingSize: (level: number) => number
}

// ── Composable ────────────────────────────────────────────────────────────

/**
 * Inject the theme context provided by `<ThemeProvider>` and return
 * ergonomic computed refs for all markdown-element styling needs.
 *
 * Returns `null` when `<ThemeProvider>` is not an ancestor.
 */
export function useMarkdownTheme(): MarkdownThemeTokens | null {
  const ctx = inject<ThemeContext | null>(THEME_CONTEXT_KEY, null)
  if (!ctx) return null

  const theme = computed<ThemeDefinition>(() => ctx.theme.value)

  return {
    theme,

    // Palette
    pageBg:      computed(() => theme.value.palette.page),
    textColor:   computed(() => theme.value.palette.text),
    mutedColor:  computed(() => theme.value.palette.muted),
    accentColor: computed(() => theme.value.palette.accent),
    accentSoft:  computed(() => theme.value.palette.accentSoft),
    borderColor: computed(() => theme.value.palette.border),
    shadowColor: computed(() => theme.value.palette.shadow),
    glowColor:   computed(() => theme.value.palette.glow),

    // Typography
    bodySize:   computed(() => theme.value.editor.bodySize),
    lineHeight: computed(() => theme.value.editor.lineHeight),

    // Component-specific
    quoteRadius:    computed(() => theme.value.components.quoteRadius),
    quoteTreatment: computed(() => theme.value.components.quoteTreatment),

    // Transition state
    isTransitioning: computed(() => ctx.isTransitioning.value),

    // Heading size helper
    headingSize(level: number): number {
      const ratio = HEADING_SIZE_RATIOS[level] ?? 1
      return Math.round(theme.value.editor.bodySize * ratio)
    },
  }
}
