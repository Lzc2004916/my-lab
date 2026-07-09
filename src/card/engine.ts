// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — unified engine
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CardPage,
  HighlightStyle,
  FooterRightMode,
  CardCornerMode,
  ThemeDefinition,
  TypographySettings,
} from './types'
import { layoutPages } from './layout'
import { renderCard } from './renderer'
import { getTheme } from './theme-registry'

// ═══════════════════════════════════════════════════════════════════════════
// Engine options
// ═══════════════════════════════════════════════════════════════════════════

export interface EngineOptions {
  /** Markdown source text */
  source: string
  /** Optional override title (otherwise extracted from source) */
  manualTitle?: string
  /** Theme ID string (e.g. 'moss-paper') */
  themeId: string
  /** Typography settings */
  typography: TypographySettings
  /** Highlight style */
  highlightStyle: HighlightStyle
  /** Footer left text */
  footerLeft?: string
  /** Footer right mode */
  footerRightMode?: FooterRightMode
  /** Whether the footer is visible */
  footerEnabled?: boolean
  /** Card corner mode */
  cardCornerMode?: CardCornerMode
}

// ═══════════════════════════════════════════════════════════════════════════

/** Render all pages for the given source text. Returns canvases, one per page. */
export function renderAllPages(
  opts: EngineOptions,
): { pages: CardPage[]; canvases: HTMLCanvasElement[] } {
  const theme: ThemeDefinition = getTheme(opts.themeId)
  const settings: TypographySettings = opts.typography

  const pages = layoutPages({
    source: opts.source,
    manualTitle: opts.manualTitle ?? '',
    settings,
    theme,
    footerEnabled: opts.footerEnabled ?? true,
  })

  const canvases = pages.map((page, index) =>
    renderCard({
      page,
      theme,
      settings,
      highlightStyle: opts.highlightStyle ?? theme.editor.highlightStyle,
      pageIndex: index,
      totalPages: pages.length,
      footerLeft: opts.footerLeft ?? '',
      footerRightMode: opts.footerRightMode ?? 'page',
      footerEnabled: opts.footerEnabled ?? true,
      cardCornerMode: opts.cardCornerMode ?? 'square',
    }),
  )

  return { pages, canvases }
}

/**
 * Async version of renderAllPages that handles Mermaid diagram rendering.
 *
 * Three-pass pipeline:
 *   1. Layout with estimated mermaid heights
 *   2. Async mermaid SVG rendering (all in parallel)
 *   3. Canvas drawing with rendered mermaid images
 */
export async function renderAllPagesAsync(
  opts: EngineOptions,
): Promise<{ pages: CardPage[]; canvases: HTMLCanvasElement[] }> {
  const theme: ThemeDefinition = getTheme(opts.themeId)
  const settings: TypographySettings = opts.typography

  // Pass 1: Layout
  const pages = layoutPages({
    source: opts.source,
    manualTitle: opts.manualTitle ?? '',
    settings,
    theme,
    footerEnabled: opts.footerEnabled ?? true,
  })

  // Pass 2: Collect and pre-render mermaid + math blocks
  const mermaidDefs: { pageIdx: number; blockIdx: number; block: import('./types').MermaidDisplayBlock }[] = []
  const mathDefs: { pageIdx: number; blockIdx: number; block: import('./types').MathDisplayBlock }[] = []
  for (let pi = 0; pi < pages.length; pi++) {
    const pageBlocks = pages[pi]!.blocks
    for (let bi = 0; bi < pageBlocks.length; bi++) {
      const block = pageBlocks[bi]!
      if (block.kind === 'mermaid') {
        mermaidDefs.push({ pageIdx: pi, blockIdx: bi, block })
      } else if (block.kind === 'mathBlock') {
        mathDefs.push({ pageIdx: pi, blockIdx: bi, block })
      }
    }
  }

  // Render mermaid diagrams in parallel
  if (mermaidDefs.length > 0) {
    const { renderMermaid } = await import('./mermaid')
    const results = await Promise.allSettled(
      mermaidDefs.map(({ block }) => renderMermaid(block.code)),
    )
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        const { block } = mermaidDefs[i]!
        block.renderedSvg = result.value.svg
        block.renderedImage = result.value.image
        block.renderedWidth = result.value.width
        block.renderedHeight = result.value.height
      }
    })
  }

  // Pre-render math blocks to canvas images using html2canvas
  if (mathDefs.length > 0) {
    const { renderMathToImage } = await import('./math-renderer')
    const results = await Promise.allSettled(
      mathDefs.map(({ block }) => renderMathToImage(block.formula)),
    )
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        const { block } = mathDefs[i]!
        block.html2canvasImage = result.value.canvas
        block.renderedWidth = result.value.width
        block.renderedHeight = result.value.height
      }
    })
  }

  // Pass 3: Render canvases
  const canvases = pages.map((page, index) =>
    renderCard({
      page,
      theme,
      settings,
      highlightStyle: opts.highlightStyle ?? theme.editor.highlightStyle,
      pageIndex: index,
      totalPages: pages.length,
      footerLeft: opts.footerLeft ?? '',
      footerRightMode: opts.footerRightMode ?? 'page',
      footerEnabled: opts.footerEnabled ?? true,
      cardCornerMode: opts.cardCornerMode ?? 'square',
    }),
  )

  return { pages, canvases }
}

/** Get the preview data URL for a single rendered canvas. */
export function canvasToPreviewUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

/** Get the export data URL (higher quality) for a single rendered canvas. */
export function canvasToExportUrl(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg' = 'png',
): string {
  if (format === 'jpg') return canvas.toDataURL('image/jpeg', 0.95)
  return canvas.toDataURL('image/png')
}
