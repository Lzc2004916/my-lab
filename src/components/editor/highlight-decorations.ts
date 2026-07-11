// ═══════════════════════════════════════════════════════════════════════════
// CodeMirror 装饰层 — 为 ==mark== 和 ^underline^ 提供视觉高亮
// ═══════════════════════════════════════════════════════════════════════════
//
// @codemirror/lang-markdown 仅为标准 CommonMark 语法（**bold**, *italic* 等）
// 提供语法高亮。==mark== 和 ^underline^ 语法是本应用用于卡片渲染的自定义扩展。
//
// 此模块添加了一个 ViewPlugin，为这些自定义内联标记添加装饰，
// 使其在编辑器中视觉上与众不同 — 就像 **bold** 文本在 CodeMirror 中显示为粗体一样。
//

import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view'

// ── Decoration marks ──────────────────────────────────────────────────────

/** 应用于整个 ==…== 区域（含分隔符）。 */
const HIGHLIGHT_MARK = Decoration.mark({ class: 'cm-mark' })

/** 应用于整个 ^…^ 区域（含分隔符）。 */
const UNDERLINE_MARK = Decoration.mark({ class: 'cm-underline' })

// ── Regex patterns ────────────────────────────────────────────────────────

/**
 * 匹配 ==highlight== 范围。
 *
 * 使用 [\s\S]（而非 `.`）使匹配可以跨越多行。
 * 惰性匹配（`+?`）避免将同一行上的多个高亮合并
 * 为单个巨大范围。
 */
const HIGHLIGHT_RE = /==[\s\S]+?==/g

/**
 * 匹配 ^underline^ 范围。
 *
 * 排除内部的 `^` 字符，使匹配不会意外地
 * 跨越多个范围。across unrelated `^` tokens.
 */
const UNDERLINE_RE = /\^[^^\n]+\^/g

// ── Decoration builder ────────────────────────────────────────────────────

/**
 * 扫描整个文档并为所有高亮和下划线范围构建 DecorationSet。
 * underline spans in the visible viewport.
 */
function buildDecorations(view: EditorView): DecorationSet {
  const decorations: { from: number; to: number; decoration: Decoration }[] = []
  const doc = view.state.doc
  const text = doc.toString()

  // ── ==highlight== ──
  for (const match of text.matchAll(HIGHLIGHT_RE)) {
    decorations.push({
      from: match.index!,
      to: match.index! + match[0].length,
      decoration: HIGHLIGHT_MARK,
    })
  }

  // ── ^underline^ ──
  for (const match of text.matchAll(UNDERLINE_RE)) {
    decorations.push({
      from: match.index!,
      to: match.index! + match[0].length,
      decoration: UNDERLINE_MARK,
    })
  }

  // 按位置排序以构建 DecorationSet
  decorations.sort((a, b) => a.from - b.from)

  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from, d.to)),
    true, // allow overlaps (a char can be in both sets — unlikely but safe)
  )
}

// ── ViewPlugin ────────────────────────────────────────────────────────────

/**
 * CodeMirror ViewPlugin，在每次内容或视口变更时重新扫描文档
 * 并应用 mark/underline 装饰。
 *
 * 用法：
 *   import { highlightDecorations } from './highlight-decorations'
 *   // 添加到 EditorState 扩展中：
 *   extensions: [..., highlightDecorations]
 */
export const highlightDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
)