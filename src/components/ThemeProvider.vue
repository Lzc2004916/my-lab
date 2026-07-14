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
import { getTheme, getAllThemes, onRegistryChange, resolveHeadingScale, resolveHeadingLineHeight, resolveHeadingMarginTop, resolveHeadingMarginBottom, resolveHeadingFontWeight, resolveHeadingColor, resolveHeadingShadow, resolveHeadingStroke, resolveHeadingStrokeWidth, DEFAULT_COVER_H1_SCALE, getBodyFontFamily, DEFAULT_BODY_FONT_MODE } from '@/card'
import { type ThemeContext, THEME_CONTEXT_KEY } from '@/composables/themeContext'

// ── Props ──────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** 初始激活的主题 ID。 */
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

/** 重置所有主题相关的 CSS 变量 — 确保主题切换时旧样式不残留。 */
function resetAllThemeVariables(): void {
  const root = document.documentElement

  // 调色板
  const paletteVars = ['--card-page', '--card-page-alt', '--card-text', '--card-text-muted',
    '--card-accent', '--card-accent-soft', '--card-border', '--card-shadow', '--card-glow']
  // 表面
  const surfaceVars = ['--card-grain-opacity', '--card-inner-frame-opacity', '--card-preview-shadow']
  // 排版
  const typoVars = ['--body-size', '--body-line-height', '--font-body']
  // 标题 (H1-H6)
  const headingBaseVars: string[] = []
  for (let level = 1; level <= 6; level++) {
    headingBaseVars.push(
      `--card-heading-scale-h${level}`,
      `--card-heading-line-height-h${level}`,
      `--card-heading-margin-top-h${level}`,
      `--card-heading-margin-bottom-h${level}`,
      `--card-heading-font-weight-h${level}`,
      `--card-heading-color-h${level}`,
      `--card-heading-shadow-h${level}`,
      `--card-heading-stroke-h${level}`,
      `--card-heading-stroke-width-h${level}`,
    )
  }
  // 封面标题
  const coverVars = ['--card-cover-h1-scale', '--card-cover-h1-line-height',
    '--card-cover-h1-centered', '--card-cover-h1-top-offset']
  // 代码块
  const codeVars = ['--card-code-bg', '--card-code-text', '--card-code-radius',
    '--card-code-border', '--card-code-line-color']
  // 引用
  const quoteVars = ['--card-quote-bg', '--card-quote-bar-color', '--card-quote-bar-width',
    '--card-quote-radius']
  // 表格 / 分隔线 / 高亮 / 通用
  const miscVars = ['--card-table-border-color', '--card-table-header-bg', '--card-table-radius',
    '--card-divider-color', '--card-highlight-underline-color', '--card-highlight-marker-bg',
    '--card-highlight-border-color', '--card-highlight-bold-accent-color',
    '--card-list-marker-color', '--card-link-color']

  const allVars = [...paletteVars, ...surfaceVars, ...typoVars, ...headingBaseVars,
    ...coverVars, ...codeVars, ...quoteVars, ...miscVars]
  for (const v of allVars) {
    root.style.removeProperty(v)
  }
}

