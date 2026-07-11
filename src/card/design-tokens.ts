// ═══════════════════════════════════════════════════════════════════════════
// CardPreview module — Design Token System
// ═══════════════════════════════════════════════════════════════════════════
//
// Provides a canonical visual spec extracted from ThemeDefinition.
// Tokens serve as an abstraction layer between theme data and both
// Canvas rendering + CSS custom properties.
//

import type { ThemeDefinition, GradientConfig } from './types'
import { BODY_TEXT_WEIGHT } from './types'

// ── Design token shape ──────────────────────────────────────────────────────

export interface CardDesignTokens {
  /** Main card background color */
  bgColor: string
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
): CardDesignTokens {
  const grad = gradientOverride ?? theme.gradient

  return {
    bgColor: theme.palette.page,
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
      'bgColor', 'bodyColor', 'bodyFontWeight', 'bodyFontSize',
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
