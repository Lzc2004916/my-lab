// ═══════════════════════════════════════════════════════════════════════════
// useMarkdownTheme — inject theme context + computed style tokens
// ═══════════════════════════════════════════════════════════════════════════

import { inject, computed, type ComputedRef } from 'vue'
import { THEME_CONTEXT_KEY, type ThemeContext } from '@/composables/themeContext'
import type { ThemeDefinition } from '@/card'
import { HEADING_SIZE_RATIOS } from '@/card/types'

// ── Public interface ──────────────────────────────────────────────────────

export interface MarkdownThemeTokens {
  /** 当前主题定义（响应式）。 */
  theme: ComputedRef<ThemeDefinition>
  /** 主页背景。 */
  pageBg: ComputedRef<string>
  /** 主文本颜色。 */
  textColor: ComputedRef<string>
  /** 柔和/次要文本颜色。 */
  mutedColor: ComputedRef<string>
  /** 强调色 / 品牌色。 */
  accentColor: ComputedRef<string>
  /** 柔和强调色（用于水洗效果）。 */
  accentSoft: ComputedRef<string>
  /** 边框 / 分隔线颜色。 */
  borderColor: ComputedRef<string>
  /** 阴影颜色。 */
  shadowColor: ComputedRef<string>
  /** 发光 / 高亮水洗色。 */
  glowColor: ComputedRef<string>
  /** 正文字体大小（px）。 */
  bodySize: ComputedRef<number>
  /** 行高倍率。 */
  lineHeight: ComputedRef<number>
  /** 引用框圆角半径（px）。 */
  quoteRadius: ComputedRef<number>
  /** 引用块处理模式。 */
  quoteTreatment: ComputedRef<string>
  /** 是否正在进行主题过渡。 */
  isTransitioning: ComputedRef<boolean>
  /**
   * 计算给定级别（1-6）的标题字体大小。
 * 使用主题的 bodySize × HEADING_SIZE_RATIOS。
   */
  headingSize: (level: number) => number
}

// ── Composable ────────────────────────────────────────────────────────────

/**
 * 注入由 `<ThemeProvider>` 提供的主题上下文，并返回
 * 适用于所有 markdown 元素样式需求的便捷计算 ref。
 *
 * 当 `<ThemeProvider>` 不是祖先组件时返回 `null`。
 */
export function useMarkdownTheme(): MarkdownThemeTokens | null {
  const ctx = inject<ThemeContext | null>(THEME_CONTEXT_KEY, null)
  if (!ctx) return null

  const theme = computed<ThemeDefinition>(() => ctx.theme.value)

  return {
    theme,

    // 调色板
    pageBg:      computed(() => theme.value.palette.page),
    textColor:   computed(() => theme.value.palette.text),
    mutedColor:  computed(() => theme.value.palette.muted),
    accentColor: computed(() => theme.value.palette.accent),
    accentSoft:  computed(() => theme.value.palette.accentSoft),
    borderColor: computed(() => theme.value.palette.border),
    shadowColor: computed(() => theme.value.palette.shadow),
    glowColor:   computed(() => theme.value.palette.glow),

    // 排版
    bodySize:   computed(() => theme.value.editor.bodySize),
    lineHeight: computed(() => theme.value.editor.lineHeight),

    // 组件特定
    quoteRadius:    computed(() => theme.value.components.quoteRadius),
    quoteTreatment: computed(() => theme.value.components.quoteTreatment),

    // 过渡状态
    isTransitioning: computed(() => ctx.isTransitioning.value),

    // 标题尺寸辅助
    headingSize(level: number): number {
      const ratio = HEADING_SIZE_RATIOS[level] ?? 1
      return Math.round(theme.value.editor.bodySize * ratio)
    },
  }
}