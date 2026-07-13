<template>
  <component
    :is="tag"
    class="md-heading theme-aware"
    :style="headingStyle"
  >
    {{ raw }}
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HeadingLevel } from '@/card'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'
import { useSettings } from '@/composables/useSettings'

const props = withDefaults(
  defineProps<{
    raw: string
    level?: HeadingLevel
    /** 是否为封面页（首张拆分卡片）。封面 H1 使用大字报效果。 */
    isCover?: boolean
  }>(),
  { level: 2, isCover: false },
)

const ctx = useMarkdownTheme()
const settings = useSettings()

const tag = computed(() => `h${Math.min(6, Math.max(1, props.level))}` as const)

const headingStyle = computed(() => {
  if (!ctx) {
    // 回退：无主题上下文时使用合理的默认值
    const fallbackSizes: Record<number, number> = { 1: 32, 2: 24, 3: 20, 4: 18, 5: 16, 6: 15 }
    return {
      fontSize: `${fallbackSizes[props.level] ?? 24}px`,
      fontWeight: '600',
      color: 'inherit',
      lineHeight: props.level <= 2 ? 1.3 : props.level === 3 ? 1.4 : 1.5,
      marginTop: `${Math.max(4, 10 * (props.level === 1 ? 3.2 : 1.65))}px`,
      marginBottom: `${Math.max(2, 4 * (props.level === 1 ? 3.2 : 1.65))}px`,
    }
  }

  const level = props.level
  const isCover = props.isCover && level === 1

  // 用户覆盖优先 — 读取对应的 heading size override
  const sizeOverrides: Record<number, number | null> = {
    1: settings.headingH1Size.value,
    2: settings.headingH2Size.value,
    3: settings.headingH3Size.value,
    4: settings.headingH4Size.value,
    5: settings.headingH5Size.value,
    6: settings.headingH6Size.value,
  }
  const userSize = sizeOverrides[level]

  // 使用 per-theme 分辨率函数（用户覆盖优先）
  const fontSize = userSize ?? ctx.headingSize(level, isCover)
  const lineHeight = ctx.headingLineHeight(level, isCover)
  const marginTop = ctx.headingMarginTop(level)
  const marginBottom = ctx.headingMarginBottom(level)
  const fontWeight = ctx.headingFontWeight(level)
  const headingColor = ctx.headingColor(level)

  // 颜色优先级：主题 heading 颜色覆盖 → subheading accent 样式 → 默认文本颜色
  const activeSubheadingStyle = ctx.theme.value.editor.subheadingStyle
  const color = headingColor
    ?? (activeSubheadingStyle === 'accent'
      ? ctx.accentColor.value
      : 'var(--card-text)')

  // H1 文本对齐（用户设置优先）
  const textAlign = level === 1 ? settings.headingH1Align.value : undefined

  // 响应式缩放：通过 CSS 自定义属性实现，由 MdRenderer 容器通过媒体查询控制
  return {
    fontSize: `calc(${fontSize}px * var(--heading-responsive-scale, 1))`,
    fontWeight: String(fontWeight),
    color,
    lineHeight: String(lineHeight),
    marginTop: `calc(${marginTop}px * var(--heading-responsive-scale, 1))`,
    marginBottom: `calc(${marginBottom}px * var(--heading-responsive-scale, 1))`,
    ...(textAlign && textAlign !== 'left' ? { textAlign } : {}),
  }
})
</script>

<style scoped>
.md-heading {
  word-break: break-word;
  overflow-wrap: break-word;
  /* CSS 过渡以实现平滑的主题切换与响应式缩放 */
  transition: font-size 0.3s ease, color 0.3s ease, margin 0.3s ease;
}
</style>
