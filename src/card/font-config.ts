// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 扩展字体配置（含 Web 字体 URL）
// ═══════════════════════════════════════════════════════════════════════════

import type { BodyFontMode, ThemeDefinition } from './types'
import { BODY_FONT_MODES } from './types'
import type { FontEntry } from '@/utils/font-loader'

// ── Web font manifest ──────────────────────────────────────────────────────

/**
 * 可能未本地安装的字体的 Web 字体条目。
 * 系统字体（SimSun, KaiTi, Microsoft YaHei, PingFang SC）假定
 * 在目标平台上可用；仅 web 字体列在此处。
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
    url: '', // 不在 Google Fonts 上 — 回退到 KaiTi
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
 * 提取正文字体模式中引用的所有字体族。
 */
function getBodyFontFamilies(mode: BodyFontMode): string[] {
  const config = BODY_FONT_MODES[mode] ?? BODY_FONT_MODES.wenkai
  return config.family
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

/**
 * 获取给定主题所需的 web 字体条目集。
 * 仅返回定义了 web 字体 URL 的字体（非系统字体）。
 */
export function getRequiredWebFonts(theme: ThemeDefinition): FontEntry[] {
  const familySet = new Set<string>()

  // 正文字体 — 仅主题的 bodyFontMode，而非全部六种
  const bodyMode = theme.editor.bodyFontMode ?? 'wenkai'
  for (const family of getBodyFontFamilies(bodyMode)) {
    familySet.add(family)
  }

  // 等宽字体（代码块始终需要）
  familySet.add('JetBrains Mono')

  // 仅返回有 web 字体条目的字体
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
 * 获取给定字体类别的推荐字体加载策略。
 */
export function getFontDisplayStrategy(
  category: FontEntry['category'],
): 'swap' | 'block' | 'optional' {
  switch (category) {
    case 'serif':
    case 'handwriting':
      // 装饰性字体：短暂阻塞以避免突兀的字体切换
      return 'block'
    case 'monospace':
      // 代码字体：可选 — 回退等宽字体即可
      return 'optional'
    default:
      // 正文文本：swap 对可读性最安全
      return 'swap'
  }
}