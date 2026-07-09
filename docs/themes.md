# Card Theme System — Developer Documentation

## Overview

The card theme system provides 16 visually distinctive themes for the markdown-to-card editor. Themes control every visual aspect of card rendering: colors, typography, textures, decorative ornaments, highlight styles, and quote treatments.

## Architecture

```
ThemeDefinition (src/card/types.ts)
  ├── palette: ThemePalette      → 9 color slots
  ├── surface: ThemeSurface      → texture, vignette, shadows
  ├── components: ThemeComponents → quote, highlight, divider styles
  ├── editor: ThemeEditor        → default typography settings
  ├── decor: ThemeDecor          → ornament configuration
  └── category                  → UI grouping (light/dark/artistic/professional)

ThemeRegistry (src/card/theme-registry.ts)
  → Map<string, ThemeDefinition>
  → register / unregister / getTheme / getAllThemes

Renderer (src/card/renderer.ts)
  → Canvas 2D pipeline: Background → Atmosphere → Texture → Decor → Title → Body → Footer

Decor Renderer (src/card/decor-renderer.ts)
  → 8 ornament types: cornerBracket, topRule, geometricPattern,
    circuitTrace, watermark, goldFoil, leafMotif, auroraGlow

CSS Variables (src/themes/variables.css)
  → --card-page, --card-text, --card-accent, --font-title, etc.

ThemeProvider (src/components/ThemeProvider.vue)
  → Vue provide/inject → syncs ThemeDefinition to CSS custom properties
```

## Available Themes (16 total)

### Light Category
| ID | Name | Mode | Key Feature |
|----|------|------|-------------|
| `moss-paper` | 苔绿纸书 | paper | Default — moss-green paper, serif |
| `sage-dawn` | 鼠尾草晨 | sage | Muted green, healing |
| `arctic-frost` | 极光冰原 | frost | Ice blue, crystalline patterns |

### Dark Category
| ID | Name | Mode | Key Feature |
|----|------|------|-------------|
| `deep-obsidian` | 深黑曜石 | obsidian | Pure black, gold text |
| `midnight-ink` | 午夜墨蓝 | obsidian | Deep blue-black, silver |
| `cyber-neon` | 赛博霓虹 | cyber | Neon cyan, scanlines |
| `forest-archive` | 森林档案 | archive | Dark green, gold text |

### Artistic Category
| ID | Name | Mode | Key Feature |
|----|------|------|-------------|
| `peach-cloud` | 暖桃云 | vintage | Warm peach, film grain |
| `lemon-note` | 柠黄便签 | vintage | Bright yellow, kai font |
| `ink-wash` | 水墨丹青 | paper | Black ink, CJK calligraphy |
| `glass-morph` | 冰霜玻璃 | glass | Frosted glass, iridescent |
| `botanical-field` | 原野手札 | sage | Botanical, hand-drawn |

### Professional Category
| ID | Name | Mode | Key Feature |
|----|------|------|-------------|
| `warm-editor` | 暖灰编辑 | paper | Cool gray, neon green |
| `swiss-modern` | 瑞士现代 | swiss | Red accent, grid |
| `brutalist-raw` | 粗野主义 | brutal | B&W, thick borders |
| `gold-luxe` | 鎏金奢 | luxe | Ivory, gold foil |

## Theme Variable Naming Conventions

### Palette (9 colors)
```
palette.page       → Card background (lightest)
palette.pageAlt    → Secondary background / gradient stop
palette.text       → Primary text color
palette.muted      → Secondary / muted text
palette.accent     → Brand / highlight color
palette.accentSoft → Low-opacity accent for washes
palette.border     → Divider / frame color
palette.shadow     → Card drop-shadow color
palette.glow       → Atmosphere glow color
```

### Surface (visual atmosphere)
```
surface.grainAlpha     → 0-1, noise texture intensity
surface.vignetteAlpha  → 0-1, edge darkening
surface.washStrength   → 0-1, radial wash intensity
surface.innerFrameAlpha → 0-1, inner border opacity
surface.innerFrameInset → px, border distance from edge
surface.titleAccentMix → 0-1, accent color in title
surface.footerLineAlpha → 0-1, footer rule opacity
surface.footerTextAlpha → 0-1, footer text opacity
surface.previewShadow   → CSS box-shadow for UI preview
```

