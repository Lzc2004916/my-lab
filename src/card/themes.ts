// ═══════════════════════════════════════════════════════════════════════════
// CardPreview 模块 — 主题定义（8 个预设）
// ═══════════════════════════════════════════════════════════════════════════

import type { ThemeDefinition } from './types'

export const THEMES: ThemeDefinition[] = [
  // ── 1. moss-paper ──────────────────────────────────────────────────────
  // 设计升级：从平淡米绿 → 深度和纸质感，融入青铜色调，
  // 铜绿锈蚀般的 accent、古墨绿文本、手漉和纸的微妙纤维感
  {
    id: 'moss-paper',
    name: '苔绿纸书',
    mood: '深苔和纸青铜锈迹书卷气',
    preset: '深苔和纸',
    description: '深苔绿和纸纹理、青铜锈绿点缀、古墨书卷气，经典的安静阅读质感',
    tags: ['和纸', '书卷', '经典'],
    mode: 'paper',
    palette: {
      page: '#f2f0e8',          // 手漉和纸暖白 — 比纯白多一层温度
      pageAlt: '#dfe5d6',       // 干苔绿灰 — 深度渐变，不再浮浅
      text: '#1c281e',          // 古墨绿黑 — 不是纯黑，是墨色
      muted: '#5d7060',         // 石苔灰绿 — 有分量的次级文本
      accent: '#5a8a62',        // 铜锈绿 — 像青铜器上的铜绿，沉稳有质感
      accentSoft: 'rgba(90,138,98,0.16)',
      border: 'rgba(70,85,72,0.12)',
      shadow: 'rgba(55,70,58,0.10)',
      glow: 'rgba(195,210,190,0.30)',
    },
    surface: {
      grainAlpha: 0.044,         // 和纸纤维 — 比普通纸更明显的纹理
      vignetteAlpha: 0.048,
      washStrength: 0.28,
      innerFrameAlpha: 0.08,
      innerFrameInset: 28,
      titleAccentMix: 0.78,
      footerLineAlpha: 0.18,
      footerTextAlpha: 0.88,
      previewShadow:
        '0 24px 52px rgba(55,70,58,0.10), 0 2px 16px rgba(240,235,225,0.44) inset',
    },
    components: {
      quoteFillAlpha: 0.044,
      quoteStrokeAlpha: 0.068,
      quoteBarAlpha: 0.76,
      quoteRadius: 20,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.66,
      highlightMarkerAlpha: 0.28,
      highlightDashAlpha: 0.80,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.84,
      bodyFontMode: 'wenkai',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.3, h2Scale: 1.65, h3Scale: 1.35,
        h1LineHeight: 1.25, h2LineHeight: 1.35, h3LineHeight: 1.45,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 10,
      },
      list: { bulletChar: '•', bulletSizeRatio: 0.82, indentPerLevel: 28, itemGap: 7 },
    },
    category: 'light',
    decor: { kind: 'leafMotif', opacity: 0.10, color: '#5a8a62', scale: 0.95 },
    gradient: { enabled: false, color1: '#dfe5d6', color2: '#f2f0e8' },
  },

  // ── 2. warm-editor ─────────────────────────────────────────────────────
  // 设计升级：从廉价荧光绿 → 琥珀暖光专业编辑器，
  // 深炭灰纸面、琥珀金 accent、类 Monokai Pro 的高级暗色编辑体验
  {
    id: 'warm-editor',
    name: '暖灰编辑',
    mood: '深炭纸面琥珀暖光专业编辑',
    preset: '琥珀暖编',
    description: '深炭灰纸面、琥珀暖金 accent、程序员的深夜编辑器质感，适合深度写作与效率长文',
    tags: ['编辑', '琥珀', '深度'],
    mode: 'paper',
    palette: {
      page: '#faf8f5',          // 暖调象牙纸白 — 比冷灰更护眼更温暖
      pageAlt: '#f2ede4',       // 淡亚麻布色 — 自然纤维感
      text: '#1a1d22',          // 深炭色 — 接近黑但不刺眼
      muted: '#6b6e76',         // 暖石板灰 — 有温度的次级色
      accent: '#e89440',        // 琥珀金 — 像 IDE 里温暖的 syntax highlight
      accentSoft: 'rgba(232,148,64,0.16)',
      border: 'rgba(140,130,118,0.12)',
      shadow: 'rgba(80,75,65,0.08)',
      glow: 'rgba(245,210,160,0.22)',
    },
    surface: {
      grainAlpha: 0.016,
      vignetteAlpha: 0.020,
      washStrength: 0.18,
      innerFrameAlpha: 0.10,
      innerFrameInset: 24,
      titleAccentMix: 0.66,
      footerLineAlpha: 0.20,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 24px 50px rgba(80,75,65,0.08), 0 1px 12px rgba(250,245,235,0.40) inset',
    },
    components: {
      quoteFillAlpha: 0.048,
      quoteStrokeAlpha: 0.070,
      quoteBarAlpha: 0.78,
      quoteRadius: 14,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.62,
      highlightMarkerAlpha: 0.34,
      highlightDashAlpha: 0.76,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.82,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      list: { bulletChar: '▸', bulletSizeRatio: 0.78, indentPerLevel: 26, itemGap: 6, orderedMarkerBox: true },
    },
    category: 'professional',
    decor: { kind: 'desertSun', opacity: 0.75, color: '#e89440', scale: 1.0 },
    gradient: { enabled: false, color1: '#f2ede4', color2: '#faf8f5' },
  },

  // ── 3. peach-cloud ─────────────────────────────────────────────────────
  {
    id: 'peach-cloud',
    name: '暖桃云',
    mood: '暖桃粉底复古胶片感',
    preset: '暖桃胶片',
    description: '暖调粉底、柔光氛围，适合生活随笔与心情记录',
    tags: ['温暖', '胶片'],
    mode: 'vintage',
    palette: {
      page: '#fdf5f0',
      pageAlt: '#fce8db',
      text: '#3d2a1d',
      muted: '#8b6f5e',
      accent: '#d4785c',
      accentSoft: 'rgba(212,120,92,0.2)',
      border: 'rgba(120,85,65,0.14)',
      shadow: 'rgba(120,85,65,0.1)',
      glow: 'rgba(255,210,180,0.38)',
    },
    surface: {
      grainAlpha: 0.044,
      vignetteAlpha: 0.052,
      washStrength: 0.38,
      innerFrameAlpha: 0.09,
      innerFrameInset: 26,
      titleAccentMix: 0.82,
      footerLineAlpha: 0.18,
      footerTextAlpha: 0.88,
      previewShadow:
        '0 24px 50px rgba(120,85,65,0.1), 0 2px 16px rgba(255,245,235,0.44) inset',
    },
    components: {
      quoteFillAlpha: 0.05,
      quoteStrokeAlpha: 0.08,
      quoteBarAlpha: 0.7,
      quoteRadius: 20,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.64,
      highlightMarkerAlpha: 0.36,
      highlightDashAlpha: 0.8,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.86,
      bodyFontMode: 'wenkai',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      list: { bulletChar: '•', bulletSizeRatio: 0.84, indentPerLevel: 28, itemGap: 8 },
    },
    category: 'artistic',
    decor: { kind: 'sakuraPetal', opacity: 0.80, color: '#e8928c', scale: 0.95 },
    gradient: { enabled: false, color1: '#fce8db', color2: '#fdf5f0' },
  },

  // ── 4. lemon-note ──────────────────────────────────────────────────────
  // 设计升级：从惨淡鹅黄 → 地中海柠檬园浓烈日光感，
  // 饱满柠黄底、深橄榄绿 accent、西西里陶罐般的暖调
  {
    id: 'lemon-note',
    name: '柠黄便签',
    mood: '地中海柠檬园日光浓烈鲜活',
    preset: '柠檬日光',
    description: '饱满柠黄底、橄榄绿 accent、阳光浸透的南意便签质感，适合灵感速记与创意迸发',
    tags: ['柠檬', '日光', '鲜活'],
    mode: 'vintage',
    palette: {
      page: '#fff9e0',          // 柠檬凝脂 — 更浓的暖黄，不再是惨淡米色
      pageAlt: '#fef0b8',       // 成熟柠皮 — 深度金黄色调
      text: '#2d2610',          // 深橄榄棕 — 有机植物墨色
      muted: '#8a7d48',         // 干草金褐 — 温暖但不抢眼
      accent: '#8b9a3c',        // 橄榄叶绿 — 柠檬树的叶子，替代平庸的金黄 accent
      accentSoft: 'rgba(139,154,60,0.18)',
      border: 'rgba(170,155,90,0.16)',
      shadow: 'rgba(150,130,60,0.10)',
      glow: 'rgba(255,245,190,0.38)',
    },
    surface: {
      grainAlpha: 0.044,
      vignetteAlpha: 0.048,
      washStrength: 0.34,
      innerFrameAlpha: 0.10,
      innerFrameInset: 24,
      titleAccentMix: 0.82,
      footerLineAlpha: 0.20,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 24px 48px rgba(150,130,60,0.10), 0 2px 14px rgba(255,248,210,0.44) inset',
    },
    components: {
      quoteFillAlpha: 0.048,
      quoteStrokeAlpha: 0.074,
      quoteBarAlpha: 0.76,
      quoteRadius: 16,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.64,
      highlightMarkerAlpha: 0.32,
      highlightDashAlpha: 0.78,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.84,
      bodyFontMode: 'kaiti',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      list: { bulletChar: '◦', bulletSizeRatio: 0.80, indentPerLevel: 28, itemGap: 7, orderedMarkerBox: true },
    },
    category: 'light',
    decor: { kind: 'leafMotif', opacity: 0.12, color: '#8b9a3c', scale: 0.92 },
    gradient: { enabled: false, color1: '#fef0b8', color2: '#fff9e0' },
  },

  // ── 5. sage-dawn ───────────────────────────────────────────────────────
  {
    id: 'sage-dawn',
    name: '鼠尾草晨',
    mood: '鼠尾草绿安静治愈',
    preset: '鼠尾草治愈',
    description: '低饱和绿调、安静治愈，适合读书笔记与深度思考',
    tags: ['治愈', '安静'],
    mode: 'sage',
    palette: {
      page: '#f4f6f3',
      pageAlt: '#e8efe5',
      text: '#1e2a1c',
      muted: '#5f6e5c',
      accent: '#5a9478',
      accentSoft: 'rgba(90,148,120,0.18)',
      border: 'rgba(70,110,90,0.12)',
      shadow: 'rgba(70,110,90,0.1)',
      glow: 'rgba(195,230,215,0.34)',
    },
    surface: {
      grainAlpha: 0.032,
      vignetteAlpha: 0.038,
      washStrength: 0.28,
      innerFrameAlpha: 0.08,
      innerFrameInset: 24,
      titleAccentMix: 0.82,
      footerLineAlpha: 0.18,
      footerTextAlpha: 0.88,
      previewShadow:
        '0 24px 50px rgba(70,110,90,0.1), 0 2px 16px rgba(240,250,245,0.4) inset',
    },
    components: {
      quoteFillAlpha: 0.042,
      quoteStrokeAlpha: 0.068,
      quoteBarAlpha: 0.68,
      quoteRadius: 20,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.68,
      highlightMarkerAlpha: 0.28,
      highlightDashAlpha: 0.80,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.84,
      bodyFontMode: 'wenkai',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      list: { bulletChar: '•', bulletSizeRatio: 0.82, indentPerLevel: 28, itemGap: 7 },
    },
    category: 'light',
    decor: { kind: 'geometricPattern', opacity: 0.10, color: '#5a9478', scale: 1.06 },
    gradient: { enabled: false, color1: '#e8efe5', color2: '#f4f6f3' },
  },

  // ── 6. swiss-modern (瑞士现代) ─────────────────────────────────────────
  // 重大设计升级：Müller-Brockmann 网格贴纸 + 微温纸感
  // 菱形几何网格作为视觉锚点，微暖纸面替代冷酷纯白
  {
    id: 'swiss-modern',
    name: '瑞士现代',
    mood: '深群青几何网格非对称张力微温纸感',
    preset: '群青网格',
    description: '深群青 accent、菱形几何网格贴纸、非对称留白张力、微温纸面，适合设计宣言与品牌陈述',
    tags: ['网格', '群青', '张力', '几何'],
    mode: 'swiss',
    palette: {
      page: '#fafaf7',          // 微温纸白 — 比纯白多 2% 暖意，更像真实 Swiss 海报纸
      pageAlt: '#f3f3f0',       // 淡灰白 — 仅够感知的层次
      text: '#1a1c22',          // 深蓝黑 — 不是死黑，带群青底调
      muted: '#6a6e78',         // 冷蓝灰 — 精确克制的次级色
      accent: '#2d4b8e',        // 深群青 — 伊夫·克莱因之前的经典
      accentSoft: 'rgba(45,75,142,0.14)',
      border: 'rgba(30,35,50,0.16)',
      shadow: 'rgba(25,30,45,0.08)',
      glow: 'rgba(45,75,142,0.06)',
    },
    surface: {
      grainAlpha: 0.008,        // 微纸纹 — 真实 Swiss 海报纸的触感
      vignetteAlpha: 0.006,     // 极微暗角 — 印刷品的自然边缘
      washStrength: 0.06,       // 极淡群青光晕 — 给白纸注入色彩调性
      innerFrameAlpha: 0.18,    // 更强的几何内框 — 网格秩序的骨架
      innerFrameInset: 22,
      titleAccentMix: 0.76,
      footerLineAlpha: 0.24,
      footerTextAlpha: 0.94,
      previewShadow:
        '0 16px 36px rgba(25,30,45,0.08), 0 1px 6px rgba(0,0,0,0.03) inset',
    },
    components: {
      quoteFillAlpha: 0.044,
      quoteStrokeAlpha: 0.12,
      quoteBarAlpha: 0.90,
      quoteRadius: 2,
      quoteTreatment: 'callout',
      highlightTreatment: 'swissRule',
      highlightUnderlineAlpha: 0.56,
      highlightMarkerAlpha: 0.24,
      highlightDashAlpha: 0.92,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.74,
      bodyFontMode: 'yahei',
      bodyFontWeight: 350,
      subheadingStyle: 'large',
      highlightStyle: 'border',
      heading: {
        h1Scale: 3.0, h2Scale: 1.55, h3Scale: 1.25,
        h1LineHeight: 1.12, h2LineHeight: 1.25, h3LineHeight: 1.35,
        h1FontWeight: 800, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 8,
        h1Color: '#2d4b8e',
      },
      list: { bulletChar: '—', bulletSizeRatio: 0.76, indentPerLevel: 24, itemGap: 6, orderedMarkerBox: true },
    },
    category: 'professional',
    decor: { kind: 'geometricPattern', opacity: 0.10, color: '#2d4b8e', scale: 1.08 },
    gradient: { enabled: false, color1: '#f3f3f0', color2: '#fafaf7' },
  },

  // ── 7. forest-archive ──────────────────────────────────────────────────
  {
    id: 'forest-archive',
    name: '森林档案',
    mood: '深绿档案暗底金文',
    preset: '墨绿档案',
    description: '深绿暗底、金字文本，适合仪式感与收藏级内容',
    tags: ['暗色', '档案'],
    mode: 'archive',
    palette: {
      page: '#14281a',
      pageAlt: '#1a3324',
      text: '#d8c99b',
      muted: '#8a9e7e',
      accent: '#c9a84c',
      accentSoft: 'rgba(201,168,76,0.16)',
      border: 'rgba(216,201,155,0.12)',
      shadow: 'rgba(10,20,12,0.3)',
      glow: 'rgba(201,168,76,0.08)',
    },
    surface: {
      grainAlpha: 0.06,
      vignetteAlpha: 0.072,
      washStrength: 0.28,
      innerFrameAlpha: 0.16,
      innerFrameInset: 28,
      titleAccentMix: 0.9,
      footerLineAlpha: 0.24,
      footerTextAlpha: 0.88,
      previewShadow:
        '0 30px 60px rgba(10,20,12,0.36), 0 2px 20px rgba(0,0,0,0.2) inset',
    },
    components: {
      quoteFillAlpha: 0.06,
      quoteStrokeAlpha: 0.1,
      quoteBarAlpha: 0.78,
      quoteRadius: 24,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.62,
      highlightMarkerAlpha: 0.4,
      highlightDashAlpha: 0.78,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.86,
      bodyFontMode: 'simsun',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      list: { bulletChar: '◆', bulletSizeRatio: 0.78, indentPerLevel: 28, itemGap: 8, orderedMarkerBox: true },
    },
    category: 'dark',
    decor: { kind: 'topRule', opacity: 0.24, scale: 1 },
    gradient: { enabled: true, color1: '#14281a', color2: '#c9a84c' },
  },

  // ── 8. deep-obsidian ───────────────────────────────────────────────────
  {
    id: 'deep-obsidian',
    name: '深黑曜石',
    mood: '黑曜石底熔岩铜火戏剧感',
    preset: '熔岩铜火',
    description: '极致黑底、熔岩铜火点缀、火山玻璃质感，适合金句卡片与品牌宣言',
    tags: ['暗色', '熔岩', '戏剧'],
    mode: 'obsidian',
    palette: {
      page: '#151310',
      pageAlt: '#1c1915',
      text: '#e8dcc8',
      muted: '#8a8070',
      accent: '#c47b5b',
      accentSoft: 'rgba(196,123,91,0.16)',
      border: 'rgba(232,210,190,0.1)',
      shadow: 'rgba(8,6,4,0.4)',
      glow: 'rgba(196,123,91,0.1)',
    },
    surface: {
      grainAlpha: 0.08,
      vignetteAlpha: 0.08,
      washStrength: 0.24,
      innerFrameAlpha: 0.18,
      innerFrameInset: 28,
      titleAccentMix: 0.92,
      footerLineAlpha: 0.26,
      footerTextAlpha: 0.86,
      previewShadow:
        '0 32px 64px rgba(8,6,4,0.44), 0 2px 22px rgba(0,0,0,0.24) inset',
    },
    components: {
      quoteFillAlpha: 0.07,
      quoteStrokeAlpha: 0.12,
      quoteBarAlpha: 0.8,
      quoteRadius: 24,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.6,
      highlightMarkerAlpha: 0.42,
      highlightDashAlpha: 0.76,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.88,
      bodyFontMode: 'simsun',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.1, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
      },
      list: { bulletChar: '◆', bulletSizeRatio: 0.76, indentPerLevel: 28, itemGap: 8, orderedMarkerBox: true },
    },
    category: 'dark',
    decor: { kind: 'geometricPattern', opacity: 0.16, color: '#c47b5b', scale: 1.06 },
    gradient: { enabled: true, color1: '#151310', color2: '#c47b5b' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 9. ink-wash (水墨丹青) ──────────────────────────────────────────────
  {
    id: 'ink-wash',
    name: '水墨丹青',
    mood: '黑白水墨画意留白',
    preset: '水墨留白',
    description: '宣纸墨色、大量留白、书法韵味，适合古风诗词与哲思散文',
    tags: ['水墨', '留白', '古风'],
    mode: 'paper',
    palette: {
      page: '#f7f5f0',
      pageAlt: '#ede8df',
      text: '#1a1a1a',
      muted: '#8c8c8c',
      accent: '#2c2c2c',
      accentSoft: 'rgba(44,44,44,0.08)',
      border: 'rgba(44,44,44,0.08)',
      shadow: 'rgba(0,0,0,0.06)',
      glow: 'rgba(200,195,185,0.18)',
    },
    surface: {
      grainAlpha: 0.028,
      vignetteAlpha: 0.032,
      washStrength: 0.12,
      innerFrameAlpha: 0.06,
      innerFrameInset: 32,
      titleAccentMix: 0.45,
      footerLineAlpha: 0.14,
      footerTextAlpha: 0.82,
      previewShadow:
        '0 20px 44px rgba(0,0,0,0.06), 0 1px 10px rgba(255,255,255,0.3) inset',
    },
    components: {
      quoteFillAlpha: 0.034,
      quoteStrokeAlpha: 0.056,
      quoteBarAlpha: 0.66,
      quoteRadius: 2,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.35,
      highlightMarkerAlpha: 0.15,
      highlightDashAlpha: 0.4,
    },
    editor: {
      bodySize: 30,
      lineHeight: 2.0,
      bodyFontMode: 'kaiti',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.8, h2Scale: 1.75, h3Scale: 1.4,
        h1LineHeight: 1.3, h2LineHeight: 1.45, h3LineHeight: 1.55,
        h1FontWeight: 400, h2FontWeight: 400, h3FontWeight: 400,
        h1MarginTop: 30, h1MarginBottom: 16,
      },
      list: { bulletChar: '◦', bulletSizeRatio: 0.82, indentPerLevel: 30, itemGap: 9 },
    },
    category: 'artistic',
    decor: { kind: 'watermark', opacity: 0.06, scale: 1.2 },
    gradient: { enabled: false, color1: '#ede8df', color2: '#f7f5f0' },
  },

  // ── 10. cyber-neon (赛博霓虹) ──────────────────────────────────────────
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    mood: '暗紫黑底赛博朋克霓虹',
    preset: '霓虹代码',
    description: '暗紫黑底、青霓虹高亮、终端扫描线，适合科技文章与代码卡片',
    tags: ['赛博', '霓虹', '科技'],
    mode: 'cyber',
    palette: {
      page: '#0a0a12',
      pageAlt: '#0f0c1a',
      text: '#c8d6e5',
      muted: '#6b7d95',
      accent: '#00f0ff',
      accentSoft: 'rgba(0,240,255,0.14)',
      border: 'rgba(0,240,255,0.15)',
      shadow: 'rgba(0,240,255,0.12)',
      glow: 'rgba(0,240,255,0.08)',
    },
    surface: {
      grainAlpha: 0.02,
      vignetteAlpha: 0.06,
      washStrength: 0.2,
      innerFrameAlpha: 0.14,
      innerFrameInset: 18,
      titleAccentMix: 0.88,
      footerLineAlpha: 0.22,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 0 40px rgba(0,240,255,0.1), 0 0 80px rgba(180,0,255,0.06), 0 2px 16px rgba(0,0,0,0.4) inset',
    },
    components: {
      quoteFillAlpha: 0.04,
      quoteStrokeAlpha: 0.1,
      quoteBarAlpha: 0.78,
      quoteRadius: 4,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.56,
      highlightMarkerAlpha: 0.36,
      highlightDashAlpha: 0.74,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.78,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.6, h2Scale: 1.7, h3Scale: 1.35,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 20, h1MarginBottom: 10,
        h1Color: "#39ff14",
      },
      list: { bulletChar: '›', bulletSizeRatio: 0.74, indentPerLevel: 22, itemGap: 5, orderedMarkerBox: true },
    },
    category: 'dark',
    decor: { kind: 'circuitTrace', opacity: 0.12, color: '#00f0ff', scale: 1 },
    gradient: { enabled: true, color1: '#00f0ff', color2: '#b400ff' },
  },

  // ── 11. glass-morph (冰霜玻璃) ─────────────────────────────────────────
  // 设计升级：从平庸紫色 → 极光氰绿虹彩玻璃，
  // 多层玻璃叠加、chromatic aberration 般的色散、液态镜面反射
  {
    id: 'glass-morph',
    name: '冰霜玻璃',
    mood: '极光氰绿虹彩液态镜面',
    preset: '氰绿虹彩',
    description: '青绿到翠蓝虹彩流转、多层毛玻璃层叠、液态镜面反射，适合前卫品牌与未来感内容',
    tags: ['虹彩', '镜面', '未来'],
    mode: 'glass',
    palette: {
      page: 'rgba(248,254,252,0.58)',     // 冰面白 — 微青调，透明如薄冰
      pageAlt: 'rgba(230,248,244,0.48)',  // 薄荷雾 — 青绿调柔焦底层
      text: '#0d2628',                     // 深潭绿黑 — 有深度的暗色
      muted: '#4a7a78',                    // 碧水绿灰 — 水下的次级色
      accent: '#0ea08a',                   // 翠cyan — 热带的绿松石色
      accentSoft: 'rgba(14,160,138,0.14)',
      border: 'rgba(14,160,138,0.16)',
      shadow: 'rgba(10,120,110,0.10)',
      glow: 'rgba(130,240,220,0.18)',
    },
    surface: {
      grainAlpha: 0,
      vignetteAlpha: 0.016,
      washStrength: 0.24,
      innerFrameAlpha: 0.07,
      innerFrameInset: 20,
      titleAccentMix: 0.70,
      footerLineAlpha: 0.15,
      footerTextAlpha: 0.86,
      previewShadow:
        '0 14px 38px rgba(10,120,110,0.12), 0 2px 14px rgba(255,255,255,0.52) inset, 0 0 0 1px rgba(130,240,220,0.14) inset',
    },
    components: {
      quoteFillAlpha: 0.046,
      quoteStrokeAlpha: 0.078,
      quoteBarAlpha: 0.72,
      quoteRadius: 14,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.58,
      highlightMarkerAlpha: 0.24,
      highlightDashAlpha: 0.68,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.80,
      bodyFontMode: 'yahei',
      bodyFontWeight: 350,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      list: { bulletChar: '◇', bulletSizeRatio: 0.76, indentPerLevel: 26, itemGap: 6, orderedMarkerBox: true },
    },
    category: 'artistic',
    decor: { kind: 'crystalFacet', opacity: 0.28, color: '#0ea08a', scale: 1.06 },
    gradient: { enabled: true, color1: '#0ea08a', color2: '#00d4ff', angle: 145 },
  },

  // ── 12. brutalist-raw (粗野主义) ───────────────────────────────────────
  // 设计升级：从单纯黑白 → 安藤忠雄混凝土 + 耐候钢锈，
  // 清水混凝土灰底、Cor-ten 钢锈橙 accent、建筑蓝图般的粗粝质感
  {
    id: 'brutalist-raw',
    name: '粗野主义',
    mood: '安藤混凝土耐候钢锈建筑诗意',
    preset: '混凝土钢',
    description: '清水混凝土灰底、Cor-ten 锈橙 accent、粗粝建筑质感，反精致美学的原始诗意',
    tags: ['混凝土', '钢锈', '建筑'],
    mode: 'brutal',
    palette: {
      page: '#f0ede8',          // 清水混凝土 — 安藤忠雄式的温润灰白
      pageAlt: '#e8e4de',       // 模板痕迹灰 — 微妙的木纹印记色
      text: '#1f1d1b',          // 钢筋炭黑 — 有工业重量感
      muted: '#6b6660',         // 水泥灰 — 被时间冲刷过的中间调
      accent: '#c4552e',        // Cor-ten 锈橙 — 耐候钢氧化后的铁锈色
      accentSoft: 'rgba(196,85,46,0.14)',
      border: 'rgba(30,28,24,0.88)',
      shadow: 'rgba(0,0,0,0)',
      glow: 'rgba(0,0,0,0)',
    },
    surface: {
      grainAlpha: 0.028,        // 混凝土细孔 — 不是完全光滑
      vignetteAlpha: 0.018,
      washStrength: 0.08,
      innerFrameAlpha: 0.86,
      innerFrameInset: 14,
      titleAccentMix: 0.10,     // 标题基本不用 accent — 工业克制
      footerLineAlpha: 0.86,
      footerTextAlpha: 0.96,
      previewShadow:
        '6px 6px 0px rgba(30,28,24,0.86)',
    },
    components: {
      quoteFillAlpha: 0.016,
      quoteStrokeAlpha: 0.86,
      quoteBarAlpha: 0.96,
      quoteRadius: 0,
      quoteTreatment: 'code',
      highlightTreatment: 'swissRule',
      highlightUnderlineAlpha: 0.86,
      highlightMarkerAlpha: 0.62,
      highlightDashAlpha: 0.94,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.62,
      bodyFontMode: 'dengxian',
      bodyFontWeight: 500,
      subheadingStyle: 'large',
      highlightStyle: 'border',
      heading: {
        h1Scale: 4.4, h2Scale: 1.85, h3Scale: 1.35,
        h1LineHeight: 1.06, h2LineHeight: 1.18, h3LineHeight: 1.28,
        h1FontWeight: 900, h2FontWeight: 800, h3FontWeight: 700,
        h1MarginTop: 32, h1MarginBottom: 16,
        h2MarginTop: 20, h2MarginBottom: 8,
      },
      list: { bulletChar: '■', bulletSizeRatio: 0.88, indentPerLevel: 20, itemGap: 5, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 5.8, h1LineHeight: 1.04, centered: true, topOffset: -24,
    },
    category: 'professional',
    decor: { kind: 'topRule', opacity: 0.64, color: '#c4552e', scale: 1.12 },
    gradient: { enabled: false, color1: '#f0ede8', color2: '#f0ede8' },
  },

  // ── 13. gold-luxe (鎏金奢) ─────────────────────────────────────────────
  // 重大设计升级：金箔贴纸密度提升 + 象牙暖金渐变
  // 金箔粒子 ×3 密度、象牙→香槟金渐变、衬线标题鎏金质感
  {
    id: 'gold-luxe',
    name: '鎏金奢',
    mood: '象牙金箔奢华鎏金质感',
    preset: '鎏金质感',
    description: '象牙白底、密集金箔贴纸、香槟金渐变、衬线鎏金标题，适合高端品牌、婚礼邀请函与珍藏内容',
    tags: ['奢华', '金箔', '高端', '鎏金'],
    mode: 'luxe',
    palette: {
      page: '#fdfaf3',          // 象牙白 — 精致暖白
      pageAlt: '#f7eeda',       // 香槟金雾 — 更明显的金色底层
      text: '#2d2216',          // 深棕黑 — 比纯黑更温暖奢华
      muted: '#8a7a62',         // 古铜灰 — 金属氧化后的次级色调
      accent: '#c8a44e',        // 鎏金 — 纯正金色 accent
      accentSoft: 'rgba(200,164,78,0.20)',
      border: 'rgba(200,164,78,0.22)',
      shadow: 'rgba(120,100,50,0.10)',
      glow: 'rgba(230,195,115,0.28)',   // 更强金色光晕
    },
    surface: {
      grainAlpha: 0.018,        // 微纸纹 — 高级纸的细腻纹理
      vignetteAlpha: 0.040,     // 更强的聚光灯暗角 — 珠宝展示感
      washStrength: 0.26,       // 更强的金色光晕漫射
      innerFrameAlpha: 0.12,    // 金色内框更可见
      innerFrameInset: 28,
      titleAccentMix: 0.94,     // 标题几乎纯金色
      footerLineAlpha: 0.20,
      footerTextAlpha: 0.92,
      previewShadow:
        '0 28px 60px rgba(120,100,50,0.12), 0 2px 20px rgba(255,250,235,0.55) inset, 0 0 0 1px rgba(200,164,78,0.18) inset',
    },
    components: {
      quoteFillAlpha: 0.044,
      quoteStrokeAlpha: 0.088,
      quoteBarAlpha: 0.84,
      quoteRadius: 16,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.72,
      highlightMarkerAlpha: 0.32,
      highlightDashAlpha: 0.80,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.9,
      bodyFontMode: 'notoserif',  // 思源宋体 — 比 SimSun 更优雅的衬线
      bodyFontWeight: 350,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.5, h2Scale: 1.75, h3Scale: 1.4,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 12,
        h1Color: "#c8a44e",
      },
      list: { bulletChar: '◆', bulletSizeRatio: 0.78, indentPerLevel: 30, itemGap: 8, orderedMarkerBox: true },
    },
      coverHeading: {
        h1Scale: 4.2, h1LineHeight: 1.12, centered: true,
      },
    category: 'professional',
    decor: { kind: 'goldFoil', opacity: 0.34, color: '#c8a44e', scale: 1 },
    gradient: { enabled: true, color1: '#f7eeda', color2: '#fdfaf3', angle: 135 },
  },

  // ── 14. botanical-field (原野手札) ─────────────────────────────────────
  // 重大设计升级：植物叶子贴纸 + 原野暖绿重配色
  // 页边距植物叶片插图、暖草纸底、橄榄绿 accent、手写楷体、田野笔记氛围
  {
    id: 'botanical-field',
    name: '原野手札',
    mood: '植物图鉴手绘田野笔记暖草纸',
    preset: '植物手札',
    description: '暖草纸底、页边植物叶子贴纸、橄榄绿 accent、手写楷体，适合自然笔记、植物观察与田野记录',
    tags: ['自然', '植物', '叶子', '田野'],
    mode: 'paper',
    palette: {
      page: '#f8f5ec',          // 暖草纸 — 阳光晒过的草本底色
      pageAlt: '#efe5cf',       // 干草金黄 — 更温暖的自然渐变
      text: '#2d3320',          // 深橄榄棕 — 植物标本的墨色
      muted: '#7a8060',         // 干草绿灰 — 被阳光漂白的草色
      accent: '#6b8a3c',        // 原野橄榄绿 — 活力与自然并存
      accentSoft: 'rgba(107,138,60,0.18)',
      border: 'rgba(100,120,65,0.12)',
      shadow: 'rgba(90,105,55,0.08)',
      glow: 'rgba(185,215,155,0.26)',
    },
    surface: {
      grainAlpha: 0.044,        // 草纸纤维 — 自然纸的触感
      vignetteAlpha: 0.044,
      washStrength: 0.30,
      innerFrameAlpha: 0.10,
      innerFrameInset: 26,
      titleAccentMix: 0.80,
      footerLineAlpha: 0.20,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 22px 48px rgba(90,105,55,0.08), 0 2px 14px rgba(250,242,225,0.4) inset',
    },
    components: {
      quoteFillAlpha: 0.044,
      quoteStrokeAlpha: 0.072,
      quoteBarAlpha: 0.70,
      quoteRadius: 14,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.66,
      highlightMarkerAlpha: 0.30,
      highlightDashAlpha: 0.76,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.86,
      bodyFontMode: 'kaiti',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.3, h2LineHeight: 1.4, h3LineHeight: 1.5,
        h1FontWeight: 600, h2FontWeight: 500, h3FontWeight: 400,
        h1MarginTop: 24, h1MarginBottom: 12,
      },
      list: { bulletChar: '◦', bulletSizeRatio: 0.82, indentPerLevel: 28, itemGap: 8 },
    },
    coverHeading: {
      h1Scale: 4.0, h1LineHeight: 1.15, centered: false,
    },
    category: 'light',
    decor: { kind: 'leafMotif', opacity: 0.15, color: '#6b8a3c', scale: 0.95 },
    gradient: { enabled: true, color1: '#efe5cf', color2: '#f8f5ec', angle: 135 },
  },

  // ── 15. arctic-frost (极光冰原) ────────────────────────────────────────
  // 设计升级：从普通浅蓝 → 真极地冰川深度，
  // 冰隙深蓝、极光绿紫幻彩、冰冻湖面的裂纹晶体感
  {
    id: 'arctic-frost',
    name: '极光冰原',
    mood: '冰隙深蓝极光绿紫幻彩晶体',
    preset: '极地冰隙',
    description: '冰隙深处钴蓝、极光绿紫幻彩渐变、冰冻湖面结晶纹理，适合凛冬叙事与科幻内容',
    tags: ['冰隙', '极光', '结晶'],
    mode: 'frost',
    palette: {
      page: '#f2f7fb',          // 新雪白 — 微蓝调的绝对纯净
      pageAlt: '#dce9f5',       // 冰隙浅蓝 — 光线穿透薄冰的颜色
      text: '#0f2438',          // 深海蓝黑 — 冰层下深渊的颜色
      muted: '#4f708c',         // 冻湖蓝灰 — 冰封的次级色
      accent: '#3e8ec4',        // 冰川钴蓝 — 万年冰芯的深蓝
      accentSoft: 'rgba(62,142,196,0.15)',
      border: 'rgba(62,142,196,0.14)',
      shadow: 'rgba(30,90,130,0.08)',
      glow: 'rgba(160,215,245,0.28)',
    },
    surface: {
      grainAlpha: 0.014,        // 冰晶微粒 — 极细的冻结纹理
      vignetteAlpha: 0.028,
      washStrength: 0.22,
      innerFrameAlpha: 0.08,
      innerFrameInset: 24,
      titleAccentMix: 0.74,
      footerLineAlpha: 0.16,
      footerTextAlpha: 0.88,
      previewShadow:
        '0 18px 42px rgba(30,90,130,0.08), 0 2px 14px rgba(240,248,255,0.46) inset',
    },
    components: {
      quoteFillAlpha: 0.042,
      quoteStrokeAlpha: 0.068,
      quoteBarAlpha: 0.70,
      quoteRadius: 10,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.56,
      highlightMarkerAlpha: 0.22,
      highlightDashAlpha: 0.70,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.80,
      bodyFontMode: 'yahei',
      bodyFontWeight: 350,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.4, h2Scale: 1.65, h3Scale: 1.3,
        h1LineHeight: 1.18, h2LineHeight: 1.28, h3LineHeight: 1.38,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 12,
        h1Color: '#3e8ec4',
      },
      list: { bulletChar: '◇', bulletSizeRatio: 0.76, indentPerLevel: 26, itemGap: 6, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.2, h1LineHeight: 1.12, centered: true,
    },
    category: 'light',
    decor: { kind: 'geometricPattern', opacity: 0.10, color: '#3e8ec4', scale: 1.05 },
    gradient: { enabled: true, color1: '#3e8ec4', color2: '#a78bfa', angle: 155 },
  },

  // ── 16. midnight-ink (午夜墨蓝) ────────────────────────────────────────
  {
    id: 'midnight-ink',
    name: '午夜墨蓝',
    mood: '深蓝黑底银月星光',
    preset: '墨蓝星空',
    description: '深蓝黑底、银色文字、星点微光，适合深夜写作与深度内容',
    tags: ['午夜', '星空', '深邃'],
    mode: 'obsidian',
    palette: {
      page: '#0d1117',
      pageAlt: '#111820',
      text: '#c8d0da',
      muted: '#6b7888',
      accent: '#7eb8da',
      accentSoft: 'rgba(126,184,218,0.14)',
      border: 'rgba(200,210,220,0.08)',
      shadow: 'rgba(4,8,14,0.5)',
      glow: 'rgba(126,184,218,0.08)',
    },
    surface: {
      grainAlpha: 0.04,
      vignetteAlpha: 0.08,
      washStrength: 0.18,
      innerFrameAlpha: 0.14,
      innerFrameInset: 26,
      titleAccentMix: 0.84,
      footerLineAlpha: 0.2,
      footerTextAlpha: 0.82,
      previewShadow:
        '0 28px 60px rgba(4,8,14,0.5), 0 2px 20px rgba(0,0,0,0.3) inset',
    },
    components: {
      quoteFillAlpha: 0.05,
      quoteStrokeAlpha: 0.1,
      quoteBarAlpha: 0.72,
      quoteRadius: 18,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.54,
      highlightMarkerAlpha: 0.34,
      highlightDashAlpha: 0.66,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.88,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.5, h2Scale: 1.7, h3Scale: 1.35,
        h1LineHeight: 1.18, h2LineHeight: 1.28, h3LineHeight: 1.38,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 26, h1MarginBottom: 14,
        h1Color: '#7eb8da',
      },
      list: { bulletChar: '◆', bulletSizeRatio: 0.78, indentPerLevel: 28, itemGap: 8, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.4, h1LineHeight: 1.10, centered: true,
    },
    category: 'dark',
    decor: { kind: 'watermark', opacity: 0.05, color: '#7eb8da', scale: 1.4 },
    gradient: { enabled: true, color1: '#0d1117', color2: '#7eb8da' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 17。 iphone-note (iPhone备忘录) ──────────────────────────────────────
  // 1:1 复刻 iPhone 备忘录 App 视觉特征：
  //   • 暖黄纸面 — 备忘录的温暖底色
  //   • 应用图标黄 accent — 标志性的 #f5c542
  //   • 系统无衬线字体 — PingFang SC / San Francisco 风格
  //   • 零装饰 — 极简 iOS 设计语言
  //   • 细密纸纹 — 模拟 iPhone 屏幕上的纸感
  //   • 扁平微投影 — iOS 系统卡片的柔和阴影
  {
    id: 'iphone-note',
    name: 'iPhone备忘录',
    mood: 'iOS备忘录暖黄纸极致简约',
    preset: 'iOS备忘',
    description: '1:1 复刻 iPhone 备忘录 App：暖黄纸面、应用图标标志性暖黄 accent、SF 风格无衬线字体、零装饰极简 iOS 设计语言，适合日常记录与随手速记',
    tags: ['iOS', '备忘', '暖黄', '极简', 'Apple'],
    mode: 'paper',
    palette: {
      page: '#fefefc',          // 备忘录真实底色 — 极净暖白，与 iPhone 屏幕一致
      pageAlt: '#f9f6ef',       // 微暖纸底 — 比纯白多一层暖黄意
      text: '#1d1d1f',          // SF 系统黑 — Apple 的标准文本色 Lab(0,0,0)
      muted: '#8e8e93',         // 系统灰 — iOS 次级文本 #8e8e93
      accent: '#f5c542',        // 备忘录黄 — iPhone Notes 应用图标标志性暖黄
      accentSoft: 'rgba(245,197,66,0.16)',
      border: 'rgba(140,135,125,0.08)',
      shadow: 'rgba(95,90,80,0.06)',
      glow: 'rgba(250,235,190,0.20)',
    },
    surface: {
      grainAlpha: 0.008,        // 极微纸纹 — iPhone 屏幕的细腻纸感
      vignetteAlpha: 0.010,     // 几乎无暗角 — 平面 iOS 设计
      washStrength: 0.12,       // 微暖柔光 — 备忘录的黄调光晕
      innerFrameAlpha: 0.04,    // 极微内框 — iOS 卡片的隐约边界
      innerFrameInset: 24,
      titleAccentMix: 0.42,     // 标题微染暖黄色
      footerLineAlpha: 0.10,
      footerTextAlpha: 0.82,
      previewShadow:
        '0 6px 24px rgba(95,90,80,0.06), 0 1px 4px rgba(0,0,0,0.01), 0 1px 0 rgba(255,255,255,0.7) inset',
    },
    components: {
      quoteFillAlpha: 0.034,    // 引用：微底色
      quoteStrokeAlpha: 0.056,
      quoteBarAlpha: 0.66,
      quoteRadius: 18,          // iOS 风格的圆角引用
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.48,
      highlightMarkerAlpha: 0.20,
      highlightDashAlpha: 0.54,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.76,
      bodyFontMode: 'notosans',  // 思源黑体 — 最接近 SF / PingFang 的可用字体
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.55, h3Scale: 1.25,
        h1LineHeight: 1.15, h2LineHeight: 1.25, h3LineHeight: 1.35,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 28, h1MarginBottom: 12,
      },
      list: { bulletChar: '•', bulletSizeRatio: 0.80, indentPerLevel: 26, itemGap: 6 },
    },
    coverHeading: {
      h1Scale: 3.8, h1LineHeight: 1.08, centered: false,
    },
    category: 'light',
    decor: { kind: 'iosNotesNav', opacity: 0.92, color: '#8e8e93', scale: 1.0 },
    gradient: { enabled: false, color1: '#f9f6ef', color2: '#fefefc' },
  },

  // ── 18。 notebook-paper (笔记本) ──────────────────────────────────────────
  // 重大设计升级：横线纸质感 + 墨水蓝素描贴纸 + 活页孔氛围
  // 真实笔记本白纸、蓝黑墨水色、角落涂鸦排线、微蓝横线渐变
  {
    id: 'notebook-paper',
    name: '笔记本',
    mood: '横线笔记本蓝黑墨水手写涂鸦',
    preset: '学生笔记',
    description: '真实横线纸白底、经典蓝黑墨水、角落涂鸦素描贴纸、活页孔氛围，适合学习笔记、课堂整理与随手速记',
    tags: ['笔记', '学习', '墨水', '涂鸦'],
    mode: 'paper',
    palette: {
      page: '#fdfdfa',          // 真实笔记本纸白 — 微蓝调的白
      pageAlt: '#eef0f6',       // 蓝灰横线底 — 模拟横线纸的蓝色调
      text: '#1a1a30',          // 蓝黑墨水 — 圆珠笔的经典墨色
      muted: '#6b7d98',         // 淡墨蓝灰 — 被橡皮擦过的铅笔字
      accent: '#3b5db8',        // 蓝黑墨水 — 比之前更深更浓的笔墨色
      accentSoft: 'rgba(59,93,184,0.16)',
      border: 'rgba(59,93,184,0.12)',
      shadow: 'rgba(35,55,110,0.08)',
      glow: 'rgba(200,218,248,0.28)',
    },
    surface: {
      grainAlpha: 0.022,        // 横线纸微纹 — 比普通纸更光滑但仍有质感
      vignetteAlpha: 0.024,
      washStrength: 0.16,
      innerFrameAlpha: 0.08,
      innerFrameInset: 20,
      titleAccentMix: 0.68,
      footerLineAlpha: 0.18,
      footerTextAlpha: 0.88,
      previewShadow:
        '0 20px 42px rgba(35,55,110,0.08), 0 1px 12px rgba(255,255,250,0.38) inset',
    },
    components: {
      quoteFillAlpha: 0.038,
      quoteStrokeAlpha: 0.066,
      quoteBarAlpha: 0.66,
      quoteRadius: 10,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.64,
      highlightMarkerAlpha: 0.28,
      highlightDashAlpha: 0.76,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.78,
      bodyFontMode: 'kaiti',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.0, h2Scale: 1.55, h3Scale: 1.25,
        h1LineHeight: 1.25, h2LineHeight: 1.35, h3LineHeight: 1.45,
        h1FontWeight: 600, h2FontWeight: 500, h3FontWeight: 400,
        h1MarginTop: 20, h1MarginBottom: 10,
      },
      list: { bulletChar: '—', bulletSizeRatio: 0.78, indentPerLevel: 26, itemGap: 6 },
    },
    coverHeading: {
      h1Scale: 3.8, h1LineHeight: 1.15, centered: false,
    },
    category: 'light',
    decor: { kind: 'cornerBracket', opacity: 0.22, color: '#3b5db8', scale: 1.0 },
    gradient: { enabled: true, color1: '#eef0f6', color2: '#fdfdfa', angle: 135 },
  },

  // ── 19。 chinese-trad (中国传统) ────────────────────────────────────────
  // 重大设计升级：澄心堂纸质感 + 朱砂印章贴纸 + 金箔微光
  // 五色体系：黄（纸）、赤（印）、青（裱绫）、黑（墨）、金（箔）
  {
    id: 'chinese-trad',
    name: '中国传统',
    mood: '澄心堂纸松烟墨朱砂印金箔微光',
    preset: '澄心堂纸',
    description: '澄心堂楮皮纸纹理、松烟墨色正文、朱砂红印章贴纸、金箔微光点缀，适合古风诗词、文言语录与书画题跋',
    tags: ['澄心堂', '松烟', '辰砂', '金箔', '印章'],
    mode: 'paper',
    palette: {
      page: '#f7f1e4',          // 澄心堂纸 — 北宋名纸温润如玉的米黄色
      pageAlt: '#efe1cc',       // 旧绢托底 — 古画裱褙的岁月金黄
      text: '#1c1a16',          // 松烟墨黑 — 比纯黑多褐暖的古法墨色
      muted: '#908270',         // 碑帖石褐 — 拓片上的金石味
      accent: '#c9422e',        // 辰砂朱红 — 朱砂印泥的饱满正红
      accentSoft: 'rgba(201,66,46,0.10)',
      border: 'rgba(160,140,115,0.08)',
      shadow: 'rgba(35,25,15,0.06)',
      glow: 'rgba(230,200,155,0.22)',   // 金箔微光 — 传统泥金笺的温润光泽
    },
    surface: {
      grainAlpha: 0.052,        // 楮皮长纤维 — 比普通纸更明显的纸纹
      vignetteAlpha: 0.046,     // 古画边角微暗 — 岁月侵蚀的自然暗角
      washStrength: 0.20,       // 金箔柔光漫射 — 泥金纸面的温润反射
      innerFrameAlpha: 0.09,    // 裱绫纹边框 — 古画装裱的绫边留白
      innerFrameInset: 36,      // 更宽的留白 — 中国画的"计白当黑"
      titleAccentMix: 0.52,     // 标题半染辰砂色
      footerLineAlpha: 0.14,
      footerTextAlpha: 0.82,
      previewShadow:
        '0 20px 44px rgba(35,25,15,0.06), 0 1px 10px rgba(250,242,225,0.38) inset, 0 0 0 1px rgba(200,160,100,0.06) inset',
    },
    components: {
      quoteFillAlpha: 0.038,    // 引用底色微染 — 仿古书眉批
      quoteStrokeAlpha: 0.060,
      quoteBarAlpha: 0.66,      // 更明显的辰砂强调条
      quoteRadius: 2,           // 直角 — 中式书法的方正
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.40,
      highlightMarkerAlpha: 0.18,
      highlightDashAlpha: 0.48,
    },
    editor: {
      bodySize: 30,
      lineHeight: 2.0,
      bodyFontMode: 'fangsong',  // 仿宋 — 最接近古籍刻本的现代字体
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.8, h2Scale: 1.75, h3Scale: 1.4,
        h1LineHeight: 1.35, h2LineHeight: 1.45, h3LineHeight: 1.55,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 30, h1MarginBottom: 16,
        h1Color: '#c9422e',     // 标题辰砂色 — 如书画题跋的朱笔
      },
      list: { bulletChar: '◦', bulletSizeRatio: 0.82, indentPerLevel: 30, itemGap: 9 },
    },
    category: 'artistic',
    decor: { kind: 'sealStamp', opacity: 0.88, color: '#c9422e', scale: 1.0 },
    gradient: { enabled: true, color1: '#efe1cc', color2: '#f7f1e4', angle: 135 },
  },

  // ── 20。 alibaba-orange (阿里橙) ────────────────────────────────────────
  // 设计升级：从普通橙色卡 → 天猫/淘宝级品牌质感，
  // 暖日橙渐变、深灰蓝文本、数据可视化级别的精密色板
  {
    id: 'alibaba-orange',
    name: '阿里橙',
    mood: '天猫暖日橙数字丝路活力',
    preset: '天猫暖橙',
    description: '天猫暖日橙渐变、深蓝灰文本、活力与专业并存的电商品牌质感',
    tags: ['天猫', '暖橙', '电商'],
    mode: 'paper',
    palette: {
      page: '#fefbf6',          // 暖白底 — 接近天猫 App 的卡片底色
      pageAlt: '#fef3e4',       // 晨曦橙雾 — 日出色调的微渐变
      text: '#1a1d24',          // 深蓝灰 — 比纯黑更适合电商阅读
      muted: '#6b6f7a',         // 冷灰蓝 — 平衡橙色的暖
      accent: '#ff6a2c',        // 天猫活力橙 — 更饱和、更年轻
      accentSoft: 'rgba(255,106,44,0.16)',
      border: 'rgba(255,106,44,0.14)',
      shadow: 'rgba(180,100,50,0.08)',
      glow: 'rgba(255,185,130,0.22)',
    },
    surface: {
      grainAlpha: 0.012,
      vignetteAlpha: 0.018,
      washStrength: 0.18,
      innerFrameAlpha: 0.10,
      innerFrameInset: 22,
      titleAccentMix: 0.74,
      footerLineAlpha: 0.18,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 20px 44px rgba(180,100,50,0.08), 0 2px 12px rgba(255,245,235,0.40) inset',
    },
    components: {
      quoteFillAlpha: 0.048,
      quoteStrokeAlpha: 0.070,
      quoteBarAlpha: 0.78,
      quoteRadius: 12,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.64,
      highlightMarkerAlpha: 0.36,
      highlightDashAlpha: 0.80,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.82,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 22, h1MarginBottom: 10,
        h1Color: '#ff6a2c',
      },
      list: { bulletChar: '▸', bulletSizeRatio: 0.78, indentPerLevel: 24, itemGap: 6, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.0, h1LineHeight: 1.12, centered: true,
    },
    category: 'professional',
    decor: { kind: 'geometricPattern', opacity: 0.12, color: '#ff6a2c', scale: 1.02 },
    gradient: { enabled: false, color1: '#fef3e4', color2: '#fefbf6' },
  },

  // ── 21。 japanese-mag (日本杂志) ────────────────────────────────────────
  // 设计升级：从米灰平淡 → POPEYE/Brutus 级日杂美学，
  // 和纸奶油底、墨汁黑文本、蓝染靛青 accent、非对称排版
  {
    id: 'japanese-mag',
    name: '日本杂志',
    mood: 'POPEYE级和纸墨汁蓝染靛青',
    preset: '日杂编辑',
    description: '和纸奶油底、墨汁纯黑文本、蓝染靛青 accent、非对称留白，POPEYE/Brutus 级别的日杂质感',
    tags: ['和纸', '靛青', '编辑'],
    mode: 'paper',
    palette: {
      page: '#faf8f3',          // 和纸奶油 — 日本杂志用的高级纸色
      pageAlt: '#f2ece0',       // 古纸肌 — 微微旧化的底层
      text: '#1a1a1a',          // 墨汁黑 — 极致的纯正黑，日杂的灵魂
      muted: '#747060',         // 墨褐灰 — 被水稀释的墨色
      accent: '#2c4870',        // 蓝染靛青 — 日本传统蓝染的深沉蓝色
      accentSoft: 'rgba(44,72,112,0.10)',
      border: 'rgba(30,28,22,0.08)',
      shadow: 'rgba(20,18,14,0.04)',
      glow: 'rgba(200,192,175,0.15)',
    },
    surface: {
      grainAlpha: 0.028,
      vignetteAlpha: 0.024,
      washStrength: 0.12,
      innerFrameAlpha: 0.10,
      innerFrameInset: 26,
      titleAccentMix: 0.58,
      footerLineAlpha: 0.14,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 16px 36px rgba(20,18,14,0.04), 0 1px 8px rgba(250,248,243,0.32) inset',
    },
    components: {
      quoteFillAlpha: 0.040,
      quoteStrokeAlpha: 0.064,
      quoteBarAlpha: 0.66,
      quoteRadius: 2,
      quoteTreatment: 'callout',
      highlightTreatment: 'swissRule',
      highlightUnderlineAlpha: 0.44,
      highlightMarkerAlpha: 0.16,
      highlightDashAlpha: 0.62,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.88,
      bodyFontMode: 'simsun',
      bodyFontWeight: 350,
      subheadingStyle: 'accent',
      highlightStyle: 'border',
      heading: {
        h1Scale: 3.6, h2Scale: 1.7, h3Scale: 1.35,
        h1LineHeight: 1.22, h2LineHeight: 1.32, h3LineHeight: 1.42,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 10,
        h1Color: '#2c4870',
      },
      list: { bulletChar: '—', bulletSizeRatio: 0.76, indentPerLevel: 28, itemGap: 6, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 5.0, h1LineHeight: 1.12, centered: true,
    },
    category: 'professional',
    decor: { kind: 'cornerBracket', opacity: 0.16, color: '#2c4870', scale: 1.0 },
    gradient: { enabled: false, color1: '#f2ece0', color2: '#faf8f3' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Vintage mode ──────────────────────────────────────────────────────────

  // ── 22。 vintage-typewriter (复古打字机) ────────────────────────────────
  // 重大设计升级：打字机稿纸 + 炭笔涂鸦贴纸 + 烟熏墨带氛围
  // 烟叶熏黄打字纸、深褐墨带色、角落编辑涂鸦排线、海明威式的粗粝文学质感
  {
    id: 'vintage-typewriter',
    name: '复古打字机',
    mood: '海明威书房烟叶熏纸墨带涂鸦',
    preset: '烟熏稿纸',
    description: '烟叶熏黄打字纸、深褐墨带色、角落编辑涂鸦贴纸、墨迹压痕，海明威式的粗粝文学质感',
    tags: ['烟熏', '墨带', '海明威', '涂鸦'],
    mode: 'vintage',
    palette: {
      page: '#f2ebe0',          // 烟熏稿纸 — 被烟草和时光熏黄的纸上色
      pageAlt: '#e8dcca',       // 旧书页 — 更深的氧化色
      text: '#261e15',          // 墨带黑褐 — Olivetti 打字机色带的不均匀墨色
      muted: '#8a7862',         // 咖啡渍褐 — 有故事感的次级色
      accent: '#6b4423',        // 深胡桃木 — 打字机木质机身的颜色
      accentSoft: 'rgba(107,68,35,0.18)',
      border: 'rgba(140,110,80,0.14)',
      shadow: 'rgba(100,70,40,0.12)',
      glow: 'rgba(225,200,165,0.22)',
    },
    surface: {
      grainAlpha: 0.062,        // 更强打字纸纤维 — 廉价打字纸的粗糙触感
      vignetteAlpha: 0.068,     // 更强暗角 — 老书房角落的阴影
      washStrength: 0.44,       // 更浓的烟熏暖光
      innerFrameAlpha: 0.14,    // 更可见的稿纸边框
      innerFrameInset: 24,
      titleAccentMix: 0.86,
      footerLineAlpha: 0.24,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 28px 56px rgba(100,70,40,0.14), 0 2px 20px rgba(242,235,224,0.44) inset',
    },
    components: {
      quoteFillAlpha: 0.058,
      quoteStrokeAlpha: 0.086,
      quoteBarAlpha: 0.80,
      quoteRadius: 6,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.62,
      highlightMarkerAlpha: 0.34,
      highlightDashAlpha: 0.76,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.84,
      bodyFontMode: 'simsun',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.22, h2LineHeight: 1.32, h3LineHeight: 1.42,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 22, h1MarginBottom: 12,
        h1Color: '#6b4423',
      },
      list: { bulletChar: '—', bulletSizeRatio: 0.78, indentPerLevel: 26, itemGap: 7 },
    },
    coverHeading: {
      h1Scale: 4.2, h1LineHeight: 1.12, centered: false,
    },
    category: 'artistic',
    decor: { kind: 'fanBurst', opacity: 0.22, color: '#6b4423', scale: 1.02 },
    gradient: { enabled: true, color1: '#e8dcca', color2: '#f2ebe0', angle: 135 },
  },

  // ── 23。 kraft-paper (复古牛皮纸) ──────────────────────────────────────
  {
    id: 'kraft-paper',
    name: '复古牛皮纸',
    mood: '牛皮纸手工剪贴簿质感',
    preset: '牛皮手工',
    description: '棕色牛皮纸纹理、图钉胶带装饰、手工做旧，适合旅行日记与手工记录',
    tags: ['牛皮纸', '手工', '怀旧'],
    mode: 'vintage',
    palette: {
      page: '#c4a67a',
      pageAlt: '#b8956a',
      text: '#2d1a0a',
      muted: '#6b5040',
      accent: '#8b4513',
      accentSoft: 'rgba(139,69,19,0.18)',
      border: 'rgba(139,69,19,0.16)',
      shadow: 'rgba(80,40,15,0.14)',
      glow: 'rgba(200,170,130,0.16)',
    },
    surface: {
      grainAlpha: 0.058,
      vignetteAlpha: 0.064,
      washStrength: 0.44,
      innerFrameAlpha: 0.12,
      innerFrameInset: 26,
      titleAccentMix: 0.84,
      footerLineAlpha: 0.22,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 28px 56px rgba(80,40,15,0.14), 0 2px 20px rgba(200,170,130,0.30) inset',
    },
    components: {
      quoteFillAlpha: 0.058,
      quoteStrokeAlpha: 0.090,
      quoteBarAlpha: 0.76,
      quoteRadius: 14,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.72,
      highlightMarkerAlpha: 0.36,
      highlightDashAlpha: 0.84,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.84,
      bodyFontMode: 'kaiti',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.25, h2LineHeight: 1.35, h3LineHeight: 1.45,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 12,
        h1Color: '#8b4513',
      },
      list: { bulletChar: '•', bulletSizeRatio: 0.84, indentPerLevel: 28, itemGap: 8 },
    },
    coverHeading: {
      h1Scale: 4.0, h1LineHeight: 1.15, centered: true,
    },
    category: 'artistic',
    decor: { kind: 'watermark', opacity: 0.12, color: '#8b4513', scale: 1.15 },
    gradient: { enabled: false, color1: '#b8956a', color2: '#c4a67a' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Swiss mode ────────────────────────────────────────────────────────────

  // ── 24。 business-brief (商务简报) ──────────────────────────────────────
  // 设计升级：从平淡藏蓝 → McKinsey 级咨询报告美学，
  // 石板蓝灰主色、精密数据可视化色板、执行摘要级别的克制
  {
    id: 'business-brief',
    name: '商务简报',
    mood: 'McKinsey级石板蓝灰精密报告',
    preset: '石板蓝灰',
    description: '石板蓝灰主色、精密 KPI 数据色板、执行摘要级别的克制排版，适合咨询报告与董事会议',
    tags: ['咨询', '精密', '董事'],
    mode: 'swiss',
    palette: {
      page: '#fcfdfd',          // 纯白画布 — 无可挑剔的底色
      pageAlt: '#f3f5f8',       // 冷调雾灰 — 比旧版少一些蓝色
      text: '#1a1e26',          // 深石板蓝黑 — 专业但有色彩调性
      muted: '#5c6478',         // 中石板灰 — 数据标注的标准色
      accent: '#4a5568',        // 温石板灰蓝 — 比深蓝更现代中性
      accentSoft: 'rgba(74,85,104,0.12)',
      border: 'rgba(74,85,104,0.14)',
      shadow: 'rgba(30,40,55,0.06)',
      glow: 'rgba(74,85,104,0.04)',
    },
    surface: {
      grainAlpha: 0,
      vignetteAlpha: 0.010,
      washStrength: 0,
      innerFrameAlpha: 0.20,
      innerFrameInset: 22,
      titleAccentMix: 0.70,
      footerLineAlpha: 0.26,
      footerTextAlpha: 0.94,
      previewShadow:
        '0 18px 40px rgba(20,30,45,0.06), 0 1px 6px rgba(0,0,0,0.03) inset',
    },
    components: {
      quoteFillAlpha: 0.040,
      quoteStrokeAlpha: 0.09,
      quoteBarAlpha: 0.84,
      quoteRadius: 4,
      quoteTreatment: 'callout',
      highlightTreatment: 'swissRule',
      highlightUnderlineAlpha: 0.52,
      highlightMarkerAlpha: 0.20,
      highlightDashAlpha: 0.84,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.72,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'border',
      heading: {
        h1Scale: 2.8, h2Scale: 1.55, h3Scale: 1.25,
        h1LineHeight: 1.12, h2LineHeight: 1.22, h3LineHeight: 1.32,
        h1FontWeight: 800, h2FontWeight: 700, h3FontWeight: 600,
        h1MarginTop: 16, h1MarginBottom: 8,
        h1Color: '#4a5568',
      },
      list: { bulletChar: '—', bulletSizeRatio: 0.75, indentPerLevel: 24, itemGap: 6 },
    },
    coverHeading: {
      h1Scale: 3.6, h1LineHeight: 1.08, centered: true,
    },
    category: 'professional',
    decor: { kind: 'geometricPattern', opacity: 0.08, color: '#4a5568', scale: 1.06 },
    gradient: { enabled: false, color1: '#f3f5f8', color2: '#fcfdfd' },
  },

  // ── 25。 bytestyle (字节范) ─────────────────────────────────────────────
  // 设计升级：从泛蓝科技 → 飞书/抖音级动态品牌感，
  // 电光蓝紫渐变、深空灰文本、年轻跃动的几何能量
  {
    id: 'bytestyle',
    name: '字节范',
    mood: '飞书电光蓝紫跳动几何能量',
    preset: '电光蓝紫',
    description: '电光蓝到紫罗兰渐变、深空灰文本、跳动几何色块、飞书/抖音般的年轻动能',
    tags: ['飞书', '电光', '动能'],
    mode: 'swiss',
    palette: {
      page: '#fafafe',          // 超净白 — 飞书文档的底层白
      pageAlt: '#f0f3fe',       // 微蓝雾 — 轻柔的蓝紫过渡
      text: '#181b28',          // 深空灰蓝 — 字节系文本色
      muted: '#5b6380',         // 灰紫蓝 — 现代次级色
      accent: '#4f6ef6',        // 电光蓝紫 — 比旧版 #3370ff 更紫更跳
      accentSoft: 'rgba(79,110,246,0.14)',
      border: 'rgba(79,110,246,0.16)',
      shadow: 'rgba(30,60,140,0.06)',
      glow: 'rgba(150,170,255,0.12)',
    },
    surface: {
      grainAlpha: 0,
      vignetteAlpha: 0.010,
      washStrength: 0,
      innerFrameAlpha: 0.14,
      innerFrameInset: 20,
      titleAccentMix: 0.66,
      footerLineAlpha: 0.22,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 14px 34px rgba(30,60,140,0.06), 0 1px 8px rgba(79,110,246,0.04) inset',
    },
    components: {
      quoteFillAlpha: 0.040,
      quoteStrokeAlpha: 0.080,
      quoteBarAlpha: 0.78,
      quoteRadius: 6,
      quoteTreatment: 'callout',
      highlightTreatment: 'swissRule',
      highlightUnderlineAlpha: 0.54,
      highlightMarkerAlpha: 0.22,
      highlightDashAlpha: 0.82,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.76,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'border',
      list: { bulletChar: '▸', bulletSizeRatio: 0.78, indentPerLevel: 24, itemGap: 6, orderedMarkerBox: true },
    },
    category: 'professional',
    decor: { kind: 'geometricPattern', opacity: 0.10, color: '#4f6ef6', scale: 1.04 },
    gradient: { enabled: true, color1: '#4f6ef6', color2: '#8b5cf6', angle: 135 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Obsidian mode ─────────────────────────────────────────────────────────

  // ── 26。 dark-mode (暗黑模式) ───────────────────────────────────────────
  {
    id: 'dark-mode',
    name: '暗黑模式',
    mood: 'App暗黑主题护眼现代',
    preset: '暗黑UI',
    description: '深灰底色、浅色文字、OLED友好、分层灰阶，适合夜间阅读与App暗色风格',
    tags: ['暗黑', '护眼', '现代'],
    mode: 'obsidian',
    palette: {
      page: '#16162a',
      pageAlt: '#20203c',
      text: '#e8e8f0',
      muted: '#888898',
      accent: '#6b7dff',
      accentSoft: 'rgba(107,125,255,0.16)',
      border: 'rgba(150,160,180,0.10)',
      shadow: 'rgba(6,6,24,0.50)',
      glow: 'rgba(107,125,255,0.08)',
    },
    surface: {
      grainAlpha: 0.05,
      vignetteAlpha: 0.08,
      washStrength: 0.20,
      innerFrameAlpha: 0.14,
      innerFrameInset: 24,
      titleAccentMix: 0.82,
      footerLineAlpha: 0.20,
      footerTextAlpha: 0.82,
      previewShadow:
        '0 28px 58px rgba(6,6,24,0.50), 0 2px 18px rgba(0,0,0,0.26) inset',
    },
    components: {
      quoteFillAlpha: 0.050,
      quoteStrokeAlpha: 0.092,
      quoteBarAlpha: 0.72,
      quoteRadius: 12,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.56,
      highlightMarkerAlpha: 0.36,
      highlightDashAlpha: 0.68,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.86,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 12,
      },
      list: { bulletChar: '›', bulletSizeRatio: 0.76, indentPerLevel: 24, itemGap: 6, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.0, h1LineHeight: 1.12, centered: true,
    },
    category: 'dark',
    decor: { kind: 'circuitTrace', opacity: 0.08, color: '#6b7dff', scale: 0.92 },
    gradient: { enabled: true, color1: '#16162a', color2: '#6b7dff' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Cyber mode ────────────────────────────────────────────────────────────

  // ── 27。 dark-tech (暗黑科技) ───────────────────────────────────────────
  {
    id: 'dark-tech',
    name: '暗黑科技',
    mood: '终端绿代码编辑器暗黑美学',
    preset: '终端代码',
    description: 'GitHub暗黑底、终端绿色高亮、等宽字体、扫描线，适合编程卡片与技术文档',
    tags: ['科技', '代码', '终端'],
    mode: 'cyber',
    palette: {
      page: '#0c1412',
      pageAlt: '#101c18',
      text: '#c8d0da',
      muted: '#6b7888',
      accent: '#00ff41',
      accentSoft: 'rgba(0,255,65,0.14)',
      border: 'rgba(0,255,65,0.16)',
      shadow: 'rgba(0,255,65,0.08)',
      glow: 'rgba(0,255,65,0.06)',
    },
    surface: {
      grainAlpha: 0.015,
      vignetteAlpha: 0.06,
      washStrength: 0.18,
      innerFrameAlpha: 0.12,
      innerFrameInset: 16,
      titleAccentMix: 0.86,
      footerLineAlpha: 0.22,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 0 36px rgba(0,255,65,0.08), 0 0 72px rgba(0,200,50,0.04), 0 2px 14px rgba(0,0,0,0.40) inset',
    },
    components: {
      quoteFillAlpha: 0.040,
      quoteStrokeAlpha: 0.090,
      quoteBarAlpha: 0.76,
      quoteRadius: 2,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.52,
      highlightMarkerAlpha: 0.34,
      highlightDashAlpha: 0.70,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.76,
      bodyFontMode: 'dengxian',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.6, h2Scale: 1.7, h3Scale: 1.35,
        h1LineHeight: 1.15, h2LineHeight: 1.25, h3LineHeight: 1.35,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 18, h1MarginBottom: 10,
        h1Color: '#00ff41',
      },
      list: { bulletChar: '›', bulletSizeRatio: 0.74, indentPerLevel: 22, itemGap: 5, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.8, h1LineHeight: 1.06, centered: true,
    },
    category: 'dark',
    decor: { kind: 'circuitTrace', opacity: 0.16, color: '#00ff41', scale: 1 },
    gradient: { enabled: true, color1: '#00ff41', color2: '#0c1412' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Glass mode ────────────────────────────────────────────────────────────

  // ── 28。 dreamy-gradient (梦幻渐变) ─────────────────────────────────────
  // 设计升级：从普通紫橙 → 星云深空玫瑰金，
  // 宇宙深蓝到玫瑰金渐变、星尘微粒、星云光雾弥漫
  {
    id: 'dreamy-gradient',
    name: '梦幻渐变',
    mood: '星云深空玫瑰金宇宙幻彩',
    preset: '星云玫瑰',
    description: '深空蓝到玫瑰金宇宙渐变、星尘微粒弥散、星云光雾，适合艺术品牌与梦幻叙事',
    tags: ['星云', '玫瑰金', '宇宙'],
    mode: 'glass',
    palette: {
      page: 'rgba(248,246,252,0.52)',     // 星云白 — 微紫调的柔光基底
      pageAlt: 'rgba(240,230,242,0.42)',  // 淡紫雾 — 玫瑰金褪色后的余晖
      text: '#1b162a',                     // 深空靛黑 — 宇宙深处的深邃
      muted: '#6b6085',                    // 星尘灰紫 — 弥散的次级色调
      accent: '#b86e8c',                   // 玫瑰金 — 不是紫不是粉，是恒星暮光
      accentSoft: 'rgba(184,110,140,0.16)',
      border: 'rgba(184,110,140,0.14)',
      shadow: 'rgba(130,70,100,0.10)',
      glow: 'rgba(220,170,195,0.20)',
    },
    surface: {
      grainAlpha: 0,              // 无纹理 — 光滑星云镜面
      vignetteAlpha: 0.014,
      washStrength: 0.26,
      innerFrameAlpha: 0.05,
      innerFrameInset: 22,
      titleAccentMix: 0.68,
      footerLineAlpha: 0.12,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 12px 36px rgba(130,70,100,0.12), 0 2px 14px rgba(255,250,252,0.50) inset, 0 0 0 1px rgba(220,170,195,0.12) inset',
    },
    components: {
      quoteFillAlpha: 0.046,
      quoteStrokeAlpha: 0.074,
      quoteBarAlpha: 0.68,
      quoteRadius: 16,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.56,
      highlightMarkerAlpha: 0.24,
      highlightDashAlpha: 0.64,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.82,
      bodyFontMode: 'yahei',
      bodyFontWeight: 350,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.3, h2Scale: 1.55, h3Scale: 1.3,
        h1LineHeight: 1.18, h2LineHeight: 1.28, h3LineHeight: 1.38,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
      },
      list: { bulletChar: '◇', bulletSizeRatio: 0.76, indentPerLevel: 26, itemGap: 6 },
    },
    category: 'artistic',
    decor: { kind: 'auroraGlow', opacity: 0.18 },
    gradient: { enabled: true, color1: '#3b2d6e', color2: '#d4877c', angle: 140 },
  },

  // ── 29。 instagram (Instagram风格) ──────────────────────────────────────
  {
    id: 'instagram',
    name: 'Instagram风格',
    mood: 'IG社交平台潮流渐变',
    preset: 'IG潮流',
    description: '时尚渐变背景、白色粗体标题、社交互动元素、竖屏比例，适合社媒内容与品牌推广',
    tags: ['Instagram', '社交', '潮流'],
    mode: 'glass',
    palette: {
      page: 'rgba(255,255,255,0.48)',
      pageAlt: 'rgba(255,235,240,0.38)',
      text: '#1a1525',
      muted: '#6e6080',
      accent: '#e1306c',
      accentSoft: 'rgba(225,48,108,0.18)',
      border: 'rgba(225,48,108,0.16)',
      shadow: 'rgba(225,48,108,0.10)',
      glow: 'rgba(255,180,200,0.18)',
    },
    surface: {
      grainAlpha: 0,
      vignetteAlpha: 0.014,
      washStrength: 0.22,
      innerFrameAlpha: 0.07,
      innerFrameInset: 22,
      titleAccentMix: 0.74,
      footerLineAlpha: 0.15,
      footerTextAlpha: 0.86,
      previewShadow:
        '0 16px 38px rgba(225,48,108,0.14), 0 2px 12px rgba(255,255,255,0.48) inset, 0 0 0 1px rgba(255,255,255,0.28) inset',
    },
    components: {
      quoteFillAlpha: 0.048,
      quoteStrokeAlpha: 0.080,
      quoteBarAlpha: 0.70,
      quoteRadius: 16,
      quoteTreatment: 'callout',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.62,
      highlightMarkerAlpha: 0.30,
      highlightDashAlpha: 0.72,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.80,
      bodyFontMode: 'yahei',
      bodyFontWeight: 350,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.5, h2Scale: 1.65, h3Scale: 1.35,
        h1LineHeight: 1.15, h2LineHeight: 1.25, h3LineHeight: 1.35,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 10,
      },
      list: { bulletChar: '◇', bulletSizeRatio: 0.78, indentPerLevel: 26, itemGap: 6, orderedMarkerBox: true },
    },
      coverHeading: {
        h1Scale: 4.4, h1LineHeight: 1.08, centered: true,
      },
    category: 'artistic',
    decor: { kind: 'auroraGlow', opacity: 0.12 },
    gradient: { enabled: true, color1: '#e1306c', color2: '#f77737' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Brutal mode ───────────────────────────────────────────────────────────

  // ── 30。 pop-art (波普艺术) ─────────────────────────────────────────────
  {
    id: 'pop-art',
    name: '波普艺术',
    mood: '安迪沃霍尔大胆撞色漫画',
    preset: '波普撞色',
    description: '高饱和红黄蓝撞色、粗黑边框、网点纹理、漫画封面感，适合视觉冲击与创意表达',
    tags: ['波普', '撞色', '漫画'],
    mode: 'brutal',
    palette: {
      page: '#ffed00',
      pageAlt: '#ffed00',
      text: '#000000',
      muted: '#444444',
      accent: '#e6332a',
      accentSoft: 'rgba(230,51,42,0.24)',
      border: 'rgba(0,0,0,0.92)',
      shadow: 'rgba(0,0,0,0)',
      glow: 'rgba(0,0,0,0)',
    },
    surface: {
      grainAlpha: 0,
      vignetteAlpha: 0,
      washStrength: 0,
      innerFrameAlpha: 0.85,
      innerFrameInset: 10,
      titleAccentMix: 0,
      footerLineAlpha: 0.88,
      footerTextAlpha: 1.0,
      previewShadow:
        '5px 5px 0px rgba(0,0,0,0.88)',
    },
    components: {
      quoteFillAlpha: 0.04,
      quoteStrokeAlpha: 0.88,
      quoteBarAlpha: 0.96,
      quoteRadius: 0,
      quoteTreatment: 'code',
      highlightTreatment: 'swissRule',
      highlightUnderlineAlpha: 0.86,
      highlightMarkerAlpha: 0.64,
      highlightDashAlpha: 0.96,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.62,
      bodyFontMode: 'dengxian',
      bodyFontWeight: 500,
      subheadingStyle: 'accent',
      highlightStyle: 'border',
      heading: {
        h1Scale: 4.0, h2Scale: 1.8, h3Scale: 1.4,
        h1LineHeight: 1.1, h2LineHeight: 1.25, h3LineHeight: 1.35,
        h1FontWeight: 900, h2FontWeight: 800, h3FontWeight: 700,
        h1MarginTop: 28, h1MarginBottom: 14,
      },
      list: { bulletChar: '■', bulletSizeRatio: 0.90, indentPerLevel: 22, itemGap: 5, orderedMarkerBox: true },
    },
      coverHeading: {
        h1Scale: 5.2, h1LineHeight: 1.05, centered: true,
      },
    category: 'artistic',
    decor: { kind: 'none', opacity: 0 },
    gradient: { enabled: true, color1: '#ffed00', color2: '#e6332a' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Luxe mode ─────────────────────────────────────────────────────────────

  // ── 31。 art-deco (艺术装饰) ────────────────────────────────────────────
  {
    id: 'art-deco',
    name: '艺术装饰',
    mood: '爵士时代乌木金箔几何美学',
    preset: '装饰艺术',
    description: '乌木黑底、香槟金文、几何直角边框、抛光大理石质感，适合高端品牌宣言与珍藏级内容',
    tags: ['装饰艺术', '奢华', '几何'],
    mode: 'luxe',
    palette: {
      page: '#191714',         // 乌木黑 — 深邃抛光石材基底
      pageAlt: '#23201a',      // 深炭灰 — 微暖过渡
      text: '#e8dbb8',         // 香槟金 — 温暖光泽正文
      muted: '#9a8d6a',        // 哑光金 — 次级文本
      accent: '#d4af37',       // 金属金 — 纯正金色高光
      accentSoft: 'rgba(212,175,55,0.14)',
      border: 'rgba(212,175,55,0.20)',
      shadow: 'rgba(6,4,2,0.45)',
      glow: 'rgba(220,185,80,0.13)',
    },
    surface: {
      grainAlpha: 0.014,        // 极细颗粒 — 抛光大理石触感
      vignetteAlpha: 0.054,     // 更强暗角 — 聚光灯戏剧感
      washStrength: 0.28,       // 金色光晕更明显
      innerFrameAlpha: 0.20,    // 几何边框更醒目
      innerFrameInset: 30,      // 更宽的内框留白
      titleAccentMix: 0.96,     // 标题几乎纯金色
      footerLineAlpha: 0.28,    // 金色页脚分割线
      footerTextAlpha: 0.84,
      previewShadow:
        '0 30px 64px rgba(6,4,2,0.48), 0 2px 22px rgba(212,175,55,0.10) inset, 0 0 0 1px rgba(212,175,55,0.16) inset',
    },
    components: {
      quoteFillAlpha: 0.048,      // 金色微染引用底
      quoteStrokeAlpha: 0.096,    // 金色边框可见
      quoteBarAlpha: 0.88,        // 醒目金色强调条
      quoteRadius: 0,             // 直角 — Art Deco拒绝圆角
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.74,
      highlightMarkerAlpha: 0.30,
      highlightDashAlpha: 0.80,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.94,           // 更宽松的行距 — 奢华呼吸感
      bodyFontMode: 'fangsong',   // 仿宋 — 修长优雅的正文字
      bodyFontWeight: 350,
      subheadingStyle: 'accent',  // 金色小标题
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.8, h2Scale: 1.8, h3Scale: 1.4,
        h1LineHeight: 1.15, h2LineHeight: 1.25, h3LineHeight: 1.35,
        h1FontWeight: 900, h2FontWeight: 700, h3FontWeight: 600,
        h1MarginTop: 28, h1MarginBottom: 14,
      },
      list: { bulletChar: '◆', bulletSizeRatio: 0.76, indentPerLevel: 30, itemGap: 8, orderedMarkerBox: true },
    },
      coverHeading: {
        h1Scale: 4.8, h1LineHeight: 1.08, centered: true,
      },
    category: 'professional',
    decor: { kind: 'fanBurst', opacity: 0.14, color: '#d4af37', scale: 1 },
    gradient: { enabled: false, color1: '#23201a', color2: '#191714' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 32。 soft-minimal (极简柔光) ──────────────────────────────────────────
  //
  // 设计来源：UI.md「极简柔光卡片」提示词
  //   • macOS 窗口风格 · 大圆角矩形空白卡片
  //   • 外部：淡香芋紫 → 右下浅天蓝柔过渡
  //   • 内部：奶白基底 + 极浅淡粉紫 / 浅青蓝微渐变
  //   • 丝滑哑光柔焦 · 无杂纹理 · 悬浮投影
  //   • 低饱和马卡龙浅色系 · 柔和漫射光 · 温柔低对比度
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'soft-minimal',
    name: '极简柔光',
    mood: 'macOS窗口奶白马卡龙柔焦',
    preset: '极简柔光',
    description: 'macOS窗口风格、奶白基底配淡紫青蓝微渐变、丝滑哑光柔焦、悬浮投影，适合纯净写作与极简阅读',
    tags: ['极简', '柔光', '马卡龙'],
    mode: 'paper',
    palette: {
      // 内部底色：奶白基底 + 极浅淡粉紫／浅青蓝微渐变
      page: '#fdfaf8',
      // pageAlt：淡粉紫微染（渐变起点 — 左上淡香芋方向）
      pageAlt: '#f5eff4',
      text: '#2d2b2e',
      muted: '#a89faa',
      // 强调色：淡香芋紫 — 对应窗口装饰弧线 / 控制按钮
      accent: '#b8a2c8',
      accentSoft: 'rgba(184,162,200,0.14)',
      border: 'rgba(170,158,180,0.07)',
      // 投影色：低饱和紫灰 — 悬浮分层感
      shadow: 'rgba(155,142,168,0.07)',
      // 柔光光晕：淡紫 + 淡蓝混合漫射
      glow: 'rgba(200,188,215,0.24)',
    },
    surface: {
      // 无杂纹理（UI.md 明确要求）
      grainAlpha: 0,
      // 几乎零暗角 — 柔光不需要边缘压暗
      vignetteAlpha: 0.008,
      // 极淡柔光漫射
      washStrength: 0.12,
      // 微弱内框 — macOS 窗口感
      innerFrameAlpha: 0.04,
      // 大留白内缩 — 窗口内容区呼吸感
      innerFrameInset: 28,
      // 标题淡紫微染 — 不过分抢眼
      titleAccentMix: 0.4,
      footerLineAlpha: 0.08,
      footerTextAlpha: 0.76,
      // 微弱柔和投影 — 悬浮分层效果
      previewShadow:
        '0 8px 32px rgba(150,138,168,0.08), 0 2px 8px rgba(195,185,210,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset',
    },
    components: {
      // 引用：微底色 + 淡紫强调条
      quoteFillAlpha: 0.034,
      quoteStrokeAlpha: 0.050,
      quoteBarAlpha: 0.60,
      quoteRadius: 14,
      quoteTreatment: 'paper',
      // 高亮：柔和下划线
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.36,
      highlightMarkerAlpha: 0.12,
      highlightDashAlpha: 0.42,
    },
    editor: {
      bodySize: 28,
      lineHeight: 1.88,
      // 无衬线 — 现代极简
      bodyFontMode: 'yahei',
      bodyFontWeight: 300,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
    },
    category: 'light',
    // macOS 窗口风格：三色控制按钮 + 淡香芋紫弧线
    decor: { kind: 'macosWindow', opacity: 0.85, color: '#b8a2c8', scale: 1 },
    // 扁平柔和渐变：淡粉紫 → 浅青蓝（内部微渐变）
    gradient: {
      enabled: true,
      color1: '#f5eff4',
      color2: '#eff3f9',
      angle: 135,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 33. canyon-sunset (日落峡谷) ──────────────────────────────────────────
  // 设计升级：从普通米橙 → Monument Valley 史诗级沙漠黄昏，
  // 赤陶土红、钴紫暮色、金赭石渐变、沙漠漆氧化锰般的深色岩层
  {
    id: 'canyon-sunset',
    name: '日落峡谷',
    mood: 'Monument Valley赤陶钴紫史诗黄昏',
    preset: '赤陶峡谷',
    description: '赤陶土红底、钴紫到金赭石史诗渐变、沙漠漆岩层般的深色调，适合壮阔叙事与荒野文学',
    tags: ['赤陶', '峡谷', '史诗'],
    mode: 'vintage',
    palette: {
      page: '#f8ede0',          // 砂岩暖白 — 比旧版更暖、更偏橙
      pageAlt: '#f0d8be',       // 金赭石底 — 沙漠沙丘的金色
      text: '#2d1c14',          // 沙漠漆褐黑 — 氧化锰岩层的深色
      muted: '#8c6048',         // 土褐 — 干涸河床的颜色
      accent: '#b85a3c',        // 赤陶土红 — 真正的 Southwest 陶土色
      accentSoft: 'rgba(184,90,60,0.18)',
      border: 'rgba(160,105,70,0.14)',
      shadow: 'rgba(120,70,40,0.10)',
      glow: 'rgba(240,195,145,0.32)',
    },
    surface: {
      grainAlpha: 0.048,
      vignetteAlpha: 0.052,
      washStrength: 0.38,
      innerFrameAlpha: 0.10,
      innerFrameInset: 26,
      titleAccentMix: 0.84,
      footerLineAlpha: 0.20,
      footerTextAlpha: 0.90,
      previewShadow:
        '0 28px 56px rgba(120,70,40,0.11), 0 2px 18px rgba(248,237,224,0.44) inset',
    },
    components: {
      quoteFillAlpha: 0.052,
      quoteStrokeAlpha: 0.080,
      quoteBarAlpha: 0.76,
      quoteRadius: 16,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.66,
      highlightMarkerAlpha: 0.34,
      highlightDashAlpha: 0.78,
    },
    editor: {
      bodySize: 30,
      lineHeight: 1.88,
      bodyFontMode: 'kaiti',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.5, h2Scale: 1.65, h3Scale: 1.32,
        h1LineHeight: 1.22, h2LineHeight: 1.32, h3LineHeight: 1.42,
        h1FontWeight: 800, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 24, h1MarginBottom: 12,
      },
    },
    coverHeading: {
      h1Scale: 4.2, h1LineHeight: 1.12, centered: true,
    },
    category: 'artistic',
    decor: { kind: 'desertSun', opacity: 0.92, color: '#b85a3c', scale: 1.08 },
    gradient: { enabled: true, color1: '#b85a3c', color2: '#6b3a5b', angle: 175 },
  },

  // ── 34. sakura-blizzard (樱吹雪) ─────────────────────────────────────────
  {
    id: 'sakura-blizzard',
    name: '樱吹雪',
    mood: '日式春樱散落花瓣柔美',
    preset: '樱吹雪',
    description: '淡粉花瓣底色、奶油暖白渐变、散落樱花点缀，适合春日随笔与温柔记录',
    tags: ['樱花', '春日', '柔美'],
    mode: 'paper',
    palette: {
      page: '#fefaf8',
      pageAlt: '#fce8ec',
      text: '#3d2a30',
      muted: '#9a7e84',
      accent: '#e8929e',
      accentSoft: 'rgba(232,146,158,0.18)',
      border: 'rgba(210,160,170,0.10)',
      shadow: 'rgba(180,140,150,0.08)',
      glow: 'rgba(250,215,220,0.28)',
    },
    surface: {
      grainAlpha: 0.016,
      vignetteAlpha: 0.024,
      washStrength: 0.20,
      innerFrameAlpha: 0.05,
      innerFrameInset: 28,
      titleAccentMix: 0.64,
      footerLineAlpha: 0.12,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 20px 44px rgba(180,140,150,0.08), 0 2px 14px rgba(255,248,250,0.40) inset',
    },
    components: {
      quoteFillAlpha: 0.038,
      quoteStrokeAlpha: 0.060,
      quoteBarAlpha: 0.66,
      quoteRadius: 16,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.50,
      highlightMarkerAlpha: 0.20,
      highlightDashAlpha: 0.56,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.88,
      bodyFontMode: 'wenkai',
      bodyFontWeight: 300,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
    },
    category: 'light',
    decor: { kind: 'sakuraPetal', opacity: 0.85, color: '#e8929e', scale: 1.1 },
    gradient: { enabled: true, color1: '#fce8ec', color2: '#fffbf5', angle: 135 },
  },

  // ── 35. abyssal-coral (深海荧光) ─────────────────────────────────────────
  {
    id: 'abyssal-coral',
    name: '深海荧光',
    mood: '深海暗渊荧光珊瑚幽玄',
    preset: '深海珊瑚',
    description: '深渊海军蓝底、荧光珊瑚粉渐变、发光珊瑚枝装饰，适合神秘题材与科幻内容',
    tags: ['深海', '荧光', '幽玄'],
    mode: 'obsidian',
    palette: {
      page: '#0a1628',
      pageAlt: '#0d1a30',
      text: '#c8dae8',
      muted: '#6b8aa0',
      accent: '#ff6b6b',
      accentSoft: 'rgba(255,107,107,0.16)',
      border: 'rgba(100,160,200,0.10)',
      shadow: 'rgba(4,10,24,0.55)',
      glow: 'rgba(255,107,107,0.10)',
    },
    surface: {
      grainAlpha: 0.024,
      vignetteAlpha: 0.080,
      washStrength: 0.22,
      innerFrameAlpha: 0.12,
      innerFrameInset: 24,
      titleAccentMix: 0.88,
      footerLineAlpha: 0.22,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 30px 62px rgba(4,10,24,0.55), 0 0 40px rgba(255,107,107,0.06), 0 2px 20px rgba(0,0,0,0.30) inset',
    },
    components: {
      quoteFillAlpha: 0.048,
      quoteStrokeAlpha: 0.090,
      quoteBarAlpha: 0.78,
      quoteRadius: 12,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.58,
      highlightMarkerAlpha: 0.38,
      highlightDashAlpha: 0.72,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.86,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.6, h2Scale: 1.7, h3Scale: 1.35,
        h1LineHeight: 1.18, h2LineHeight: 1.28, h3LineHeight: 1.38,
        h1FontWeight: 800, h2FontWeight: 700, h3FontWeight: 600,
        h1MarginTop: 26, h1MarginBottom: 14,
        h1Color: '#ff6b6b',
      },
      list: { bulletChar: '◆', bulletSizeRatio: 0.78, indentPerLevel: 28, itemGap: 8, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.6, h1LineHeight: 1.08, centered: true,
    },
    category: 'dark',
    decor: { kind: 'coralBranch', opacity: 0.85, color: '#ff6b6b', scale: 1.08 },
    gradient: { enabled: true, color1: '#0a1628', color2: '#ff6b6b', angle: 160 },
  },

  // ── 36. amethyst-geode (紫晶洞) ───────────────────────────────────────────
  {
    id: 'amethyst-geode',
    name: '紫晶洞',
    mood: '紫水晶晶洞神秘深邃',
    preset: '紫晶洞窟',
    description: '深紫黑底、紫水晶渐变、晶体棱面切角装饰，适合神秘学与奇幻文学',
    tags: ['水晶', '紫色', '奇幻'],
    mode: 'obsidian',
    palette: {
      page: '#1a0a2e',
      pageAlt: '#1f103a',
      text: '#d8cfe8',
      muted: '#8a7ea8',
      accent: '#9b6dff',
      accentSoft: 'rgba(155,109,255,0.16)',
      border: 'rgba(155,109,255,0.14)',
      shadow: 'rgba(12,4,24,0.55)',
      glow: 'rgba(155,109,255,0.12)',
    },
    surface: {
      grainAlpha: 0.030,
      vignetteAlpha: 0.076,
      washStrength: 0.24,
      innerFrameAlpha: 0.13,
      innerFrameInset: 26,
      titleAccentMix: 0.90,
      footerLineAlpha: 0.22,
      footerTextAlpha: 0.84,
      previewShadow:
        '0 28px 60px rgba(12,4,24,0.55), 0 0 50px rgba(155,109,255,0.08), 0 2px 18px rgba(0,0,0,0.28) inset',
    },
    components: {
      quoteFillAlpha: 0.044,
      quoteStrokeAlpha: 0.086,
      quoteBarAlpha: 0.76,
      quoteRadius: 8,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.60,
      highlightMarkerAlpha: 0.36,
      highlightDashAlpha: 0.74,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.88,
      bodyFontMode: 'yahei',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.5, h2Scale: 1.7, h3Scale: 1.35,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 26, h1MarginBottom: 14,
        h1Color: '#9b6dff',
      },
      list: { bulletChar: '◇', bulletSizeRatio: 0.78, indentPerLevel: 28, itemGap: 8, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.4, h1LineHeight: 1.08, centered: true,
    },
    category: 'dark',
    decor: { kind: 'crystalFacet', opacity: 0.88, color: '#9b6dff', scale: 1.08 },
    gradient: { enabled: true, color1: '#1a0a2e', color2: '#9b6dff', angle: 45 },
  },

  // ── 37. charcoal-sketch (炭笔素描) ───────────────────────────────────────
  // 设计升级：从普通暖灰 → 真正画室新闻纸质感，
  // 新闻纸暖灰底、柳炭浓黑、石墨银灰高光、揉擦 blur 般的柔焦层
  {
    id: 'charcoal-sketch',
    name: '炭笔素描',
    mood: '画室新闻纸柳炭石墨揉擦银灰',
    preset: '柳炭画室',
    description: '新闻纸暖灰底、柳炭浓黑正文、石墨银灰高光、揉擦 blur 般的柔焦空气感，适合美术草稿与创作构思',
    tags: ['柳炭', '新闻纸', '画室'],
    mode: 'paper',
    palette: {
      page: '#f3efe8',          // 新闻纸灰白 — 真正素描本的微灰底色
      pageAlt: '#e6e0d6',       // 旧新闻纸 — 氧化后微黄灰色
      text: '#23201d',          // 柳炭浓黑 — 炭笔最深处的暖黑
      muted: '#6e6a64',         // 石墨灰 — 铅笔中调的银灰色
      accent: '#4a4640',        // 压缩炭条 — 比柳炭更硬更黑的 accent
      accentSoft: 'rgba(74,70,64,0.12)',
      border: 'rgba(80,75,68,0.10)',
      shadow: 'rgba(50,45,40,0.08)',
      glow: 'rgba(170,163,153,0.14)',
    },
    surface: {
      grainAlpha: 0.052,        // 新闻纸纤维 — 比普通纸更明显的粗纤维
      vignetteAlpha: 0.048,
      washStrength: 0.16,
      innerFrameAlpha: 0.09,
      innerFrameInset: 24,
      titleAccentMix: 0.64,
      footerLineAlpha: 0.14,
      footerTextAlpha: 0.86,
      previewShadow:
        '0 20px 42px rgba(50,45,40,0.08), 0 2px 12px rgba(243,239,232,0.36) inset',
    },
    components: {
      quoteFillAlpha: 0.034,
      quoteStrokeAlpha: 0.060,
      quoteBarAlpha: 0.66,
      quoteRadius: 6,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.52,
      highlightMarkerAlpha: 0.20,
      highlightDashAlpha: 0.60,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.84,
      bodyFontMode: 'fangsong',
      bodyFontWeight: 400,
      subheadingStyle: 'large',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.2, h2Scale: 1.55, h3Scale: 1.25,
        h1LineHeight: 1.2, h2LineHeight: 1.3, h3LineHeight: 1.4,
        h1FontWeight: 700, h2FontWeight: 600, h3FontWeight: 500,
        h1MarginTop: 22, h1MarginBottom: 12,
      },
      list: { bulletChar: '—', bulletSizeRatio: 0.76, indentPerLevel: 28, itemGap: 7, orderedMarkerBox: true },
    },
    coverHeading: {
      h1Scale: 4.0, h1LineHeight: 1.12, centered: false,
    },
    category: 'professional',
    decor: { kind: 'sketchHatch', opacity: 0.82, color: '#4a4640', scale: 1.08 },
    gradient: { enabled: true, color1: '#f3efe8', color2: '#e0d8cc', angle: 135 },
  },

  // ── 38. matcha-zen (抹茶禅意) ───────────────────────────────────────────
  {
    id: 'matcha-zen',
    name: '抹茶禅意',
    mood: '日本茶道抹茶泡沫禅静',
    preset: '抹茶禅',
    description: '陶胚奶油底、抹茶绿渐变、茶筅涟漪圈饰，适合茶道笔记与禅意内容',
    tags: ['抹茶', '禅意', '和风'],
    mode: 'sage',
    palette: {
      page: '#faf7f0',
      pageAlt: '#eef0e0',
      text: '#2d3320',
      muted: '#7a8065',
      accent: '#8ba87a',
      accentSoft: 'rgba(139,168,122,0.16)',
      border: 'rgba(120,150,100,0.10)',
      shadow: 'rgba(90,110,70,0.07)',
      glow: 'rgba(200,225,185,0.22)',
    },
    surface: {
      grainAlpha: 0.028,
      vignetteAlpha: 0.030,
      washStrength: 0.22,
      innerFrameAlpha: 0.06,
      innerFrameInset: 28,
      titleAccentMix: 0.72,
      footerLineAlpha: 0.14,
      footerTextAlpha: 0.86,
      previewShadow:
        '0 20px 44px rgba(90,110,70,0.07), 0 2px 14px rgba(250,247,240,0.40) inset',
    },
    components: {
      quoteFillAlpha: 0.040,
      quoteStrokeAlpha: 0.064,
      quoteBarAlpha: 0.66,
      quoteRadius: 14,
      quoteTreatment: 'paper',
      highlightTreatment: 'softUnderline',
      highlightUnderlineAlpha: 0.52,
      highlightMarkerAlpha: 0.20,
      highlightDashAlpha: 0.60,
    },
    editor: {
      bodySize: 29,
      lineHeight: 1.88,
      bodyFontMode: 'wenkai',
      bodyFontWeight: 400,
      subheadingStyle: 'accent',
      highlightStyle: 'underline',
      heading: {
        h1Scale: 3.3, h2Scale: 1.6, h3Scale: 1.3,
        h1LineHeight: 1.3, h2LineHeight: 1.4, h3LineHeight: 1.5,
        h1FontWeight: 500, h2FontWeight: 400, h3FontWeight: 400,
        h1MarginTop: 20, h1MarginBottom: 10,
      },
      list: { bulletChar: '◦', bulletSizeRatio: 0.78, indentPerLevel: 28, itemGap: 8 },
    },
    coverHeading: {
      h1Scale: 4.0, h1LineHeight: 1.15, centered: true,
    },
    category: 'artistic',
    decor: { kind: 'matchaRing', opacity: 0.84, color: '#8ba87a', scale: 1.06 },
    gradient: { enabled: true, color1: '#faf7f0', color2: '#8ba87a', angle: 135 },
  },
]

/** 未指定时使用的默认主题 ID。 */
export const DEFAULT_THEME_ID = 'moss-paper'

/** 按 ID 查找主题。回退到第一个主题。 */
export function getTheme(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}