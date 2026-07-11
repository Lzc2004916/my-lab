// ═══════════════════════════════════════════════════════════════════════════
// Theme context shared types — used by ThemeProvider.vue and consumers
// ═══════════════════════════════════════════════════════════════════════════

import type { Ref, InjectionKey } from 'vue'
import type { ThemeDefinition } from '@/card'

export interface ThemeContext {
  theme: Ref<ThemeDefinition>
  themeId: Ref<string>
  setTheme: (id: string) => void
  themes: Ref<ThemeDefinition[]>
  isTransitioning: Ref<boolean>
}

export const THEME_CONTEXT_KEY: InjectionKey<ThemeContext> = Symbol('theme-context')
