// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — extended font configuration with web font URLs
// ═══════════════════════════════════════════════════════════════════════════

import type { TitleFontMode, BodyFontMode, ThemeDefinition } from './types'
import { TITLE_FONT_MODES, BODY_FONT_MODES } from './types'
import type { FontEntry } from '@/utils/font-loader'

// ── Web font manifest ──────────────────────────────────────────────────────

/**
 * Web font entries for fonts that may not be installed locally.
 * System fonts (SimSun, KaiTi, Microsoft YaHei, PingFang SC) are assumed
 * to be available on the target platform; only web fonts are listed here.
 */
export const WEB_FONT_MANIFEST: Record<string, FontEntry> = {
  // ── Title CJK web fonts ──────────────────────────────────────────────
  'Noto Serif SC': {
    family: 'Noto Serif SC',
    url: 'https://fonts.gstatic.com/s/notoserifsc/v31/H4c8BXePl9DZ0Xe7gG9cyOj7mm63SzZBEtERe7Y.woff2',
    fallback: '"Songti SC","SimSun",serif',
    category: 'serif',
    display: 'swap',
    weight: [400, 600, 700],
  },
  'LXGW WenKai': {
    family: 'LXGW WenKai',
    url: '', // Not on Google Fonts — fallback to KaiTi
    fallback: '"KaiTi","STKaiti",serif',
    category: 'handwriting',
    display: 'swap',
    weight: [400],
  },
  'Alibaba PuHuiTi': {
    family: 'Alibaba PuHuiTi',
    url: '', // CDN-only; use system PingFang SC fallback
    fallback: '"PingFang SC","Microsoft YaHei",sans-serif',
    category: 'sans-serif',
    display: 'swap',
    weight: [400, 700],
  },

  // ── Title Latin web fonts ────────────────────────────────────────────
  'Cormorant Garamond': {
    family: 'Cormorant Garamond',
    url: 'https://fonts.gstatic.com/s/cormorantgaramond/v19/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYpHtKky2F7i6C.woff2',
    fallback: '"EB Garamond","Times New Roman",serif',
    category: 'serif',
    display: 'swap',
    weight: [400, 600, 700],
  },
  'Inter': {
    family: 'Inter',
    url: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
    fallback: '"Helvetica Neue","Arial",sans-serif',
    category: 'sans-serif',
    display: 'swap',
    weight: [400, 600, 700, 800],
  },
  'Playfair Display': {
    family: 'Playfair Display',
    url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2',
    fallback: '"Cormorant Garamond","Times New Roman",serif',
    category: 'serif',
    display: 'swap',
    weight: [400, 600, 700],
  },
  'JetBrains Mono': {
    family: 'JetBrains Mono',
    url: 'https://fonts.gstatic.com/s/jetbrainsmono/v20/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff2',
    fallback: '"Cascadia Code","SF Mono","Consolas",monospace',
    category: 'monospace',
    display: 'swap',
    weight: [400, 700],
  },

  // ── Handwriting / decorative Latin ────────────────────────────────────
  'Caveat': {
    family: 'Caveat',
    url: 'https://fonts.gstatic.com/s/caveat/v22/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9eIipYSxP.woff2',
    fallback: '"Brush Script MT",cursive',
    category: 'handwriting',
    display: 'swap',
    weight: [400, 500, 600],
  },
}

// ── Font dependency resolver ────────────────────────────────────────────────

/**
 * Extract all font families referenced in a title font mode.
 */
function getTitleFontFamilies(mode: TitleFontMode): string[] {
  const config = TITLE_FONT_MODES[mode] ?? TITLE_FONT_MODES.serif
  const families: string[] = []

  // Parse CSS font-family strings
  for (const fontStr of [config.family, config.latinFamily]) {
    const parsed = fontStr
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
    families.push(...parsed)
  }

  return [...new Set(families)]
}

/**
 * Extract all font families referenced in a body font mode.
 */
function getBodyFontFamilies(mode: BodyFontMode): string[] {
  const config = BODY_FONT_MODES[mode] ?? BODY_FONT_MODES.wenkai
  return config.family
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

/**
 * Get the set of web font entries required by a given theme.
 * Only returns fonts that have defined web font URLs (not system fonts).
 */
export function getRequiredWebFonts(theme: ThemeDefinition): FontEntry[] {
  const familySet = new Set<string>()

  // Title fonts
  const titleMode = theme.editor.titleFontMode ?? 'serif'
  for (const family of getTitleFontFamilies(titleMode)) {
    familySet.add(family)
  }

  // Body fonts (default to wenkai since bodyFontMode is set externally)
  for (const mode of ['wenkai', 'yahei', 'simsun', 'kaiti', 'dengxian', 'fangsong'] as BodyFontMode[]) {
    for (const family of getBodyFontFamilies(mode)) {
      familySet.add(family)
    }
  }

  // Mono fonts (always needed for code blocks)
  familySet.add('JetBrains Mono')

  // Return only fonts that have web font entries
  const entries: FontEntry[] = []
  for (const family of familySet) {
    const entry = WEB_FONT_MANIFEST[family]
    if (entry && entry.url) {
      entries.push(entry)
    }
  }

  return entries
}

/**
 * Get the recommended font loading strategy for a given font category.
 */
export function getFontDisplayStrategy(
  category: FontEntry['category'],
): 'swap' | 'block' | 'optional' {
  switch (category) {
    case 'serif':
    case 'handwriting':
      // Decorative fonts: block briefly to avoid jarring swap
      return 'block'
    case 'monospace':
      // Code fonts: optional — fallback mono is fine
      return 'optional'
    default:
      // Body text: swap is safest for readability
      return 'swap'
  }
}
