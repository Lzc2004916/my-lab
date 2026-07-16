// ═══════════════════════════════════════════════════════════════════════════
// CodeMirror 搜索装饰层 — 高亮所有匹配项和当前激活匹配项
// ═══════════════════════════════════════════════════════════════════════════
//
// 提供两个 Compartment 管理的扩展：
//   1. searchMatchDecorations — 高亮所有搜索匹配项
//   2. searchActiveDecoration — 高亮当前激活的匹配项
//
// 使用 Compartment 允许在运行时热替换这些装饰层而无需重建
// 整个 EditorState。
//

import {
  StateEffect,
  StateField,
  type Extension,
} from '@codemirror/state'
import {
  Decoration,
  DecorationSet,
  EditorView,
} from '@codemirror/view'

// ── Search match ranges ────────────────────────────────────────────────

export interface SearchMatchRange {
  from: number
  to: number
}

export interface SearchHighlightConfig {
  /** 所有匹配项的位置范围 */
  matches: SearchMatchRange[]
  /** 当前激活匹配项的索引（-1 表示无激活项） */
  activeIndex: number
}

// ── State effects ──────────────────────────────────────────────────────

/** 设置搜索高亮的 effect。传入 null 清除所有高亮。 */
export const setSearchHighlights = StateEffect.define<SearchHighlightConfig | null>()

// ── Decoration marks ───────────────────────────────────────────────────

/** 应用于所有匹配项（不含当前激活项）的高亮样式。 */
const MATCH_DECORATION = Decoration.mark({ class: 'cm-search-match' })

/** 应用于当前激活匹配项的高亮样式（视觉上更突出）。 */
const ACTIVE_MATCH_DECORATION = Decoration.mark({ class: 'cm-search-match-active' })

// ── State field ────────────────────────────────────────────────────────

/**
 * 管理搜索高亮装饰的 StateField。
 * 每次 setSearchHighlights effect 派发时会重建 DecorationSet。
 */
export const searchHighlightField = StateField.define<DecorationSet>({
  create(): DecorationSet {
    return Decoration.none
  },

  update(decorations, tr): DecorationSet {
    // 检查是否有搜索高亮更新
    for (const effect of tr.effects) {
      if (effect.is(setSearchHighlights)) {
        const config = effect.value
        if (!config || config.matches.length === 0) {
          return Decoration.none
        }

        const decoRanges: { from: number; to: number; decoration: Decoration }[] = []

        for (let i = 0; i < config.matches.length; i++) {
          const match = config.matches[i]
          const isActive = i === config.activeIndex
          decoRanges.push({
            from: match.from,
            to: match.to,
            decoration: isActive ? ACTIVE_MATCH_DECORATION : MATCH_DECORATION,
          })
        }

        // 按位置排序以构建 DecorationSet
        decoRanges.sort((a, b) => a.from - b.from)

        return Decoration.set(
          decoRanges.map((d) => d.decoration.range(d.from, d.to)),
          true, // allow overlaps
        )
      }
    }

    // 文档变更时映射现有装饰位置
    if (tr.docChanged) {
      return decorations.map(tr.changes)
    }

    return decorations
  },

  provide: (field) => EditorView.decorations.from(field),
})

// ── Theme styles (injected via extension, not scoped CSS) ──────────────

/**
 * 搜索高亮的 CSS 样式 — 作为 EditorView.theme 扩展提供，
 * 使样式在 CodeMirror 的 Shadow DOM / 独立上下文中生效。
 */
export const searchHighlightTheme = EditorView.theme({
  '.cm-search-match': {
    backgroundColor: 'var(--card-search-match-bg, rgba(255, 200, 0, 0.35))',
    borderRadius: '3px',
    padding: '0 1px',
    margin: '0 -1px',
  },
  '.cm-search-match-active': {
    backgroundColor: 'var(--card-search-active-bg, rgba(255, 140, 0, 0.55))',
    borderRadius: '3px',
    padding: '0 1px',
    margin: '0 -1px',
    outline: '1.5px solid var(--card-search-active-outline, rgba(255, 120, 0, 0.7))',
    outlineOffset: '0px',
  },
})

/**
 * 搜索高亮的扩展数组 — 添加到 EditorState 扩展中以启用搜索高亮功能。
 */
export const searchHighlightExtensions: Extension[] = [
  searchHighlightField,
  searchHighlightTheme,
]

/**
 * 在编辑器中应用搜索高亮。
 *
 * @param view - CodeMirror EditorView 实例
 * @param config - 搜索高亮配置，或 null 清除所有高亮
 */
export function applySearchHighlights(
  view: EditorView | null,
  config: SearchHighlightConfig | null,
): void {
  if (!view) return
  view.dispatch({
    effects: setSearchHighlights.of(config),
  })
}

/**
 * 将编辑器滚动到指定位置并选中该位置的文本。
 *
 * @param view - CodeMirror EditorView 实例
 * @param from - 起始位置
 * @param to - 结束位置
 */
export function scrollToMatch(
  view: EditorView | null,
  from: number,
  to: number,
): void {
  if (!view) return

  // 派发选择变更并将目标滚动到视图中
  view.dispatch({
    selection: { anchor: from, head: to },
    scrollIntoView: true,
    // 使用 userEvent 注释避免干扰撤销历史
  })
}
