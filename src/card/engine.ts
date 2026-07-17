// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 统一引擎
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CardPage,
  GradientConfig,
  HighlightStyle,
  FooterRightMode,
  CardCornerMode,
  ThemeDefinition,
  TypographySettings,
  HeadingStyleOverrides,
} from './types'
import { layoutPages } from './layout'
import { renderCard } from './renderer'
import { getTheme } from './theme-registry'

// ═══════════════════════════════════════════════════════════════════════════
// 引擎选项
// ═══════════════════════════════════════════════════════════════════════════

export interface EngineOptions {
  /** Markdown 源文本 */
  source: string
  /** 主题 ID 字符串（例如 'moss-paper'） */
  themeId: string
  /** 排版设置 */
  typography: TypographySettings
  /** 高亮样式 */
  highlightStyle: HighlightStyle
  /** 页脚左侧文本 */
  footerLeft?: string
  /** 页脚右侧模式 */
  footerRightMode?: FooterRightMode
  /** 是否显示页脚 */
  footerEnabled?: boolean
  /** 卡片圆角模式 */
  cardCornerMode?: CardCornerMode
  /** 背景渐变覆盖 */
  gradientConfig?: GradientConfig
  /** 用户自定义标题样式覆盖 */
  headingOverrides?: HeadingStyleOverrides | null
}

// ═══════════════════════════════════════════════════════════════════════════

/** 为给定源文本渲染所有页面。返回 canvas，每页一个。 */
export function renderAllPages(
  opts: EngineOptions,
): { pages: CardPage[]; canvases: HTMLCanvasElement[] } {
  const theme: ThemeDefinition = getTheme(opts.themeId)
  const settings: TypographySettings = opts.typography

  const pages = layoutPages({
    source: opts.source,
    settings,
    theme,
    footerEnabled: opts.footerEnabled ?? true,
    headingOverrides: opts.headingOverrides,
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
      gradientConfig: opts.gradientConfig,
      headingOverrides: opts.headingOverrides,
    }),
  )

  return { pages, canvases }
}

/**
 * 异步渲染所有页面。
 *
 * 每渲染一页后 yield 主线程（setTimeout(0)），确保 UI 保持响应。
 * 传入 AbortSignal 可在渲染期间取消——取消时抛出 AbortError。
 *
 * layoutPages 保持同步（解析阶段通常 < 50ms），仅逐页渲染在
 * 微任务间拆散。
 */
export async function renderAllPagesAsync(
  opts: EngineOptions,
  signal?: AbortSignal,
): Promise<{ pages: CardPage[]; canvases: HTMLCanvasElement[] }> {
  const theme: ThemeDefinition = getTheme(opts.themeId)
  const settings: TypographySettings = opts.typography

  // layout 保持同步（开销可控）
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const pages = layoutPages({
    source: opts.source,
    settings,
    theme,
    footerEnabled: opts.footerEnabled ?? true,
    headingOverrides: opts.headingOverrides,
  })

  const canvases: HTMLCanvasElement[] = []

  for (let i = 0; i < pages.length; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    canvases.push(
      renderCard({
        page: pages[i]!,
        theme,
        settings,
        highlightStyle: opts.highlightStyle ?? theme.editor.highlightStyle,
        pageIndex: i,
        totalPages: pages.length,
        footerLeft: opts.footerLeft ?? '',
        footerRightMode: opts.footerRightMode ?? 'page',
        footerEnabled: opts.footerEnabled ?? true,
        cardCornerMode: opts.cardCornerMode ?? 'square',
        gradientConfig: opts.gradientConfig,
        headingOverrides: opts.headingOverrides,
      }),
    )

    // 每页渲染后 yield 主线程，让浏览器处理用户输入/滚动
    if (i < pages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  return { pages, canvases }
}

/** 获取单个渲染 canvas 的预览数据 URL。 */
export function canvasToPreviewUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

/** 获取单个渲染 canvas 的导出数据 URL（更高质量）。 */
export function canvasToExportUrl(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg' = 'png',
): string {
  if (format === 'jpg') return canvas.toDataURL('image/jpeg', 0.95)
  return canvas.toDataURL('image/png')
}