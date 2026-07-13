// ═══════════════════════════════════════════════════════════════════════════
// useMarkdownTheme — inject theme context + computed style tokens
// ═══════════════════════════════════════════════════════════════════════════

import { inject, computed, type ComputedRef } from 'vue'
import { THEME_CONTEXT_KEY, type ThemeContext } from '@/composables/themeContext'
import type { ThemeDefinition } from '@/card'
import {
  resolveHeadingScale,
  resolveHeadingLineHeight,
  resolveHeadingFontWeight,
  resolveHeadingColor,
  DEFAULT_COVER_H1_SCALE,
  computeHeadingMarginBottom,
  computeHeadingMarginTop,
} from '@/card/types'

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
   * 计算给定级别（1-6）的标题字体大小（px）。
   * 优先使用主题 heading 配置，回退到 HEADING_SIZE_RATIOS × bodySize。
   * @param isCover 是否为封面页（首张拆分卡片），封面页使用 coverHeading 配置。
   */
  headingSize: (level: number, isCover?: boolean) => number
  /**
   * 计算给定级别（1-6）的标题行高。
   * 优先使用主题 heading 配置，回退到默认值。
   */
  headingLineHeight: (level: number, isCover?: boolean) => number
  /** 计算给定级别的标题段前间距（px）。 */
  headingMarginTop: (level: number, fontSize?: number) => number
  /** 计算给定级别的标题段后间距（px）。fontSize 为实际渲染字号，传入后使用动态公式。 */
  headingMarginBottom: (level: number, fontSize?: number) => number
  /** 计算给定级别的标题字重。 */
  headingFontWeight: (level: number) => number
  /** 计算给定级别的标题颜色（返回 undefined 表示使用默认文本颜色）。 */
  headingColor: (level: number) => string | undefined
  /** 封面页 H1 缩放因子（响应式）。 */
  coverH1Scale: ComputedRef<number>
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

    // 标题尺寸辅助 — per-theme heading config
    headingSize(level: number, isCover = false): number {
      const ratio = resolveHeadingScale(level, theme.value, isCover)
      return Math.round(theme.value.editor.bodySize * ratio)
    },
    headingLineHeight(level: number, isCover = false): number {
      return resolveHeadingLineHeight(level, theme.value, isCover)
    },
    headingMarginTop(level: number, fontSize?: number): number {
      if (fontSize) return computeHeadingMarginTop(fontSize)
      // 回退：无法获取实际字号时使用主题比例推算
      const ratio = resolveHeadingScale(level, theme.value, false)
      const size = Math.round(theme.value.editor.bodySize * ratio)
      return computeHeadingMarginTop(size)
    },
    headingMarginBottom(level: number, fontSize?: number): number {
      if (fontSize) return computeHeadingMarginBottom(fontSize, level)
      // 回退：无法获取实际字号时使用主题比例推算
      const ratio = resolveHeadingScale(level, theme.value, false)
      const size = Math.round(theme.value.editor.bodySize * ratio)
      return computeHeadingMarginBottom(size, level)
    },
    headingFontWeight(level: number): number {
      return resolveHeadingFontWeight(level, theme.value)
    },
    headingColor(level: number): string | undefined {
      return resolveHeadingColor(level, theme.value)
    },
    coverH1Scale: computed(() =>
      theme.value.coverHeading?.h1Scale ?? DEFAULT_COVER_H1_SCALE,
    ),
  }
}
