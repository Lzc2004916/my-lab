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
import { getTheme } from './themes'

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
