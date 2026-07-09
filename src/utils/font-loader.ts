// ═══════════════════════════════════════════════════════════════════════════
// Font Loader — on-demand web font loading via Font Face API
// ═══════════════════════════════════════════════════════════════════════════

export interface FontLoadOptions {
  /** Font weight (e.g. 400, 600, 700). Default: 400 */
  weight?: number
  /** Font style. Default: 'normal' */
  style?: 'normal' | 'italic'
  /** font-display strategy. Default: 'swap' */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  /** Unicode range for subset loading. Default: undefined (full charset) */
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

// ── Loaded font tracker ─────────────────────────────────────────────────

const loadedFonts = new Set<string>()

function fontKey(family: string, weight: number, style: string): string {
  return `${family}:${weight}:${style}`
}

// ── Font Face API loader ────────────────────────────────────────────────

/**
 * Load a single web font using the Font Face API.
 * Returns the FontFace on success, null on failure.
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

  // Skip if already loaded
  if (loadedFonts.has(key)) {
    return null
  }

  // Check if browser already has it
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
 * Check if a font family is available in the browser.
 */
export function isFontAvailable(family: string): boolean {
  return document.fonts.check(`12px "${family}"`)
}

/**
 * Preload critical fonts that are needed immediately.
 * Call early in app initialization.
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
 * Get all loaded font keys.
 */
export function getLoadedFonts(): string[] {
  return Array.from(loadedFonts)
}

/**
 * Wait for all document fonts to be ready.
 * Resolves when document.fonts.ready resolves.
 */
export async function waitForFonts(): Promise<void> {
  await document.fonts.ready
}

/**
 * Load all fonts in a font entry definition.
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
 * Clear the loaded font cache (useful for testing).
 */
export function clearFontCache(): void {
  loadedFonts.clear()
}
