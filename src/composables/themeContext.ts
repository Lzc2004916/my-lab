// ═══════════════════════════════════════════════════════════════════════════
// 主题上下文共享类型 — 由 ThemeProvider.vue 和消费者使用
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