function applyThemeToDOM(theme: ThemeDefinition): void {
  const root = document.documentElement

  // ── 原子化重置旧主题样式（防止残留） ──────────────────────────
  resetAllThemeVariables()

  // 调色板
  root.style.setProperty('--card-page', theme.palette.page)
  root.style.setProperty('--card-page-alt', theme.palette.pageAlt)
  root.style.setProperty('--card-text', theme.palette.text)
  root.style.setProperty('--card-text-muted', theme.palette.muted)
  root.style.setProperty('--card-accent', theme.palette.accent)
  root.style.setProperty('--card-accent-soft', theme.palette.accentSoft)
  root.style.setProperty('--card-border', theme.palette.border)
  root.style.setProperty('--card-shadow', theme.palette.shadow)
  root.style.setProperty('--card-glow', theme.palette.glow)

  // 表面
  root.style.setProperty('--card-grain-opacity', String(theme.surface.grainAlpha))
  root.style.setProperty('--card-inner-frame-opacity', String(theme.surface.innerFrameAlpha))
  root.style.setProperty('--card-preview-shadow', theme.surface.previewShadow)

  // 编辑器 / 排版
  root.style.setProperty('--body-size', `${theme.editor.bodySize}px`)
  root.style.setProperty('--body-line-height', String(theme.editor.lineHeight))
  root.style.setProperty('--font-body', getBodyFontFamily(theme.editor.bodyFontMode ?? DEFAULT_BODY_FONT_MODE))

  // 过渡动画参数（全局常量，按 UI.md §7 动态注入确保可用性）
  root.style.setProperty('--theme-transition-duration', '0.35s')
  root.style.setProperty('--theme-transition-easing', 'cubic-bezier(0.4, 0, 0.2, 1)')

  // ── Heading scales ──────────────────────────────────────────────
  // Per-theme heading scales — resolved from theme heading config or defaults
  for (let level = 1; level <= 6; level++) {
    const scale = resolveHeadingScale(level, theme)
    const lineH = resolveHeadingLineHeight(level, theme)
    const marginTop = resolveHeadingMarginTop(level, theme)
    const marginBottom = resolveHeadingMarginBottom(level, theme)
    const fontWeight = resolveHeadingFontWeight(level, theme)
    const color = resolveHeadingColor(level, theme)
    const shadow = resolveHeadingShadow(level, theme)
    const stroke = resolveHeadingStroke(level, theme)
    const strokeWidth = resolveHeadingStrokeWidth(level, theme)

    root.style.setProperty(`--card-heading-scale-h${level}`, String(scale))
    root.style.setProperty(`--card-heading-line-height-h${level}`, String(lineH))
    root.style.setProperty(`--card-heading-margin-top-h${level}`, `${marginTop}px`)
    root.style.setProperty(`--card-heading-margin-bottom-h${level}`, `${marginBottom}px`)
    root.style.setProperty(`--card-heading-font-weight-h${level}`, String(fontWeight))
    if (color) {
      root.style.setProperty(`--card-heading-color-h${level}`, color)
    } else {
      root.style.removeProperty(`--card-heading-color-h${level}`)
    }
    if (shadow) {
      root.style.setProperty(`--card-heading-shadow-h${level}`, shadow)
    } else {
      root.style.removeProperty(`--card-heading-shadow-h${level}`)
    }
    if (stroke) {
      root.style.setProperty(`--card-heading-stroke-h${level}`, stroke)
    } else {
      root.style.removeProperty(`--card-heading-stroke-h${level}`)
    }
    root.style.setProperty(`--card-heading-stroke-width-h${level}`, `${strokeWidth}px`)
  }

  // ── Cover heading (首张拆分卡片 H1 大字报) ──────────────────────
  const coverCfg = theme.coverHeading
  root.style.setProperty('--card-cover-h1-scale', String(coverCfg?.h1Scale ?? DEFAULT_COVER_H1_SCALE))
  root.style.setProperty('--card-cover-h1-line-height', String(coverCfg?.h1LineHeight ?? 1.15))
  root.style.setProperty('--card-cover-h1-centered', coverCfg?.centered ? '1' : '0')
  root.style.setProperty('--card-cover-h1-top-offset', `${coverCfg?.topOffset ?? 0}px`)

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

  // 触发过渡类名
  isTransitioning.value = true

  activeThemeId.value = id
  activeTheme.value = theme
  applyThemeToDOM(theme)
  emit('theme-change', id)

  // 动画完成后清除过渡类名
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
  // 应用初始主题
  applyThemeToDOM(activeTheme.value)

  // 与注册表变更同步
  onRegistryChange(() => {
    availableThemes.value = getAllThemes()
    // 重新解析当前主题（可能在注册表中已更新）
    activeTheme.value = getTheme(activeThemeId.value)
    applyThemeToDOM(activeTheme.value)
  })
})

// 与 prop 变更同步
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