### Components (interactive elements)
```
components.quoteFillAlpha       → 0-1, quote background
components.quoteStrokeAlpha     → 0-1, quote border
components.quoteBarAlpha        → 0-1, quote accent bar
components.quoteRadius          → px, corner radius
components.quoteTreatment       → 'paper' | 'callout' | 'code'
components.highlightTreatment   → 6 options (see below)
components.highlightUnderlineAlpha → 0-1
components.highlightMarkerAlpha    → 0-1
components.highlightDashAlpha      → 0-1
```

### Editor (typography defaults)
```
editor.titleSize      → px, default title font size
editor.bodySize       → px, default body font size
editor.lineHeight     → multiplier
editor.titleFontMode  → 'serif' | 'kai' | 'sans' | 'puhuiti' |
                         'retroSerif' | 'display' | 'handwriting' | 'monoTitle'
editor.highlightStyle → 'underline' | 'marker' | 'border'
```

### Decor (ornaments)
```
decor.kind    → 'none' | 'cornerBracket' | 'topRule' | 'watermark' |
                 'geometricPattern' | 'leafMotif' | 'circuitTrace' |
                 'goldFoil' | 'auroraGlow'
decor.opacity → 0-1
decor.color   → optional override color
decor.scale   → multiplier (default 1)
```

## Highlight Treatments

| Treatment | Visual Effect | Best For |
|-----------|--------------|----------|
| `softUnderline` | Rounded underline fill | Paper, vintage themes |
| `editorMark` | Solid marker block | Digital editor theme |
| `botanicalStroke` | Bezier curved underline | Sage, botanical themes |
| `warmSwipe` | Soft multiply/screen bar | Warm vintage themes |
| `darkGlow` | Screen-mode shadow glow | Dark themes |
| `swissRule` | Dashed/solid rule line | Swiss, brutalist themes |

## Quote Treatments

| Treatment | Visual Effect |
|-----------|--------------|
| `paper` | Subtle background + accent bar |
| `callout` | Higher-opacity background block |
| `code` | Monospace-style border, minimal fill |

## Theme Modes (Renderer Paths)

| Mode | Background | Texture | Special Effects |
|------|-----------|---------|-----------------|
| `paper` | Gradient (pageAlt→page) | Grain + fibers | Paper bloom, cover ornament |
| `sage` | Gradient (pageAlt→page) | Grain + fibers | Green-tinted washes |
| `vintage` | Gradient (pageAlt→page) | Heavy grain + fibers | Film sweep, warm washes |
| `obsidian` | Dark gradient | Screen-mode grain | Heavy vignette, gold glow |
| `archive` | Dark green gradient | Screen-mode grain | Dark vignette, archive mood |
| `swiss` | Solid | None | Clean, grid-based |
| `cyber` | Dark purple gradient | Light digital noise | Scanlines, neon glow |
| `glass` | Diagonal iridescent | None | Glass overlay, soft shadow |
| `brutal` | Solid white | None | Thick border, no ornaments |
| `luxe` | Warm ivory gradient | Light grain | Gold foil specks |
| `frost` | Ice blue gradient | Minimal | Crystalline shimmer |

## Creating a New Theme

### Step 1: Add to `src/card/themes.ts`

Add a new `ThemeDefinition` object to the `THEMES` array:

```typescript
{
  id: 'my-theme',
  name: '我的主题',
  mood: '主题氛围描述',
  preset: '预设名称',
  description: '简短描述，用于 Tooltip',
  tags: ['标签1', '标签2'],
  mode: 'paper',  // choose from ThemeMode
  palette: {
    page: '#f8f8f5',
    pageAlt: '#efeee8',
    text: '#1a1a1a',
    muted: '#888888',
    accent: '#4466aa',
    accentSoft: 'rgba(68,102,170,0.16)',
    border: 'rgba(68,102,170,0.12)',
    shadow: 'rgba(0,0,0,0.08)',
    glow: 'rgba(200,210,230,0.3)',
  },
  surface: { /* ... */ },
  components: { /* ... */ },
  editor: {
    titleSize: 74,
    bodySize: 28,
    lineHeight: 1.8,
    titleFontMode: 'serif',
    highlightStyle: 'underline',
  },
  category: 'light',
  decor: { kind: 'none', opacity: 0 },
}
```

### Step 2: Choose a Mode

