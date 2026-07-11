// ═══════════════════════════════════════════════════════════════════════════
// InlineRenderer — 通过 h() 渲染 InlineToken[] 的函数式组件
// ═══════════════════════════════════════════════════════════════════════════

import { h, defineComponent, type PropType, type VNode } from 'vue'
import type { InlineToken, HighlightStyle } from '@/card'
import { parseInlineMarkdown } from '@/card/measure'

export const InlineRenderer = defineComponent({
  name: 'InlineRenderer',
  props: {
    /** 带有 **、*、==、^ 标记的原始内联格式文本。 */
    raw: { type: String, required: true },
    /** 基础字体大小（px）。 */
    fontSize: { type: Number, default: 16 },
    /** 当前高亮样式。 */
    highlightStyle: { type: String as PropType<HighlightStyle>, default: 'underline' },
  },
  setup(props) {
    return (): VNode => {
      const tokens = parseInlineMarkdown(props.raw)
      return renderTokens(tokens, props.fontSize, props.highlightStyle)
    }
  },
})

export function renderTokens(
  tokens: InlineToken[],
  fontSize: number,
  highlightStyle: HighlightStyle = 'underline',
): VNode {
  const children: VNode[] = []

  for (const token of tokens) {
    if (token.text === '\n') {
      children.push(h('br'))
      continue
    }

    const style: Record<string, string> = {
      fontSize: `${fontSize}px`,
    }

    if (token.bold) {
      style.fontWeight = '600'
      style.color = 'var(--card-text)'
    }
    if (token.italic) {
      style.fontStyle = 'italic'
    }
    if (token.underline) {
      style.textDecoration = 'underline'
      style.textDecorationColor = 'var(--card-highlight-underline-color)'
      style.textUnderlineOffset = '0.15em'
    }

    if (token.mark) {
      if (highlightStyle === 'highlight') {
        // 粗体 + 强调色处理
        style.fontWeight = '600'
        style.color = 'var(--card-highlight-bold-accent-color)'
      } else if (highlightStyle === 'underline') {
        style.textDecoration = 'underline'
        style.textDecorationColor = 'var(--card-highlight-underline-color)'
        style.textUnderlineOffset = '0.12em'
        style.textDecorationThickness = '0.18em'
      } else if (highlightStyle === 'border') {
        style.borderBottom = '2px dashed var(--card-highlight-border-color)'
        style.paddingBottom = '1px'
      } else {
        // fallback: underline
        style.textDecoration = 'underline'
        style.textDecorationColor = 'var(--card-highlight-underline-color)'
        style.textUnderlineOffset = '0.12em'
        style.textDecorationThickness = '0.18em'
      }
    }

    children.push(h('span', { style }, token.text))
  }

  return h('span', { class: 'inline-renderer' }, children)
}