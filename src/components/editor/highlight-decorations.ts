// ═══════════════════════════════════════════════════════════════════════════
// CodeMirror decoration layer — visual highlighting for ==mark== and ^underline^
// ═══════════════════════════════════════════════════════════════════════════
//
// @codemirror/lang-markdown only provides syntax highlighting for standard
// CommonMark syntax (**bold**, *italic*, etc.).  The ==mark== and ^underline^
// syntax is a custom extension used by this app for card rendering.
//
// This module adds a ViewPlugin that decorates these custom inline markers
// so they are visually distinct in the editor — the same way **bold** text
// appears bold in CodeMirror.
//

import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view'

// ── Decoration marks ──────────────────────────────────────────────────────

/** Applied to the entire ==…== span (including the delimiters). */
const HIGHLIGHT_MARK = Decoration.mark({ class: 'cm-mark' })

/** Applied to the entire ^…^ span (including the delimiters). */
const UNDERLINE_MARK = Decoration.mark({ class: 'cm-underline' })

// ── Regex patterns ────────────────────────────────────────────────────────

/**
 * Match ==highlight== spans.
 *
 * Uses [\s\S] (instead of `.`) so the match can span multiple lines.
 * Lazy (`+?`) to avoid merging multiple highlights on the same line
 * into one giant span.
 */
const HIGHLIGHT_RE = /==[\s\S]+?==/g

/**
 * Match ^underline^ spans.
 *
 * Excludes internal `^` characters so the match doesn't accidentally
 * span across unrelated `^` tokens.
 */
const UNDERLINE_RE = /\^[^^\n]+\^/g

// ── Decoration builder ────────────────────────────────────────────────────

/**
 * Scan the entire document and build a DecorationSet for all highlight and
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

  // Sort by position for DecorationSet
  decorations.sort((a, b) => a.from - b.from)

  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from, d.to)),
    true, // allow overlaps (a char can be in both sets — unlikely but safe)
  )
}

// ── ViewPlugin ────────────────────────────────────────────────────────────

/**
 * CodeMirror ViewPlugin that re-scans the document on every content or
 * viewport change and applies mark/underline decorations.
 *
 * Usage:
 *   import { highlightDecorations } from './highlight-decorations'
 *   // add to EditorState extensions:
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
