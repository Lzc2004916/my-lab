# Markdown Card — 项目架构文档

> 维护者快速参考手册。记录每个文件的职责、核心逻辑与模块间依赖关系。

---

## 目录

1. [项目概述](#1-项目概述)
2. [配置文件](#2-配置文件)
3. [入口与启动](#3-入口与启动)
4. [核心模块 — `src/card/`](#4-核心模块--srccard)
5. [组件系统 — `src/components/`](#5-组件系统--srccomponents)
6. [Markdown 组件 — `src/components/markdown/`](#6-markdown-组件--srccomponentsmarkdown)
7. [Composables — `src/composables/`](#7-composables--srccomposables)
8. [状态管理 — `src/stores/`](#8-状态管理--srcstores)
9. [插件 — `src/plugins/`](#9-插件--srcplugins)
10. [视图与路由 — `src/views/` + `src/router/` + `src/layouts/`](#10-视图与路由)
11. [工具集 — `src/utils/`](#11-工具集--srcutils)
12. [样式系统 — `src/themes/` + `src/style.css`](#12-样式系统)
13. [Electron 后端](#13-electron-后端)
14. [附录 A：新增文件快速参考](#附录-a新增文件快速参考)
15. [附录 B：关键数据流](#附录-b关键数据流)

---

## 1. 项目概述

| 属性 | 值 |
|------|-----|
| **名称** | Rich Text Editor / Markdown Card |
| **技术栈** | Electron + Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + daisyUI |
| **编辑器** | CodeMirror 6（Markdown 编辑） |
| **预览引擎** | Canvas 2D（卡片渲染）+ Vue DOM（内联 Markdown 渲染） |
| **Markdown 解析** | 自定义状态机解析器 `parseInputBlocks()` + `parseInlineMarkdown()` |
| **代码高亮** | Prism.js |
| **主题系统** | 31 套预设卡片主题，支持 JSON 导入/导出，动态注册 |
| **导出格式** | PNG / JPG（单张或批量）、PDF（多页文档） |

### 双渲染路径

```
Markdown 源码
    ├── Canvas 路径（导出用，固定 720×960）
    │   layout.ts parseInputBlocks → Block[]
    │   → renderCard() → <canvas> → 导出 PNG/JPG/PDF
    │
    └── DOM 路径（内联预览用，响应式）
        layout.ts parseInputBlocks → Block[]
        → MdRenderer → Vue 组件树 → DOM
```

两个路径共享同一套解析器和主题定义，渲染目标不同。

---

## 2. 配置文件

### `package.json`

**依赖关键说明：**

| 包 | 用途 |
|----|------|
| `markdown-it` + 插件 (`attrs`, `container`, `emoji`) | Markdown → HTML 解析（备用路径） |
| `@codemirror/*` | 代码编辑器内核 |
| `prismjs` | 代码语法高亮 |
| `vue` / `vue-router` / `pinia` | 前端框架 |
| `tailwindcss` + `daisyui` | UI 样式系统 |
| `html2canvas` + `jspdf` | 导出功能 |
| `vite-plugin-electron` | Electron + Vite 集成 |

**构建产物：** `dist/`（前端）、`dist-electron/`（主进程 + preload）、`release/`（electron-builder 安装包）

### `vite.config.ts`

- `@vitejs/plugin-vue` — Vue SFC 编译
- `vite-plugin-electron` — 双入口构建：`electron/main.ts`（主进程）+ `electron/preload.ts`（预加载脚本）
- `vite-plugin-electron-renderer` — 渲染进程 Electron API 支持
- `resolve.alias['@']` → `src/` 目录

### `tsconfig.json`

- `target: ES2020`、`module: ESNext`、`strict: true`
- `noUnusedLocals: true`、`noUnusedParameters: true`
- `paths["@/*"]` → `src/*`

### `tailwind.config.js`

- daisyUI 插件，`light`（浅色）和 `dark`（深色）两个内置主题，使用 `oklch()` 色域
- 自定义字体：`sans`（Inter + Noto Sans SC）、`mono`（JetBrains Mono 等）
- daisyUI 的 `oklch()` 配色控制**应用外壳 UI**（导航栏、按钮、下拉框），与卡片主题 CSS 变量**完全独立**

### `env.d.ts` + `src/vite-env.d.ts`

- `env.d.ts`：Vite 客户端类型声明
- `vite-env.d.ts`：`window.electronAPI` 类型声明（Electron IPC 桥接接口）

---

## 3. 入口与启动

### `index.html`

单 `<div id="app">` 挂载点，加载 `src/main.ts`。

### `src/main.ts` (~15行)

```
createApp(App) → use(Pinia) → mount('#app')
```

路由 (`src/router/index.ts`) 已定义但当前未注册——App 是单页面 Electron 应用，`App.vue` 直接作为根组件。

---

## 4. 核心模块 — `src/card/`

> 卡片渲染引擎。负责解析 Markdown → 排版分页 → Canvas 绘制 → 导出。

### `src/card/types.ts` (~435行) — 类型定义与渲染常量

所有类型定义和渲染常量的单一数据源。

**核心类型：**

| 导出 | 说明 |
|------|------|
| `ThemeDefinition` | 主题完整定义：`id`, `name`, `mode`, `palette`(9色), `surface`(9参数), `components`(引用/高亮参数), `editor`(排版参数), `decor?`, `gradient?` |
| `ThemePalette` | `page`, `pageAlt`, `text`, `muted`, `accent`, `accentSoft`, `border`, `shadow`, `glow` |
| `Block` | 区分联合类型：`TextBlock`（body/quote/subheading/divider）| `CodeBlock` | `TableDisplayBlock` | `ColumnContainerBlock` |
| `InlineToken` | `{text, bold, italic, mark, underline}` |
| `CardPage` | `{id, kind: 'cover'|'body', title, blocks: Block[]}` |

**渲染常量：** `PAGE_WIDTH=720`, `PAGE_HEIGHT=960`, `CONTENT_WIDTH=608`, `CANVAS_SCALE=2`（2x Retina）

**正文排版：** `HEADING_SIZE_RATIOS`(H1-H6: 2.20/1.65/1.35/1.15/1.04/0.98)，6 种 `BodyFontMode`，11 种 `ThemeMode`，10 种 `DecorKind`

### `src/card/themes.ts` (~1744行) — 31套内置主题

每套包含完整的 `ThemeDefinition`。按类别分布：

| 类别 | 主题 ID |
|------|--------|
| Light | `moss-paper`, `lemon-note`, `sage-dawn`, `apple-note`, `notebook-paper`, `alibaba-orange`, `botanical-field` |
| Professional | `warm-editor`, `swiss-modern`, `business-brief`, `bytestyle`, `japanese-mag`, `brutalist-raw` |
| Artistic | `peach-cloud`, `ink-wash`, `glass-morph`, `dreamy-gradient`, `instagram`, `pop-art`, `chinese-trad` |
| Dark | `forest-archive`, `deep-obsidian`, `cyber-neon`, `dark-mode`, `dark-tech`, `midnight-ink` |
| Vintage | `vintage-typewriter`, `kraft-paper` |
| Luxe | `gold-luxe`, `art-deco` |

导出 `getTheme(id)` 查找函数和 `DEFAULT_THEME_ID = 'moss-paper'`。

### `src/card/theme-registry.ts` (~83行) — 动态主题注册表

基于 `Map<string, ThemeDefinition>` 的运行时注册表：
- `registerTheme(theme)` / `unregisterTheme(id)` — 增删
- `getTheme(id)` — 查询（回退到 `moss-paper`）
- `onRegistryChange(fn)` — 订阅模式，返回取消订阅函数
- 模块加载时自动从 `THEMES` 初始化

### `src/card/theme-config.ts` (~337行) — JSON 主题配置

- `validateThemeConfig(raw)` → `ValidationResult`：校验 palette（hex/rgba）、surface（0-1 alpha）、components、editor
- `loadThemeFromJSON(jsonStr)` → 解析+验证
- `themeToJSON(theme)` → 序列化
- `loadThemesFromJSON(jsonStr)` → 批量加载

### `src/card/design-tokens.ts` (~119行) — 设计令牌

从 `ThemeDefinition` 提取 `CardDesignTokens`（bgColor, bodyColor, bodyFontWeight, bodyFontSize, bodyLineHeight, gradientEnabled/Color1/Color2/Angle），映射为 CSS 自定义属性（`TOKEN_CSS_VAR_MAP`），支持 `applyTokensToElement()` 写入 DOM。

### `src/card/font-config.ts` (~148行) — Web 字体配置

- `WEB_FONT_MANIFEST`：8 种 Web 字体的 CDN URL + fallback 栈
- `getRequiredWebFonts(theme)` → 按主题 bodyFontMode 解析所需字体
- `getFontDisplayStrategy(category)` → serif→block, monospace→optional, 其他→swap

### `src/card/color-utils.ts` (~65行) — 颜色工具

- `hexToRgba(hex, alpha)` → rgba 字符串
- `hexToRgb(hex)` → [r, g, b]
- `mixHexColors(from, to, ratio)` → 线性插值
- `gradientAngleToPoints(angleDeg, w, h)` → Canvas linearGradient 端点

### `src/card/layout.ts` (~811行) — 解析器 + 分页引擎

**Block 解析器 `parseInputBlocks(raw)`：** 状态机逐行扫描 markdown 源码：

1. 围栏代码块 `` ```lang ... ``` `` → `CodeBlock`
2. 表格 `|...|...|` → `TableDisplayBlock`（含表头、对齐、行数据）
3. 分栏容器 `:::left` / `:::right` … `:::` → `ColumnContainerBlock`（递归解析）
4. 标题 `# Heading` → `subheading` TextBlock（含 headingLevel 1-6）
5. 引用 `> quote` → `quote` TextBlock
6. 分割线 `---` → `divider` TextBlock
7. 正文段落 → `body` TextBlock

**分页引擎 `layoutPages(opts)`：**
```
parseInputBlocks → 预分割长段落(>180字符) → 逐页累积
  ├── 正文：测量高度 → 若溢出：句子级分割 → 行级填充 → carry-over
  ├── 代码/表格/分栏：原子高度估算 → 不分割
  └── 最大 60 页安全限制 + 空内容兜底
```

### `src/card/measure.ts` (~431行) — 文本测量与排版

| 导出 | 说明 |
|------|------|
| `parseInlineMarkdown(text)` | 正则解析 `**bold**`, `*italic*`, `==highlight==`, `^underline^` → `InlineToken[]` |
| `wrapInlineTokensByWidth()` | 宽度约束自动换行（处理行首标点避让） |
| `measureParagraphBlock()` | 段落高度测量（含引用块 padding、标题字号缩放） |
| `getGapBetweenBlocks()` | 块间距：标题前×1.20（约45px）、标题后×0.85（约32px）、引用±×1.08+4、正文×1.00 |
| `getPosterMetrics()` | 页面布局度量（body 区域 Y 范围、字号、行高、段间距） |

### `src/card/renderer.ts` (~1254行) — Canvas 渲染管线

**`renderCard(opts)` 渲染顺序：**

1. Canvas 创建（720×960 逻辑像素，2x 缩放）
2. **背景渐变** — 按 `theme.mode` 生成对应渐变
3. **形状裁剪** — 圆角（36px）或直角
4. **气氛层** — 放射光晕、网格、扫描线、金箔、极光
5. **纹理** — 颗粒（760-2200颗）+ 纸纤维
6. **渐变叠加** — 可选双色渐变（28%透明度）
7. **正文** — 按 `block.kind` 分发到子渲染器
8. **页脚** — 分割线 + 左/右文本

**高亮系统：** `resolveHighlightTreatment()` 将 `highlightStyle` + 主题配置映射到 6 种视觉处理：`softUnderline`（圆角下划线）、`editorMark`（荧光色块）、`warmSwipe`（暖色涂抹）、`darkGlow`（暗色发光）、`botanicalStroke`（贝塞尔曲线下划线）、`swissRule`（虚线规则）、`boldAccent`（粗体+强调色）

### `src/card/engine.ts` (~101行) — 渲染编排层

- `EngineOptions` — 统一入参接口
- `renderAllPages(opts)` → `{pages, canvases}`：`layoutPages() → renderCard()` 管道
- `renderAllPagesAsync(opts)` — 异步包装
- `canvasToPreviewUrl()` / `canvasToExportUrl()` → data URL

### `src/card/code-renderer.ts` (~332行) — 代码块渲染

- `tokenizeCode(code, language)` → Prism 词法分析（每行一个 token 数组）
- `wrapTokenLine()` — 三情况换行：适配上 → 超宽逐字符拆分 → 不配换行
- `drawCodeBlock()` → 背景 + 语言标签 + 逐行逐 token 着色

### `src/card/table-renderer.ts` (~262行) — 表格渲染

- `measureTableBlock()` — 列宽自动分配（自然宽度→按比例分配/缩放）+ 行高（含 inline 换行测量）
- `drawTableBlock()` — 表头背景 + 交替行 + 文字对齐 + 框线

### `src/card/decor-renderer.ts` (~523行) — 装饰元素

9 种装饰类型的 Canvas 绘制函数：`cornerBracket`（四角支架线）、`topRule`（双线）、`geometricPattern`（菱形网格）、`circuitTrace`（电路走线）、`watermark`（印章）、`goldFoil`（金箔颗粒）、`leafMotif`（植物叶片）、`auroraGlow`（极光渐变）、`fanBurst`（Art Deco 放射扇）。总调度：`drawDecor(ctx, theme, titleEndY?)`。

### `src/card/index.ts` (~118行) — Barrel 导出

全部类型、常量、工具函数、渲染函数、主题注册表、JSON 配置、设计令牌的统一出口。

---

## 5. 组件系统 — `src/components/`

### `App.vue` (~681行) — 根组件

Electron 单页面应用入口。

**模板结构：**
```
<ThemeProvider>
  Navbar（标题 + 编辑器主题 + 导出下拉 + 窗口控制）
  Control Bar（字号滑块 + Footer开关 + 字体/渐变选择 + 主题面板）
  DocumentTabs
  Body（左右分栏 → 编辑器 | 拖拽条 | Canvas预览）
  Status Bar（字数/行数/页码/主题名）
  DraftRecoveryModal / Close Dialog
```

**核心逻辑：**
- 文档管理：Pinia `useDocumentsStore`，`source` 通过 computed 双向绑定 `store.activeDocument.content`
- 草稿恢复：`useDrafts()` 管理 localStorage 持久化
- 主题同步：`cardTheme` 变化时自动同步 `bodyFontMode` + `gradientConfig`
- 拖拽分栏：`split` 百分比（20-80%）
- 导出：批量 PNG/JPG + 多页 PDF
- 窗口控制：最小化/最大化/关闭（`window.electronAPI`）

### `ThemeProvider.vue` (~168行) — 主题上下文

**Provide/Inject 模式。** `THEME_CONTEXT_KEY` → `{ theme, themeId, setTheme, themes, isTransitioning }`

**`applyThemeToDOM(theme)`：** 在 `document.documentElement` 上写入 ~35 个 CSS 自定义属性（调色板、表面、排版、标题缩放、代码块、引用块、表格、分割线、高亮、列表、链接色）。

**主题切换：** 400ms `isTransitioning` 标记 → `.theme-transitioning` CSS class → 0.35s 颜色过渡。

### `CardPreview.vue` (~577行) — Canvas 卡片预览

**两种模式：** 单页（1个 canvas）| 滚动（多个 canvas 垂直堆叠）

**响应式缩放：** ResizeObserver 监测父容器 → 计算 `fitScale` → 限制 `[260/PAGE_WIDTH, previewScale]`

**渲染流程：** `watch(source, themeId, ...)` → debounce 150ms → `renderAllPagesAsync()` → `nextTick` → `ctx.drawImage()` 复制

**暴露：** `getActiveCanvas()`, `getAllCanvases()`, `getPageCount()`, `forceRender()`

### `ThemeSelector.vue` — 主题画廊

水平滚动卡片列表，5 个分类筛选（全部/浅色/深色/艺术/专业）。每个卡片用 `theme.palette` 内联样式渲染预览。自定义滚动条支持拖拽和键盘导航。

### 编辑器组件

| 组件 | 说明 |
|------|------|
| `MarkdownEditor.vue` | CodeMirror 6 封装。支持 `one-dark`/`light` 主题，暴露 `insertAtCursor`, `wrapSelectionOrInsert`, `focus`, `undo` 等方法 |
| `EditorToolbar.vue` | 12 个格式化按钮（粗体/斜体/标题/高亮/下划线/链接/图片/代码/表格/分割线/分栏）+ 撤回。高亮和标题是 split button（主按钮插入 + 下拉切换风格） |

### 其他 UI 组件

| 组件 | 说明 |
|------|------|
| `DocumentTabs.vue` | 多文档标签页管理 |
| `DraftRecoveryModal.vue` | 草稿恢复弹窗 |
| `FontPicker.vue` | 6 种中文字体选择器 |
| `GradientPicker.vue` | 渐变配置器（双色 + 角度 + 预览条） |
| `LoadingSpinner.vue` | spinner / progress 双模式加载指示器 |
| `SettingsDrawer.vue` | 设置抽屉面板 |
| `StatsCard.vue` | 统计卡片 |

---

## 6. Markdown 组件 — `src/components/markdown/`

> 主题驱动的 DOM 渲染组件系统（与 Canvas 路径并行）。从 `useMarkdownTheme()` 注入主题上下文。

### `MdRenderer.vue` — 主入口

**Props：** `source` | `blocks`, `highlightStyle`, `showLineNumbers`, `compact`

**逻辑：** `parseInputBlocks(source)` → `Block[]` → `v-if` 按 `block.kind` 分发到对应子组件。

### `MdHeading.vue` — 标题

动态 `<h1>` ~ `<h6>` 标签。字号 = `bodySize × HEADING_SIZE_RATIOS[level]`。边距随 heading level 缩放。

### `MdParagraph.vue` — 正文段落

段落组件，委托 `InlineRenderer` 渲染内联格式。

### `MdQuote.vue` — 引用块

Flex 布局：左侧 accent bar（`var(--card-quote-bar-color)`）+ 右侧内容。三种 treatment class 区分视觉风格。

### `MdDivider.vue` — 分割线

`<hr>` 元素，颜色 `var(--card-divider-color)`。

### `MdCodeBlock.vue` — 代码块

Prism.js 语法高亮 + 行号（可选）+ 语言标签 + 复制按钮（clipboard API + 2秒反馈动画）。

### `MdTable.vue` — 表格

`overflow-x: auto` 响应式容器。表头着色、单元格对齐（left/center/right）。

### `MdColumns.vue` — 双栏分栏

CSS Grid `1fr 1fr`。左右各嵌套 `MdRenderer`。响应式：`max-width: 640px` 时自动堆叠。

### `InlineRenderer.ts` — 内联文本渲染器

Vue `h()` render function。`parseInlineMarkdown(raw)` → `InlineToken[]` → 逐 token 渲染 `<span>`：

- `bold` → fontWeight: 600
- `italic` → fontStyle: italic
- `underline` → textDecoration
- `mark` → 4 种高亮风格（underline/marker/border/highlight），使用对应 CSS 变量

---

## 7. Composables — `src/composables/`

### `useMarkdownTheme.ts` (~89行) — 主题消费

`inject(THEME_CONTEXT_KEY)` → `MarkdownThemeTokens`：theme, pageBg, textColor, accentColor, bodySize, lineHeight, quoteRadius, headingSize(level), isTransitioning 等 ComputedRef。

### `themeContext.ts` (~19行) — 共享注入类型

`ThemeContext` 接口 + `THEME_CONTEXT_KEY` InjectionKey。由 `ThemeProvider.vue` 和 `useMarkdownTheme.ts` 共同导入。

### `useSettings.ts` (~124行) — 单例设置

模块级 `ref`（所有调用者共享）。12 个设置项全部自动持久化到 `localStorage`（key 前缀 `md2card:`）。

### `useMarkdown.ts` (~21行)

简化的 Markdown 状态：接收 `source: Ref<string>`，返回 `{ source, currentPage }`。

### `useExport.ts` — 导出功能

`exportPNG(canvas)` / `exportJPG(canvas)`（单张）、`exportBatchPNG/JPG(canvases)`（批量+文件夹选择器）、`exportMultiPDF(canvases, {w,h})`（jsPDF 多页）。`isExporting` / `progress` 状态跟踪。

### `useDrafts.ts` — 草稿自动保存

Watch Pinia store 的 `documents`（deep watch + 1s 防抖）。`hasDrafts()`, `restore()`, `discard()`, `saveSettings()`。

### `useOnlineStatus.ts` — 网络状态

浏览器 online/offline 事件监听。返回 `{ isOnline: Ref<boolean> }`。

---

## 8. 状态管理 — `src/stores/`

### `documents.ts` (~259行) — Pinia 文档存储

**State：** `documents: Document[]`, `activeId: string`
**Getters：** `activeDocument`, `documentCount`
**Actions：** `init()`（创建欢迎文档）、`addDocument(content?)`、`removeDocument(id)`（至少保留一个）、`setActive(id)`、`updateContent(id, content)`（更新内容+自动提取标题和标签）

**Frontmatter 解析：** `parseFrontmatter(content)` — YAML 格式的 `title`, `description`, `date`, `tags`, `image`

### `app.ts` (~9行) — 轻量应用状态

`{ title: Ref<string> }`，当前只含标题。

---

## 9. 插件 — `src/plugins/`

### `md-parser.ts` (~1437行) — markdown-it 实例（备用路径）

配置完整的 markdown-it 实例，包含自定义插件：
- `==highlight==` 内联规则 → `<mark>`
- `^underline^` 内联规则 → `<u>`
- `:::left` / `:::right` / `:::center` 容器
- 图片尺寸语法 `![alt|WxH](url)`

**智能分页 `autoSplitPages()`：** 基于 DOM 测量的自动分页——隐藏容器+getBoundingClientRect 累加高度→语义边界检测→段落级 DOM 分割→后验证递归再分割。

**注意：** 当前未被任何文件引用，为备用解析路径。

---

## 10. 视图与路由

### `views/HomeView.vue` — 首页

Hero 区域 + 功能特性网格 + "Open Editor" 按钮。

### `views/EditorView.vue` — 独立编辑器页面

与 `App.vue` 类似的双面板布局，不含 Electron 窗口控制。用于 Web 版路由访问。

### `router/index.ts` — 路由定义

Hash 模式：`DefaultLayout` → `HomeView(/)` + `EditorView(/editor)`。当前未在 `main.ts` 中注册。

### `layouts/DefaultLayout.vue` — 默认布局

导航栏 + `<router-view>` + 页脚。

---

## 11. 工具集 — `src/utils/`

### `font-loader.ts` (~151行) — Web 字体加载器

基于 Font Face API：
- `loadFont(family, url, options)` → 加载单个字体（去重+浏览器缓存检测）
- `preloadCriticalFonts()` → 预加载 Inter（400+600 weight）
- `isFontAvailable(family)`, `waitForFonts()`, `loadFontEntry(entry)`, `clearFontCache()`

### `card-sizes.ts` + `index.ts`

卡片尺寸预设配置和工具模块 barrel export。

---

## 12. 样式系统

### `src/themes/variables.css` (~88行) — CSS 自定义属性

全部设置在 `:root`，默认值对应 `moss-paper` 主题。包含：
- 调色板（9个）、表面（3个）、排版（5个）、过渡（2个）
- Markdown 组件变量（~25个）：标题缩放、代码块、引用块、表格、分割线、高亮、列表、分栏、图片、链接
- `.theme-transitioning` / `.theme-aware` 过渡类

### `src/style.css` — 全局样式

导入 `variables.css` + Tailwind 指令 + 自定义滚动条 + Electron 拖拽区域 + 预览背景点阵。

---

## 13. Electron 后端

### `electron/main.ts`

主进程入口。BrowserWindow 创建、IPC 处理、窗口状态管理。

### `electron/preload.ts`

预加载脚本。通过 `contextBridge` 暴露 `electronAPI`：窗口状态查询、最大化/最小化/关闭控制。

---

## 附录 A：新增文件快速参考

### 本次迭代新建（Markdown 组件系统）

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/components/markdown/MdRenderer.vue` | ~150 | 主入口：解析+分发 |
| `src/components/markdown/MdHeading.vue` | ~45 | 动态 H1-H6 |
| `src/components/markdown/MdParagraph.vue` | ~45 | 正文段落 |
| `src/components/markdown/MdQuote.vue` | ~70 | 引用块+accent bar |
| `src/components/markdown/MdDivider.vue` | ~25 | 分割线 |
| `src/components/markdown/MdCodeBlock.vue` | ~115 | 代码块+高亮+复制 |
| `src/components/markdown/MdTable.vue` | ~80 | 表格 |
| `src/components/markdown/MdColumns.vue` | ~80 | 双栏分栏 |
| `src/components/markdown/InlineRenderer.ts` | ~85 | 内联文本渲染 |
| `src/components/markdown/index.ts` | ~10 | Barrel export |
| `src/composables/useMarkdownTheme.ts` | ~89 | 主题 composable |
| `src/composables/themeContext.ts` | ~19 | 共享注入类型 |

### 本次迭代修改

| 文件 | 变更 |
|------|------|
| `src/card/layout.ts` | `parseInputBlocks` 改为导出函数 |
| `src/card/index.ts` | Barrel 导出 `parseInputBlocks` |
| `src/card/measure.ts` | 标题间距调整：1.62→1.20, 1.30→0.85 |
| `src/components/ThemeProvider.vue` | 激活：导入共享类型、扩展 CSS 变量写入、暴露 `isTransitioning` |
| `src/themes/variables.css` | 新增 ~25 个 Markdown 组件 CSS 变量 |
| `src/App.vue` | 包裹 `<ThemeProvider>` |

## 附录 B：关键数据流

### 主题切换

```
ThemeSelector click → emit('update:modelValue', themeId)
  → App.vue cardTheme.value = themeId
  → ThemeProvider watch(themeId) → setTheme(id)
    → applyThemeToDOM(theme) → :root CSS 变量即时更新
    → emit('theme-change')
  → CardPreview watch(themeId) → renderAllPagesAsync() → canvas 重绘
  → MdRenderer 通过 useMarkdownTheme() → inject() → 自动响应
```

### 编辑器输入 → 预览

```
CodeMirror input → @update:modelValue → source.value
  → watch(source) → debounce 150ms → renderAllPagesAsync()
  → canvases[] → nextTick → ctx.drawImage() → Canvas 更新
```

### 文档管理

```
DocumentTabs click → store.setActive(id)
  → activeDocument computed → source computed
  → MarkdownEditor v-model + CardPreview watch(source) 同步更新

Editor input → store.updateContent(id, content)
  → extractTitle() + extractTags() 自动提取元数据
  → watch(documents) → useDrafts.saveSettings() 防抖持久化
```
