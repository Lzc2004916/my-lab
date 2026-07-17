# Markdown 内容搜索功能

## 概述

通过 `Ctrl+F`（Windows）或 `Cmd+F`（Mac）快捷键触发全局搜索弹窗，在 Markdown 编辑器中查找文本内容。搜索支持「仅文本内容」模式（忽略 Markdown 语法标记）和「原始文本」模式。

## 使用方式

| 操作 | 快捷键 / 方式 |
|------|-------------|
| 打开搜索弹窗 | `Ctrl+F` / `Cmd+F` |
| 搜索（实时） | 输入关键词，150ms 防抖后自动搜索 |
| 下一个匹配 | `Enter` 或点击「下一个」按钮 |
| 上一个匹配 | `Shift+Enter` 或点击「上一个」按钮 |
| 关闭搜索 | `Escape` 或点击关闭按钮 / 点击遮罩 |

### 搜索选项

- **仅文本内容**（默认开启）：忽略 Markdown 语法标记（`#`、`**`、`[]()`、代码块围栏等），仅搜索实际文本内容。切换按钮标签为 `Ab 文本`。
- **区分大小写**（默认关闭）：切换按钮标签为 `Aa`。

## 架构说明

### 文件结构

```
src/
├── composables/
│   └── useSearch.ts                      # 搜索核心逻辑
│   └── __tests__/
│       └── useSearch.test.ts             # 搜索逻辑单元测试
├── components/
│   ├── SearchDialog.vue                  # 搜索弹窗 UI 组件
│   ├── __tests__/
│   │   └── SearchDialog.test.ts          # 弹窗组件测试
│   └── editor/
│       ├── MarkdownEditor.vue            # 编辑器（集成搜索装饰）
│       └── search-decorations.ts         # CodeMirror 搜索高亮装饰层
└── App.vue                              # 主组件（集成 Ctrl+F + 搜索状态）
```

### 数据流

```
Ctrl+F → showSearchDialog = true → SearchDialog visible
用户输入 → emit('search', query, options)
  → useSearch.search() 在源文本中搜索
  → matches[] + activeIndex 更新
  → syncSearchHighlights() → CodeMirror 装饰层高亮匹配
  → scrollToActiveMatch() → 编辑器滚动到当前匹配
用户按 Enter → emit('next')
  → useSearch.next() 循环到下一个匹配
  → 更新装饰层 + 滚动
```

### 核心模块

#### `useSearch` composable

- `search(query, source, options)` — 在源文本中搜索关键词
- `next()` / `prev()` — 循环遍历匹配项
- `clear()` — 清除搜索状态
- 支持 `contentOnly`（忽略语法）和 `caseSensitive`（大小写敏感）选项
- 对源文本缓存内容视图构建结果，避免重复解析

#### `buildContentView(source)` 

将 Markdown 源文本转换为"内容视图"：使用布尔 `mask[]` 数组标记所有 Markdown 语法位置，将其替换为等长空格。这使得内容视图与源文本保持相同的字符长度，便于位置映射。

处理的语法类型：
- 标题前缀 `#{1,6} `
- 粗体 `**text**` / 斜体 `*text*` / 删除线 `~~text~~`
- 高亮 `==text==` / 下划线 `^text^`
- 行内代码 `` `code` ``
- 链接 `[text](url)` / 图片 `![alt](url)` — 保留链接文本
- 代码块（``` 围栏）
- 引用前缀 `> ` / 列表标记 `- ` `1. `
- HTML 标签

#### `search-decorations.ts`

CodeMirror 6 `StateField` 扩展，将搜索匹配项高亮为：
- `.cm-search-match` — 所有匹配项（黄色半透明背景）
- `.cm-search-match-active` — 当前激活匹配项（橙色背景 + 边框）

使用 CodeMirror `Compartment` 实现运行时可替换，无需重建编辑器状态。

## 使用限制

1. **仅搜索编辑器（源文本）**：搜索在 CodeMirror 编辑器（Markdown 源文本）中进行，而非 canvas 渲染的卡片预览。这是由卡片预览基于 Canvas 2D 渲染的技术特性决定的 — Canvas 中无法直接搜索文本内容。当匹配在源文本中定位时，卡片预览会同步显示对应内容。

2. **内容视图的语法覆盖**：`buildContentView` 处理了常见 Markdown 语法，但以下场景可能存在局限：
   - 自定义/非标准 Markdown 扩展语法
   - 嵌套语法（如 `**bold `code` text**`）
   - 表格内容（表格行被视为纯文本处理）
   - 列布局（column container 内部）
   如果发现搜索在特定语法结构中遗漏或误匹配，请在 `buildContentView` 中添加对应的语法屏蔽规则。

3. **性能**：
   - 大篇幅文档（10万+ 字符）的内容视图构建在首次搜索时触发，后续搜索（相同源文本）使用缓存。
   - 搜索使用正则表达式，应在绝大多数文档规模下保持低延迟。
   - 如果源文本变更（编辑操作），下一次搜索会重建内容视图。

4. **跨平台快捷键**：
   - `Ctrl+F` 在 Windows/Linux 上工作
   - `Cmd+F` 在 macOS 上工作（通过 `metaKey` 检测）
   - 注意：如果 Electron 主进程注册了全局 `CmdOrCtrl+F` 快捷键，可能与渲染进程冲突，需确保仅在主进程处理。

## 维护注意事项

1. **扩展新的 Markdown 语法**：当项目新增自定义 Markdown 语法时（如未来新增 `~~custom~~` 以外的删除线变体），需要同步更新 `buildContentView` 中的语法屏蔽规则和对应的正则表达式。

2. **正则搜索 / 模糊匹配**：当前实现使用字面字符串搜索（正则特殊字符被转义）。未来若需支持正则搜索或模糊匹配，可：
   - 在 `SearchDialog.vue` 中添加「正则」切换按钮
   - 在 `useSearch.search()` 中跳过 `escapedQuery` 转义步骤
   - 注意：正则模式下需处理用户输入的非法正则表达式异常

3. **搜索替换功能**：当前仅支持查找，不支持替换。若需添加替换功能：
   - 在 `SearchDialog.vue` 中添加替换输入框和按钮
   - 通过 `MarkdownEditor` 的 `setValue` / `insertAtCursor` API 执行替换
   - 利用 CodeMirror 的 `dispatch` + `scrollIntoView` 完成定位

4. **搜索高亮样式**：当前使用内联 CSS 变量定义高亮颜色。如需跨主题适配：
   - 在 CSS 中定义 `.cm-search-match` 和 `.cm-search-match-active` 的样式覆盖
   - 或通过 CodeMirror `EditorView.theme` 扩展注入动态样式
   - 避免使用 DaisyUI 主题颜色（oklch），因 CodeMirror 运行在 Shadow DOM 隔离上下文中

5. **测试**：
   - `useSearch.test.ts` 覆盖了 `buildContentView`、原始文本模式、内容模式、边界情况等场景
   - `SearchDialog.test.ts` 覆盖了渲染、交互、状态显示、无障碍等场景
   - 运行测试：`npm test`
