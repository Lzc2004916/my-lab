// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — Design Token System
// ═══════════════════════════════════════════════════════════════════════════
//
// Provides a canonical visual spec extracted from ThemeDefinition.
// Tokens serve as an abstraction layer between theme data and both
// Canvas rendering + CSS custom properties.
//

import type { ThemeDefinition, TitleCustomization, GradientConfig } from './types'
import { DEFAULT_TITLE_CUSTOM, BODY_TEXT_WEIGHT } from './types'
import { mixHexColors } from './color-utils'

// ── Design token shape ──────────────────────────────────────────────────────

export interface CardDesignTokens {
  /** Main card background color */
  bgColor: string
  /** Title text color */
  titleColor: string
  /** Title font weight (number, e.g. 600) */
  titleFontWeight: number
  /** Title font size in px */
  titleFontSize: number
  /** Title line-height multiplier */
  titleLineHeight: number
  /** Body / content text color */
  bodyColor: string
  /** Body font weight (number, e.g. 400) */
  bodyFontWeight: number
  /** Body font size in px */
  bodyFontSize: number
  /** Body line-height multiplier */
  bodyLineHeight: number
  /** Whether gradient overlay is active */
  gradientEnabled: boolean
  /** Gradient color stop 1 */
  gradientColor1: string
  /** Gradient color stop 2 */
  gradientColor2: string
  /** Gradient angle in degrees (CSS convention) */
  gradientAngle: number
}

// ── Title font weight resolver ──────────────────────────────────────────────
// Mirrors getTitleFontWeight in renderer.ts — keep in sync.
// Extracted here to avoid circular dependency between renderer ↔ design-tokens.

function getTitleFontWeight(mode: string, custom?: TitleCustomization): number {
  if (custom && custom.fontWeight > 0) return custom.fontWeight
  if (mode === 'display') return 800
  if (mode === 'handwriting') return 500
  if (mode === 'monoTitle') return 700
  return mode === 'retroSerif' || mode === 'sans' || mode === 'puhuiti'
    ? 700
    : 600
}

// ── Token extraction ────────────────────────────────────────────────────────

/** Default gradient angle used when none is specified. */
const DEFAULT_GRADIENT_ANGLE = 135

/**
 * Extract canonical design tokens from a theme, with optional overrides
 * from the gradient picker and title customization.
 */
export function extractTokens(
  theme: ThemeDefinition,
  gradientOverride?: GradientConfig,
  titleCustom?: TitleCustomization,
): CardDesignTokens {
  const tc = titleCustom ?? DEFAULT_TITLE_CUSTOM
  const grad = gradientOverride ?? theme.gradient

  // Title color: custom override > blended accent > raw text color
  const titleColor = tc.color
    ? tc.color
    : mixHexColors(theme.palette.text, theme.palette.accent, theme.surface.titleAccentMix)

  return {
    bgColor: theme.palette.page,
    titleColor,
    titleFontWeight: getTitleFontWeight(theme.editor.titleFontMode, tc),
    titleFontSize: theme.editor.titleSize,
    titleLineHeight: theme.editor.lineHeight,
    bodyColor: theme.palette.text,
    bodyFontWeight: BODY_TEXT_WEIGHT,
    bodyFontSize: theme.editor.bodySize,
    bodyLineHeight: theme.editor.lineHeight,
    gradientEnabled: grad?.enabled ?? false,
    gradientColor1: grad?.color1 ?? theme.palette.pageAlt,
    gradientColor2: grad?.color2 ?? theme.palette.page,
    gradientAngle: grad?.angle ?? DEFAULT_GRADIENT_ANGLE,
  }
}

// ── CSS custom property mapping ─────────────────────────────────────────────

/** Maps each design token to its corresponding CSS custom property name. */
export const TOKEN_CSS_VAR_MAP: Record<keyof CardDesignTokens, string> = {
  bgColor: '--card-bg-color',
  titleColor: '--card-title-color',
  titleFontWeight: '--card-title-font-weight',
  titleFontSize: '--card-title-font-size',
  titleLineHeight: '--card-title-line-height',
  bodyColor: '--card-body-color',
  bodyFontWeight: '--card-body-font-weight',
  bodyFontSize: '--card-body-font-size',
  bodyLineHeight: '--card-body-line-height',
  gradientEnabled: '--card-gradient-enabled',
  gradientColor1: '--card-gradient-color1',
  gradientColor2: '--card-gradient-color2',
  gradientAngle: '--card-gradient-angle',
}

/**
 * Apply design tokens as CSS custom properties to a DOM element.
 * Numbers are converted to strings; booleans become '1' / '0'.
 */
export function applyTokensToElement(
  el: HTMLElement,
  tokens: CardDesignTokens,
): void {
  for (const [key, varName] of Object.entries(TOKEN_CSS_VAR_MAP)) {
    const value = tokens[key as keyof CardDesignTokens]
    const strValue =
      typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
    el.style.setProperty(varName, strValue)
  }
}

// ── Serialization ───────────────────────────────────────────────────────────

/** Serialize design tokens to a JSON string for persistence. */
export function tokensToJSON(tokens: CardDesignTokens): string {
  return JSON.stringify(tokens)
}

/** Deserialize design tokens from JSON. Returns null on parse failure. */
export function tokensFromJSON(json: string): CardDesignTokens | null {
  try {
    const parsed = JSON.parse(json)
    // Basic structural validation
    const required: (keyof CardDesignTokens)[] = [
      'bgColor', 'titleColor', 'titleFontWeight', 'titleFontSize',
      'titleLineHeight', 'bodyColor', 'bodyFontWeight', 'bodyFontSize',
      'bodyLineHeight',
    ]
    for (const key of required) {
      if (!(key in parsed)) return null
    }
    return parsed as CardDesignTokens
  } catch {
    return null
  }
}
