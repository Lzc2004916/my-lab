// ═══════════════════════════════════════════════════════════════════════════
// Heading Override 单元测试
// 验证 HeadingStyleOverrides 类型、resolveHeadingSize 及渲染管线集成
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest'
import {
  resolveHeadingSize,
  HEADING_SIZE_RATIOS,
  DEFAULT_COVER_H1_SCALE,
  DEFAULT_HEADING_OVERRIDES,
  HEADING_SIZE_RANGES,
} from '../types'
import type { HeadingStyleOverrides, ThemeDefinition } from '../types'
import { getTheme } from '../theme-registry'

// ── Test helpers ──────────────────────────────────────────────────────────

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

function noOverrides(): HeadingStyleOverrides {
  return { ...DEFAULT_HEADING_OVERRIDES }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT_HEADING_OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════

describe('DEFAULT_HEADING_OVERRIDES', () => {
  it('all size overrides are null (use theme defaults)', () => {
    expect(DEFAULT_HEADING_OVERRIDES.h1Size).toBeNull()
    expect(DEFAULT_HEADING_OVERRIDES.h2Size).toBeNull()
    expect(DEFAULT_HEADING_OVERRIDES.h3Size).toBeNull()
    expect(DEFAULT_HEADING_OVERRIDES.h4Size).toBeNull()
    expect(DEFAULT_HEADING_OVERRIDES.h5Size).toBeNull()
    expect(DEFAULT_HEADING_OVERRIDES.h6Size).toBeNull()
  })

  it('default h1Align is left', () => {
    expect(DEFAULT_HEADING_OVERRIDES.h1Align).toBe('left')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// HEADING_SIZE_RANGES
// ═══════════════════════════════════════════════════════════════════════════

describe('HEADING_SIZE_RANGES', () => {
  it('H1 range is 16-120 with default 32', () => {
    expect(HEADING_SIZE_RANGES[1]).toEqual({ min: 16, max: 120, default: 32 })
  })

  it('ranges descend for lower levels', () => {
    expect(HEADING_SIZE_RANGES[6].max).toBeLessThan(HEADING_SIZE_RANGES[1].max)
    expect(HEADING_SIZE_RANGES[6].min).toBeLessThan(HEADING_SIZE_RANGES[1].min)
  })

  it('all levels have valid default within min-max', () => {
    for (let l = 1; l <= 6; l++) {
      const r = HEADING_SIZE_RANGES[l]!
      expect(r.default).toBeGreaterThanOrEqual(r.min)
      expect(r.default).toBeLessThanOrEqual(r.max)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// resolveHeadingSize
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveHeadingSize', () => {
  const bodySize = 30

  it('falls back to theme heading config when no overrides', () => {
    const theme = makeTheme()
    // No heading config → uses HEADING_SIZE_RATIOS
    const expectedH1 = Math.round(bodySize * HEADING_SIZE_RATIOS[1]) // 96
    expect(resolveHeadingSize(1, bodySize, theme, null)).toBe(expectedH1)
  })

  it('user override wins over theme config', () => {
    const theme = makeTheme({
      heading: { h1Scale: 3.0, h2Scale: 1.5 },
    })
    const overrides = { ...noOverrides(), h1Size: 48 }
    expect(resolveHeadingSize(1, bodySize, theme, overrides)).toBe(48)
  })

  it('user override wins over HEADING_SIZE_RATIOS fallback', () => {
    const theme = makeTheme() // no heading config
    const overrides = { ...noOverrides(), h2Size: 28 }
    expect(resolveHeadingSize(2, bodySize, theme, overrides)).toBe(28)
  })

  it('falls through to theme config when override is null', () => {
    const theme = makeTheme({
      heading: { h1Scale: 2.5 },
    })
    const overrides = noOverrides() // all null
    const expected = Math.round(bodySize * 2.5) // 75
    expect(resolveHeadingSize(1, bodySize, theme, overrides)).toBe(expected)
  })

  it('falls through to HEADING_SIZE_RATIOS when theme has no heading config and no overrides', () => {
    const theme = makeTheme()
    const expected = Math.round(bodySize * HEADING_SIZE_RATIOS[3]) // 30 * 1.35 ≈ 41
    expect(resolveHeadingSize(3, bodySize, theme, noOverrides())).toBe(expected)
  })

  it('cover page H1 uses cover scale when no overrides', () => {
    const theme = makeTheme()
    // Without cover config override, uses DEFAULT_COVER_H1_SCALE = 4.0
    const coverSize = resolveHeadingSize(1, bodySize, theme, null, true)
    expect(coverSize).toBe(Math.round(bodySize * DEFAULT_COVER_H1_SCALE)) // 120
  })

  it('user override still wins on cover page', () => {
    const theme = makeTheme()
    const overrides = { ...noOverrides(), h1Size: 56 }
    expect(resolveHeadingSize(1, bodySize, theme, overrides, true)).toBe(56)
  })

  it('returns 0 or negative only if user sets invalid value (edge case)', () => {
    const theme = makeTheme()
    // Override with 0 or negative — function should still return the exact value
    // (validation happens upstream in the panel)
    const badOverrides = { ...noOverrides(), h1Size: 0 }
    // 0 is not > 0, so falls through to theme default
    expect(resolveHeadingSize(1, bodySize, theme, badOverrides)).toBeGreaterThan(0)
  })

  it('works for all heading levels 1-6', () => {
    const theme = makeTheme({
      heading: {
        h1Scale: 2.0, h2Scale: 1.8, h3Scale: 1.6,
        h4Scale: 1.4, h5Scale: 1.2, h6Scale: 1.0,
      },
    })
    for (let l = 1; l <= 6; l++) {
      const size = resolveHeadingSize(l, bodySize, theme, null)
      expect(size).toBeGreaterThan(0)
      expect(Number.isFinite(size)).toBe(true)
    }
  })

  it('per-level overrides are independent', () => {
    const theme = makeTheme()
    const overrides: HeadingStyleOverrides = {
      ...noOverrides(),
      h1Size: 50,
      h2Size: 30,
      h3Size: null, // use theme
    }
    expect(resolveHeadingSize(1, bodySize, theme, overrides)).toBe(50)
    expect(resolveHeadingSize(2, bodySize, theme, overrides)).toBe(30)
    // h3 falls through
    expect(resolveHeadingSize(3, bodySize, theme, overrides)).toBe(
      Math.round(bodySize * HEADING_SIZE_RATIOS[3]),
    )
  })

  it('handles undefined overrides gracefully', () => {
    const theme = makeTheme()
    expect(resolveHeadingSize(1, bodySize, theme, undefined)).toBe(
      Math.round(bodySize * HEADING_SIZE_RATIOS[1]),
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Integration with real themes
// ═══════════════════════════════════════════════════════════════════════════

describe('Real theme + override integration', () => {
  it('brutalist-raw H1 override overrides its 4.2x scale', () => {
    const theme = getTheme('brutalist-raw')
    const overrides = { ...noOverrides(), h1Size: 60 }
    const size = resolveHeadingSize(1, theme.editor.bodySize, theme, overrides)
    expect(size).toBe(60)
  })

  it('swiss-modern H2 override overrides its 1.55x scale', () => {
    const theme = getTheme('swiss-modern')
    const overrides = { ...noOverrides(), h2Size: 32 }
    const size = resolveHeadingSize(2, theme.editor.bodySize, theme, overrides)
    expect(size).toBe(32)
  })

  it('theme without heading config uses defaults + overrides', () => {
    const theme = getTheme('warm-editor')
    expect(theme.editor.heading).toBeUndefined()

    // Without override: uses HEADING_SIZE_RATIOS
    const defaultSize = resolveHeadingSize(1, theme.editor.bodySize, theme, null)
    expect(defaultSize).toBe(Math.round(theme.editor.bodySize * HEADING_SIZE_RATIOS[1]))

    // With override: uses override
    const overrides = { ...noOverrides(), h1Size: 42 }
    expect(resolveHeadingSize(1, theme.editor.bodySize, theme, overrides)).toBe(42)
  })
})
