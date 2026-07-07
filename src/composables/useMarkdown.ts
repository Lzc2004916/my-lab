import { ref, type Ref } from 'vue'

/**
 * Simplified markdown composable for the canvas-based CardPreview.
 *
 * The new CardPreview component takes `source` directly and handles
 * rendering internally via the canvas engine.  This composable provides
 * a minimal reactive wrapper: track the source text and current page index.
 *
 * In noSplit mode the page index is always 0 (single long page).
 */
export function useMarkdown(source: Ref<string>): {
  source: Ref<string>
  /** The source text (alias for consistency). */
  currentPage: Ref<number>
} {
  const currentPage = ref<number>(0)

  return { source, currentPage }
}
