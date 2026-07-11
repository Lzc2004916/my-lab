// ═══════════════════════════════════════════════════════════════════════════
// 字体加载器 — 通过 Font Face API 按需加载 Web 字体
// ═══════════════════════════════════════════════════════════════════════════

export interface FontLoadOptions {
  /** 字体粗细（例如 400, 600, 700）。默认：400 */
  weight?: number
  /** 字体样式。默认：'normal' */
  style?: 'normal' | 'italic'
  /** font-display 策略。默认：'swap' */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  /** Unicode 范围用于子集加载。默认：undefined（完整字符集） */
  unicodeRange?: string
}

export interface FontEntry {
  family: string
  url: string
  fallback: string
  category: 'serif' | 'sans-serif' | 'monospace' | 'cursive' | 'handwriting'
  display: 'swap' | 'block' | 'fallback' | 'optional'
  weight?: number[]
}

// ── 已加载字体追踪器 ─────────────────────────────────────────────────

const loadedFonts = new Set<string>()

function fontKey(family: string, weight: number, style: string): string {
  return `${family}:${weight}:${style}`
}

// ── Font Face API 加载器 ────────────────────────────────────────────────

/**
 * 使用 Font Face API 加载单个 Web 字体。
 * 成功时返回 FontFace，失败时返回 null。
 */
export async function loadFont(
  family: string,
  url: string,
  options: FontLoadOptions = {},
): Promise<FontFace | null> {
  const {
    weight = 400,
    style = 'normal',
    display = 'swap',
    unicodeRange,
  } = options

  const key = fontKey(family, weight, style)

  // 如果已加载则跳过
  if (loadedFonts.has(key)) {
    return null
  }

  // 检查浏览器是否已有该字体
  if (document.fonts.check(`${style} ${weight} 12px "${family}"`)) {
    loadedFonts.add(key)
    return null
  }

  try {
    const descriptors: FontFaceDescriptors = {
      weight: String(weight),
      style,
      display,
    }
    if (unicodeRange) {
      ;(descriptors as Record<string, string>).unicodeRange = unicodeRange
    }

    const fontFace = new FontFace(family, `url(${url})`, descriptors)
    const loaded = await fontFace.load()
    document.fonts.add(loaded)
    loadedFonts.add(key)
    return loaded
  } catch (err) {
    console.warn(`[font-loader] Failed to load font "${family}" (${weight} ${style}):`, err)
    return null
  }
}

/**
 * 检查浏览器中是否可用某个字体家族。
 */
export function isFontAvailable(family: string): boolean {
  return document.fonts.check(`12px "${family}"`)
}

/**
 * 预加载需要的关键字体。
 * 在应用初始化早期调用。
 */
export async function preloadCriticalFonts(): Promise<void> {
  const critical: { family: string; url: string; options: FontLoadOptions }[] = [
    {
      family: 'Inter',
      url: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
      options: { weight: 400, display: 'swap' },
    },
    {
      family: 'Inter',
      url: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
      options: { weight: 600, display: 'swap' },
    },
  ]

  await Promise.allSettled(
    critical.map((f) => loadFont(f.family, f.url, f.options)),
  )
}

/**
 * 获取所有已加载的字体键。
 */
export function getLoadedFonts(): string[] {
  return Array.from(loadedFonts)
}

/**
 * 等待所有文档字体就绪。
 * 当 document.fonts.ready 解析时返回。
 */
export async function waitForFonts(): Promise<void> {
  await document.fonts.ready
}

/**
 * 加载字体条目定义中的所有字体。
 */
export async function loadFontEntry(entry: FontEntry): Promise<void> {
  const weights = entry.weight ?? [400]
  await Promise.allSettled(
    weights.map((weight) =>
      loadFont(entry.family, entry.url, {
        weight,
        display: entry.display,
      }),
    ),
  )
}

/**
 * 清除已加载字体缓存（用于测试）。
 */
export function clearFontCache(): void {
  loadedFonts.clear()
}