The `mode` field determines which rendering pipeline is used. If your theme needs unique rendering, add a new mode to `ThemeMode` in `types.ts` and handle it in the renderer's `drawBackground`, `paintAtmosphere`, and `applyNoiseTexture` functions.

### Step 3: Verify

1. Run `npm run dev`
2. Open the editor
3. Your theme should appear in the ThemeSelector
4. Select it — the card canvas should render correctly

### Step 4: JSON Export (Optional)

```typescript
import { themeToJSON } from '@/card/theme-config'
const json = themeToJSON(myTheme)
// Save json to a .json file for sharing
```

## Font Configuration

### Title Font Modes

| Mode | CJK Family | Latin Family | Weight |
|------|-----------|-------------|--------|
| `serif` | Noto Serif SC, Songti SC | Cormorant Garamond | 600 |
| `kai` | LXGW WenKai, KaiTi | Cormorant Garamond | 600 |
| `sans` | PingFang SC, Microsoft YaHei | Inter | 700 |
| `puhuiti` | Alibaba PuHuiTi | Inter | 700 |
| `retroSerif` | Noto Serif SC | Playfair Display | 700 |
| `display` | PingFang SC | Inter | 800 |
| `handwriting` | KaiTi, LXGW WenKai | Caveat | 500 |
| `monoTitle` | JetBrains Mono | JetBrains Mono | 700 |

### Body Font Modes

| Mode | Family Stack |
|------|-------------|
| `wenkai` | LXGW WenKai → KaiTi → STKaiti |
| `yahei` | Microsoft YaHei → PingFang SC → Helvetica Neue |
| `simsun` | SimSun → Songti SC → Noto Serif SC |
| `kaiti` | KaiTi → STKaiti → LXGW WenKai |
| `dengxian` | DengXian → PingFang SC → Microsoft YaHei |
| `fangsong` | FangSong → STFangsong → Noto Serif SC |

## CSS Custom Properties

ThemeProvider syncs the active theme to CSS variables on `:root`:

```css
--card-page            /* palette.page */
--card-text            /* palette.text */
--card-accent          /* palette.accent */
--card-border          /* palette.border */
--card-preview-shadow  /* surface.previewShadow */
--title-size           /* editor.titleSize + 'px' */
--body-size            /* editor.bodySize + 'px' */
```

Use these in components:
```css
.my-themed-element {
  background: var(--card-page);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  transition: background-color 0.35s ease, color 0.35s ease;
}
```

## WCAG Accessibility

All 16 themes are designed with WCAG AA contrast in mind:
- **Normal text**: contrast ratio ≥ 4.5:1 against background
- **Large text** (title, headings): contrast ratio ≥ 3:1
- **Focus indicators**: visible on all interactive theme selector cards
- **Minimum font size**: body never below 20px (logical), title never below 34px

## Render Pipeline

```
renderCard(opts)
  ├── 1. Canvas creation (2x retina)
  ├── 2. Background gradient (drawBackground)
  ├── 3. Shape clipping (rounded or square)
  ├── 4. Atmosphere (paintAtmosphere)
  │     ├── Radial washes
  │     ├── Vintage film sweeps
  │     ├── Digital editor grid
  │     ├── Cyber scanlines
  │     ├── Frost crystalline shimmer
  │     ├── Luxe gold foil specks
  │     └── Glass overlay
  ├── 5. Texture (applyNoiseTexture)
  │     ├── Grain particles
  │     └── Paper fibers
  ├── 6. Decor ornaments (drawDecor)
  │     ├── Corner brackets
  │     ├── Top rules
  │     ├── Geometric patterns
  │     ├── Circuit traces
  │     ├── Watermarks
  │     ├── Gold foil particles
  │     ├── Leaf motifs
  │     └── Aurora glows
  ├── 7. Cover title (with alignment + accent ranges)
  │     ├── Gradient text (cyber, glass)
  │     ├── Drop caps (luxe, botanical, ink-wash)
  │     └── Ornament quote marks
  ├── 8. Body blocks
  │     ├── Text (paragraphs, quotes, subheadings, dividers)
  │     ├── Code (syntax highlighted)
  │     ├── Tables (with headers + alternating rows)
  │     ├── Math (KaTeX rendered)
  │     ├── Mermaid (diagrams)
  │     └── Column containers
  └── 9. Footer (rule + left/right text)
```
