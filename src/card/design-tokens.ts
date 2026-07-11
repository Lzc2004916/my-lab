// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 设计令牌系统
// ═══════════════════════════════════════════════════════════════════════════
//
// 提供从 ThemeDefinition 提取的规范视觉规范。
// 令牌作为主题数据与 Canvas 渲染和 CSS 自定义属性之间的抽象层。
//

import type { ThemeDefinition, GradientConfig } from './types'
import { BODY_TEXT_WEIGHT } from './types'

// ── Design token shape ──────────────────────────────────────────────────────

export interface CardDesignTokens {
  /** 主卡片背景颜色 */
  bgColor: string
  /** 正文 / 内容文本颜色 */
  bodyColor: string
  /** 正文字体粗细（数字，例如 400） */
  bodyFontWeight: number
  /** 正文字体大小（px） */
  bodyFontSize: number
  /** 正文行高倍率 */
  bodyLineHeight: number
  /** 是否启用渐变叠加 */
  gradientEnabled: boolean
  /** 渐变颜色停靠点 1 */
  gradientColor1: string
  /** 渐变颜色停靠点 2 */
  gradientColor2: string
  /** 渐变角度（度，CSS 约定） */
  gradientAngle: number
}

// ── Token extraction ────────────────────────────────────────────────────────

/** 未指定时使用的默认渐变角度。 */
const DEFAULT_GRADIENT_ANGLE = 135

/**
 * 从主题中提取规范的设计令牌，可选覆盖
 * 来自渐变选择器和标题自定义。
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

/** 将每个设计令牌映射到其对应的 CSS 自定义属性名称。 */
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
 * 将设计令牌作为 CSS 自定义属性应用到 DOM 元素。
 * 数字被转换为字符串；布尔值变为 '1' / '0'。
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

/** 将设计令牌序列化为 JSON 字符串以持久化。 */
export function tokensToJSON(tokens: CardDesignTokens): string {
  return JSON.stringify(tokens)
}

/** 从 JSON 反序列化设计令牌。解析失败时返回 null。 */
export function tokensFromJSON(json: string): CardDesignTokens | null {
  try {
    const parsed = JSON.parse(json)
    // 基本结构验证
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