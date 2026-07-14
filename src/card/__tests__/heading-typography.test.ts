// ═══════════════════════════════════════════════════════════════════════════
// Heading Typography 单元测试
// 验证 per-theme heading config、fallback、cover page 大字报效果
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest'
import {
  resolveHeadingScale,
  resolveHeadingLineHeight,
  resolveHeadingMarginTop,
  resolveHeadingMarginBottom,
  resolveHeadingFontWeight,
  resolveHeadingColor,
  HEADING_SIZE_RATIOS,
  DEFAULT_HEADING_LINE_HEIGHTS,
  DEFAULT_HEADING_MARGIN_TOP,
  DEFAULT_HEADING_MARGIN_BOTTOM,
  DEFAULT_COVER_H1_SCALE,
  SUBHEADING_TEXT_WEIGHT,
} from '../types'
import type { ThemeDefinition } from '../types'
import { getTheme } from '../theme-registry'

// ── Test helpers ──────────────────────────────────────────────────────────

/** 标准回退主题 — 无 heading 配置，验证默认回退行为。 */
function makeTheme(overrides?: Partial<ThemeDefinition['editor']> & {
  coverHeading?: ThemeDefinition['coverHeading']
}): ThemeDefinition {
  return {
    id: 'test-theme',
    name: 'Test',
    mood: 'test',
    preset: 'test',
    description: '',
    tags: [],
    mode: 'paper',
    palette: {
      page: '#ffffff', pageAlt: '#f0f0f0', text: '#000000', muted: '#888888',
      accent: '#ff0000', accentSoft: 'rgba(255,0,0,0.1)',
      border: 'rgba(0,0,0,0.1)', shadow: 'rgba(0,0,0,0.1)', glow: 'rgba(255,0,0,0.05)',
    },
    surface: {
      grainAlpha: 0, vignetteAlpha: 0, washStrength: 0, innerFrameAlpha: 0,
      innerFrameInset: 24, titleAccentMix: 0.5, footerLineAlpha: 0.2, footerTextAlpha: 0.9,
      previewShadow: 'none',
    },
    components: {
      quoteFillAlpha: 0.05, quoteStrokeAlpha: 0.08, quoteBarAlpha: 0.7, quoteRadius: 8,
      quoteTreatment: 'paper', highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.7, highlightMarkerAlpha: 0.3, highlightDashAlpha: 0.8,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.8,
      highlightStyle: 'underline',
      ...overrides,
    },
    category: 'light',
    coverHeading: overrides?.coverHeading,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// resolveHeadingScale
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveHeadingScale', () => {
  it('falls back to HEADING_SIZE_RATIOS when theme has no heading config', () => {
    const theme = makeTheme()
    expect(resolveHeadingScale(1, theme)).toBe(HEADING_SIZE_RATIOS[1])  // 3.20
    expect(resolveHeadingScale(2, theme)).toBe(HEADING_SIZE_RATIOS[2])  // 1.65
    expect(resolveHeadingScale(3, theme)).toBe(HEADING_SIZE_RATIOS[3])  // 1.35
    expect(resolveHeadingScale(6, theme)).toBe(HEADING_SIZE_RATIOS[6])  // 0.98
  })

  it('returns HEADING_SIZE_RATIOS fallback when theme is undefined', () => {
    expect(resolveHeadingScale(1, undefined)).toBe(HEADING_SIZE_RATIOS[1])
    expect(resolveHeadingScale(3, undefined)).toBe(HEADING_SIZE_RATIOS[3])
  })

  it('uses per-theme heading scale overrides', () => {
    const theme = makeTheme({
      heading: { h1Scale: 4.0, h2Scale: 1.8 },
    })
    expect(resolveHeadingScale(1, theme)).toBe(4.0)
    expect(resolveHeadingScale(2, theme)).toBe(1.8)
    // 未配置的级别回退到默认值
    expect(resolveHeadingScale(3, theme)).toBe(HEADING_SIZE_RATIOS[3])
  })

  it('uses DEFAULT_COVER_H1_SCALE for cover page H1 when no override', () => {
    const theme = makeTheme()
    expect(resolveHeadingScale(1, theme, true)).toBe(DEFAULT_COVER_H1_SCALE) // 4.0
    // Non-H1 levels on cover use default ratios
    expect(resolveHeadingScale(2, theme, true)).toBe(HEADING_SIZE_RATIOS[2])
  })

  it('uses theme heading cover config for cover page when no coverHeading exists', () => {
    const theme = makeTheme({
      heading: { h1Scale: 3.5 },
    })
    // Without coverHeading, cover page uses heading config h1Scale
    expect(resolveHeadingScale(1, theme, true)).toBe(3.5)
  })

  it('returns 1 for unknown heading levels', () => {
    expect(resolveHeadingScale(7, makeTheme())).toBe(1)
    expect(resolveHeadingScale(0, makeTheme())).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// resolveHeadingLineHeight
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveHeadingLineHeight', () => {
  it('falls back to DEFAULT_HEADING_LINE_HEIGHTS when theme has no heading config', () => {
    const theme = makeTheme()
    expect(resolveHeadingLineHeight(1, theme)).toBe(DEFAULT_HEADING_LINE_HEIGHTS[1]) // 1.25
    expect(resolveHeadingLineHeight(3, theme)).toBe(DEFAULT_HEADING_LINE_HEIGHTS[3]) // 1.45
    expect(resolveHeadingLineHeight(6, theme)).toBe(DEFAULT_HEADING_LINE_HEIGHTS[6]) // 1.55
  })

  it('uses per-theme line height overrides', () => {
    const theme = makeTheme({
      heading: { h1LineHeight: 1.1, h2LineHeight: 1.2 },
    })
    expect(resolveHeadingLineHeight(1, theme)).toBe(1.1)
    expect(resolveHeadingLineHeight(2, theme)).toBe(1.2)
    expect(resolveHeadingLineHeight(3, theme)).toBe(DEFAULT_HEADING_LINE_HEIGHTS[3])
  })

  it('uses compact line height for cover page H1 by default', () => {
    const theme = makeTheme()
    expect(resolveHeadingLineHeight(1, theme, true)).toBe(1.15) // cover default
  })

  it('uses theme coverHeading line height for cover page when specified', () => {
    // Note: coverHeading.h1LineHeight is resolved via resolveHeadingLineHeight
    // when isCover=true and level=1 with heading config
    const theme = makeTheme({
      heading: { h1LineHeight: 1.08 },
    })
    expect(resolveHeadingLineHeight(1, theme, true)).toBe(1.08)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// resolveHeadingMarginTop / resolveHeadingMarginBottom
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveHeadingMarginTop', () => {
  it('falls back to DEFAULT_HEADING_MARGIN_TOP', () => {
    expect(resolveHeadingMarginTop(1, makeTheme())).toBe(DEFAULT_HEADING_MARGIN_TOP[1]) // 16
    expect(resolveHeadingMarginTop(2, makeTheme())).toBe(DEFAULT_HEADING_MARGIN_TOP[2]) // 12
    expect(resolveHeadingMarginTop(3, makeTheme())).toBe(DEFAULT_HEADING_MARGIN_TOP[3]) // 8
  })

  it('uses per-theme margin overrides', () => {
    const theme = makeTheme({
      heading: { h1MarginTop: 30, h2MarginTop: 20 },
    })
    expect(resolveHeadingMarginTop(1, theme)).toBe(30)
    expect(resolveHeadingMarginTop(2, theme)).toBe(20)
    expect(resolveHeadingMarginTop(3, theme)).toBe(DEFAULT_HEADING_MARGIN_TOP[3])
  })

  it('returns default for unknown levels', () => {
    expect(resolveHeadingMarginTop(7, makeTheme())).toBe(4)
  })
})

describe('resolveHeadingMarginBottom', () => {
  it('falls back to DEFAULT_HEADING_MARGIN_BOTTOM', () => {
    expect(resolveHeadingMarginBottom(1, makeTheme())).toBe(DEFAULT_HEADING_MARGIN_BOTTOM[1]) // 8
  })

  it('uses per-theme margin overrides', () => {
    const theme = makeTheme({
      heading: { h1MarginBottom: 16, h2MarginBottom: 8 },
    })
    expect(resolveHeadingMarginBottom(1, theme)).toBe(16)
    expect(resolveHeadingMarginBottom(2, theme)).toBe(8)
    expect(resolveHeadingMarginBottom(3, theme)).toBe(DEFAULT_HEADING_MARGIN_BOTTOM[3])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// resolveHeadingFontWeight
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveHeadingFontWeight', () => {
  it('falls back to SUBHEADING_TEXT_WEIGHT when no heading config', () => {
    expect(resolveHeadingFontWeight(1, makeTheme())).toBe(SUBHEADING_TEXT_WEIGHT) // 600
    expect(resolveHeadingFontWeight(3, makeTheme())).toBe(SUBHEADING_TEXT_WEIGHT)
  })

  it('uses per-theme font weight overrides', () => {
    const theme = makeTheme({
      heading: { h1FontWeight: 900, h2FontWeight: 700 },
    })
    expect(resolveHeadingFontWeight(1, theme)).toBe(900)
    expect(resolveHeadingFontWeight(2, theme)).toBe(700)
    expect(resolveHeadingFontWeight(3, theme)).toBe(SUBHEADING_TEXT_WEIGHT)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// resolveHeadingColor
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveHeadingColor', () => {
  it('returns undefined when theme has no heading color config', () => {
    expect(resolveHeadingColor(1, makeTheme())).toBeUndefined()
    expect(resolveHeadingColor(2, makeTheme())).toBeUndefined()
  })

  it('returns per-theme heading color overrides', () => {
    const theme = makeTheme({
      heading: { h1Color: '#ff0000', h2Color: '#00ff00' },
    })
    expect(resolveHeadingColor(1, theme)).toBe('#ff0000')
    expect(resolveHeadingColor(2, theme)).toBe('#00ff00')
    expect(resolveHeadingColor(3, theme)).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 综合 — 真实主题验证
// ═══════════════════════════════════════════════════════════════════════════

describe('Real theme integration', () => {
  it('brutalist-raw theme has heading config with huge H1 scale', () => {
    // 导入并验证 brutalist-raw 主题的 heading config
    const theme = getTheme('brutalist-raw')

    expect(theme.editor.heading).toBeDefined()
    expect(theme.editor.heading!.h1Scale).toBe(4.4)
    expect(theme.editor.heading!.h1FontWeight).toBe(900)
    expect(theme.coverHeading).toBeDefined()
    expect(theme.coverHeading!.h1Scale).toBe(5.8)
    expect(theme.coverHeading!.centered).toBe(true)

    // 验证分辨率函数
    const scale = resolveHeadingScale(1, theme)
    expect(scale).toBe(4.4)
    const coverScale = resolveHeadingScale(1, theme, true)
    expect(coverScale).toBe(4.4) // heading config takes precedence
    const weight = resolveHeadingFontWeight(1, theme)
    expect(weight).toBe(900)
  })

  it('swiss-modern theme has clean, tight heading config', () => {
    const theme = getTheme('swiss-modern')

    expect(theme.editor.heading).toBeDefined()
    expect(theme.editor.heading!.h1Scale).toBe(3.0)
    expect(theme.editor.heading!.h1FontWeight).toBe(800)
    expect(theme.editor.heading!.h2Scale).toBe(1.55)

    const h1Size = resolveHeadingScale(1, theme)
    // bodySize 28 * 3.0 = 84
    expect(Math.round(theme.editor.bodySize * h1Size)).toBe(84)
  })

  it('warm-editor theme falls back to defaults (no heading config)', () => {
    const theme = getTheme('warm-editor')

    // warm-editor has no heading config — uses defaults
    expect(theme.editor.heading).toBeUndefined()
    expect(resolveHeadingScale(1, theme)).toBe(HEADING_SIZE_RATIOS[1])
    expect(resolveHeadingScale(2, theme)).toBe(HEADING_SIZE_RATIOS[2])
  })

  it('gold-luxe theme has gold h1 color', () => {
    const theme = getTheme('gold-luxe')

    expect(theme.editor.heading).toBeDefined()
    expect(theme.editor.heading!.h1Color).toBe('#c8a44e')
    const color = resolveHeadingColor(1, theme)
    expect(color).toBe('#c8a44e')
  })

  it('theme without heading config resolves everything from defaults', () => {
    const theme = makeTheme() // no heading, no coverHeading

    for (let level = 1; level <= 6; level++) {
      expect(resolveHeadingScale(level, theme)).toBe(HEADING_SIZE_RATIOS[level])
      expect(resolveHeadingLineHeight(level, theme)).toBe(DEFAULT_HEADING_LINE_HEIGHTS[level])
      if (level <= 3) {
        expect(resolveHeadingMarginTop(level, theme)).toBe(DEFAULT_HEADING_MARGIN_TOP[level])
        expect(resolveHeadingMarginBottom(level, theme)).toBe(DEFAULT_HEADING_MARGIN_BOTTOM[level])
      }
      expect(resolveHeadingFontWeight(level, theme)).toBe(SUBHEADING_TEXT_WEIGHT)
      expect(resolveHeadingColor(level, theme)).toBeUndefined()
    }
  })
})
