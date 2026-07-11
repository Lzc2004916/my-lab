import MarkdownIt from 'markdown-it'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItContainer from 'markdown-it-container'
import { full as markdownItEmoji } from 'markdown-it-emoji'

// ── 最小类型接口 ─────────────────────────────────────────
// 我们只定义实际使用的属性/方法，避免
// ESNext 模块目标下 @types/markdown-it 的 CJS 命名空间问题。

/** markdown-it 提供给每个内联规则的内联解析状态。 */
interface InlineState {
  pos: number
  posMax: number
  src: string
  push(type: string, tag: string, nesting: number): Token
}

/** markdown-it 令牌流中的 Token 对象。 */
interface Token {
  type: string
  tag: string
  nesting: number
  markup: string
  content: string
  attrs: Array<[string, string]> | null
  attrGet(name: string): string | null
  attrSet(name: string, value: string): void
}

// ── 核心实例 ───────────────────────────────────────────────────

/** 已注册所有插件的共享 markdown-it 实例。 */
const md: MarkdownIt = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
})

// ── 1. markdown-it-attrs ────────────────────────────────────────────
md.use(markdownItAttrs)

// ── 2. markdown-it-container ────────────────────────────────────────
// 列布局容器：:::left / :::right / :::center

function makeColumnOpts(className: string) {
  return {
    validate: (params: string): boolean => params.trim() === className,
    render: (tokens: Token[], idx: number): string => {
      const token = tokens[idx]
      if (token.nesting === 1) {
        return `<div class="${className}-column">\n`
      }
      return '</div>\n'
    },
  }
}

md.use(markdownItContainer, 'left', makeColumnOpts('left'))
md.use(markdownItContainer, 'right', makeColumnOpts('right'))
md.use(markdownItContainer, 'center', makeColumnOpts('center'))

// ── 3. markdown-it-emoji ────────────────────────────────────────────
md.use(markdownItEmoji)

// ── 5. ==高亮== 自定义内联插件 ────────────────────────────

function highlightRule(state: InlineState, silent: boolean): boolean {
  const start = state.pos
  const marker = '=='

  if (start + 5 > state.posMax) return false
  if (state.src.slice(start, start + 2) !== marker) return false

  const contentStart = start + 2
  const closePos = state.src.indexOf(marker, contentStart)
  if (closePos === -1 || closePos === contentStart) return false

  if (!silent) {
    const openToken = state.push('mark_open', 'mark', 1)
    openToken.markup = marker

    const textToken = state.push('text', '', 0)
    textToken.content = state.src.slice(contentStart, closePos)

    const closeToken = state.push('mark_close', 'mark', -1)
    closeToken.markup = marker
  }

  state.pos = closePos + 2
  return true
}

md.inline.ruler.before('emphasis', 'mark', highlightRule)

md.renderer.rules.mark_open = (): string => '<mark class="md-highlight">'
md.renderer.rules.mark_close = (): string => '</mark>'

// ── 7. ^下划线^ 自定义内联插件 ─────────────────────────────

function underlineRule(state: InlineState, silent: boolean): boolean {
  const start = state.pos
  const marker = '^'

  // 至少需要 ^ + 1 个字符 + ^
  if (start + 3 > state.posMax) return false
  if (state.src.charCodeAt(start) !== 0x5e) return false

  // 当前面是字母数字字符时禁止 — 防止 ^ 被误认为是上标符号而非下划线标记。
  if (start > 0) {
    const prevChar = state.src.charCodeAt(start - 1)
    const isAlphanumeric =
      (prevChar >= 0x30 && prevChar <= 0x39) ||
      (prevChar >= 0x41 && prevChar <= 0x5a) ||
      (prevChar >= 0x61 && prevChar <= 0x7a)
    if (isAlphanumeric) return false
  }

  // 查找闭合的 ^
  const contentStart = start + 1
  const closePos = state.src.indexOf(marker, contentStart)
  if (closePos === -1 || closePos === contentStart) return false

  // 当闭合 ^ 后面紧跟字母数字字符时禁止
  //（防止 ^2^3 这样的上标模式被当作下划线处理）。
  if (closePos + 1 < state.posMax) {
    const nextChar = state.src.charCodeAt(closePos + 1)
    const isWordChar =
      (nextChar >= 0x30 && nextChar <= 0x39) ||
      (nextChar >= 0x41 && nextChar <= 0x5a) ||
      (nextChar >= 0x61 && nextChar <= 0x7a)
    if (isWordChar) return false
  }

  if (!silent) {
    const openToken = state.push('underline_open', 'u', 1)
    openToken.markup = marker

    const textToken = state.push('text', '', 0)
    textToken.content = state.src.slice(contentStart, closePos)

    const closeToken = state.push('underline_close', 'u', -1)
    closeToken.markup = marker
  }

  state.pos = closePos + 1
  return true
}

md.inline.ruler.before('emphasis', 'underline', underlineRule)

md.renderer.rules.underline_open = (): string => '<u class="md-underline">'
md.renderer.rules.underline_close = (): string => '</u>'

// ── 8. 图片尺寸扩展 ─────────────────────────────────────────

const originalImageRenderer = md.renderer.rules.image!

md.renderer.rules.image = (tokens, idx, options, env, self): string => {
  const token = tokens[idx]
  const alt = token.attrGet('alt') || ''

  const sizeMatch = alt.match(/\|(\d+)x(\d+)$/)
  if (sizeMatch) {
    const cleanAlt = alt.slice(0, sizeMatch.index).trim()
    token.attrSet('alt', cleanAlt)
    token.attrSet('width', sizeMatch[1])
    token.attrSet('height', sizeMatch[2])
  }

  return originalImageRenderer(tokens, idx, options, env, self)
}

// ── 9. 拆分工具 ──────────────────────────────────────────────


// ── 9a. splitPages (hrSplit) ────────────────────────────────────────

/**
 * 按 Markdown **源代码** 中的 `---` 水平分割线标记进行拆分。
 * 每个片段都通过完整的插件管线独立渲染。
 *
 * 与 md2card.cn 的 hrSplit 行为一致。
 */
export function splitPages(source: string): string[] {
  const segments = source.split('\n---\n')
  return segments.map((s) => md.render(s))
}

// ── 9b. splitByRenderedHR ────────────────────────────────────────────

/**
 * 按 `<hr>` 标签拆分**已渲染的** HTML。
 *
 * 这与 md2card.cn 的方法一致：在渲染后的输出上调用 `r.split("<hr>")`。
 * 每个块都包裹在一个 `<div>` 中，确保 `v-html` 始终看到单个根节点。
 */
export function splitByRenderedHR(renderedHTML: string): string[] {
  const chunks = renderedHTML.split('<hr>')
  return chunks.map((c) => `<div>${c}</div>`)
}

// ── 9c. autoSplitPages (小红书拆分) ──────────────────────────────────

/** {@link autoSplitPages} 的选项。 */
export interface AutoSplitOptions {
  cardWidth: number
  cardHeight: number
  cardPadding: number
  bodyFontSize: number
  theme: string
}

/** 可复用的离屏测量容器（单例）。 */
let _measureEl: HTMLDivElement | null = null

function getMeasureContainer(
  cardWidth: number,
  cardHeight: number,
  bodyFontSize: number,
  theme: string,
): HTMLDivElement {
  if (!_measureEl) {
    _measureEl = document.createElement('div')
    _measureEl.id = '__md2card-measure'
    _measureEl.className = 'card-preview'
    // 🔧 FIX v8: 对测量容器应用 transform: scale(0.95)
    //  这样所有 getBoundingClientRect 测量值都在视觉坐标中，
    //  与 CardPreview 的实际渲染完全一致。不再需要 scale 补偿计算
    //  — 一切自然保持一致。
    //  重要：必须与 .preview-root :deep(.card-preview) transform 匹配
    _measureEl.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;' +
      'overflow:hidden;' +
      'overflow-wrap:break-word;word-wrap:break-word;' +
      'word-break:break-word;' +
      'box-sizing:border-box;pointer-events:none;' +
      'display:block;' +
      'transform:scale(0.95);transform-origin:top center;'
    document.body.appendChild(_measureEl)
  }

  _measureEl.setAttribute('data-card-theme', theme)
  _measureEl.style.width = `${cardWidth}px`
  _measureEl.style.height = `${cardHeight}px`
  _measureEl.style.fontSize = `${bodyFontSize}px`

  return _measureEl
}

/**
 * 智能页面拆分 — md2card.cn 后端自动拆分 API 的客户端等价实现。
 *
 * **工作原理：**
 * 1. 通过 markdown-it 将完整的 Markdown 源代码渲染为 HTML。
 * 2. 将 HTML 注入到一个离屏容器中，该容器样式与实际卡片相同
 *    （相同宽度、内边距、字体、主题 CSS 变量）。
 * 3. 遍历块级子元素，累加它们的渲染高度。
 * 4. 当累积高度超过卡片内容区域时，在溢出元素**之前**拆分
 *    （优先选择标题边界）。
 * 5. 通过 `outerHTML` 将每个页面的元素序列化回 HTML。
 *
 * **处理的边界情况：**
 * - 内容短于一页 → 返回单页。
 * - 单个元素高于一页（例如大型代码块）→ 独占一页（溢出不可避免）。
 * - 空输入 → 返回 `['<p></p>']`。
 *
 * @returns HTML 字符串数组 — 永不为空，最少 1 个。
 */
export function autoSplitPages(
  fullHtml: string,
  options: AutoSplitOptions,
): string[] {
  const { cardWidth, cardHeight, cardPadding, bodyFontSize, theme } = options

  // ── 守卫 ────────────────────────────────────────────────────────
  if (!fullHtml || fullHtml.trim().length === 0) {
    return ['<p></p>']
  }

  // ── 测量 ───────────────────────────────────────────────────────
  const container = getMeasureContainer(
    cardWidth,
    cardHeight,
    bodyFontSize,
    theme,
  )
  container.innerHTML = fullHtml

  // 从容器实际计算的内边距（由 .card-preview CSS 类设置为 2rem）中
  // 推导内容区域高度，而不是依赖调用方的估算值。
  const computedStyle = window.getComputedStyle(container)
  const layoutPaddingTop = parseFloat(computedStyle.paddingTop) || cardPadding
  const layoutPaddingBottom = parseFloat(computedStyle.paddingBottom) || cardPadding

  // 🔧 FIX v5: 测量容器现在有 transform: scale(0.95)。
  //  所有 getBoundingClientRect() 值都在视觉坐标中。
  //  视觉内容区域 = (卡片高度 − 内边距) × 缩放比例。
  //  不再有双高度复杂问题 — 所有内容使用一个 contentHeight。
  //
  //  小红书 440×586（内边距 2rem = 每边 32 px）的数据：
  //    layout 内容区域  = 586 − 64            = 522 px
  //    visual 内容区域  = 522 × 0.95          = 496 px
  //    contentHeight    = 496 − 2             = 494 px

  const CARD_SCALE = 0.95 // 与 CardPreview.vue 和测量容器的 transform 匹配
  const SUBPIXEL_BUFFER = 1

  const layoutContentHeight =
    cardHeight - layoutPaddingTop - layoutPaddingBottom

  /** 视觉坐标中的单个内容高度（缩放后）。
   *  用于页面累积、元素拆分和填满后拆分。 */
  const contentHeight =
    layoutContentHeight * CARD_SCALE - SUBPIXEL_BUFFER

  if (contentHeight <= 0) {
    container.innerHTML = ''
    return [fullHtml]
  }

  const children = Array.from(container.children) as HTMLElement[]

  // 如果 markdown-it 没有产生块级元素（不太可能，但做防御性处理），
  // 将完整的 HTML 作为单页返回。
  if (children.length === 0) {
    container.innerHTML = ''
    return [fullHtml]
  }

  // ── 快速启发式：总内容高度 vs 卡片内容区域 ────
  // 如果完整内容明显高于一张卡片，但只有少量块元素，
  // 每个都可能超出尺寸。我们仍然依赖下面的测量循环进行精确拆分，
  // 但这可以防止测量返回全零的病理情况（例如容器尚未布局）。
  const totalHeight =
    children.length > 0
      ? children[children.length - 1].getBoundingClientRect().bottom -
        children[0].getBoundingClientRect().top
      : 0

  // 🔧 保存拆分前状态，用于后验证中的启发式回退。
  // children[] 和 totalHeight 在后验证展开超大元素之前捕获，
  // 以便回退使用原始元素计数。
  const _preTotalHeight = totalHeight
  const _preChildCount = children.length
  const _preChildrenTags = children.map((c) => c.tagName)

  console.log('[autoSplitPages] entry', {
    cardWidth,
    cardHeight,
    contentHeight,
    totalHeight,
    childCount: children.length,
    firstTag: children[0]?.tagName,
    lastTag: children[children.length - 1]?.tagName,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 🔧 步骤 1 — 预验证：在累积循环之前检查每个子元素的单个高度
  // 是否超出卡片内容区域。
  //
  // 如果任何单个子元素高于 contentHeight，通过 splitOversizedBlock
  // 预先拆分它，这样主循环只处理保证能单独放入一页的元素。
  // 这修复了当超大元素位于 children 数组中间时，直到 Case 2 将其推入
  // 下一页才被捕获的场景 — 通过预先展开超大元素，每个子元素的高度
  // ≤ contentHeight，使累积循环的工作变得简单。
  // ═══════════════════════════════════════════════════════════════════════
  {
    let hasOversized = false
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect()
      const childHeight = rect.bottom - rect.top
      if (childHeight > contentHeight + SUBPIXEL_BUFFER) {
        hasOversized = true
        break
      }
    }

    if (hasOversized) {
      const flatHTML: string[] = []
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect()
        const childHeight = rect.bottom - rect.top
        if (childHeight > contentHeight + SUBPIXEL_BUFFER) {
          console.log('[autoSplitPages] Pre-splitting oversized child', {
            tag: children[i].tagName,
            childHeight,
            contentHeight,
            index: i,
          })
          const subPages = splitOversizedBlock(children[i], contentHeight)
          for (const sp of subPages) flatHTML.push(sp)
        } else {
          flatHTML.push(children[i].outerHTML)
        }
      }

      // 用展开后的子元素重建容器，这样主循环
          // 在正确的坐标上测量新的 DOM 元素。
      container.innerHTML = flatHTML.join('\n')
      const newChildren = Array.from(container.children) as HTMLElement[]
      children.length = 0
      for (const c of newChildren) children.push(c)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 步骤 2 — 主拆分循环：将子元素累积到页面中。
  //
  // 🔧 FIX v3: 带语义边界检测的软拆分。
  //
  // 关键改进：
  // 1. SAFETY_MARGIN: 在 contentHeight 的 92% 处触发拆分（而非 100%）
  //     → 防止文本触碰到卡片底部边缘
  //     → 提供视觉呼吸空间（卡片高度的 8% 作为内边距）
  //
  // 2. 语义边界优先级（从高到低）：
  //     - H1-H6 / HR（自然分段边界）          [优先级 1]
  //     - BLOCKQUOTE / PRE / TABLE（块容器）   [优先级 2]
  //     - P / LI / DIV（段落级元素）           [优先级 3]
  //     - BR（文本内的换行）                   [优先级 4]
  //
  // 3. 尽可能不在单词/句子中间断开。
  // ═══════════════════════════════════════════════════════════════════════

  /** 在 contentHeight 的 99.9% 处拆分 — 实际上没有浪费 */
  const SAFE_HEIGHT_RATIO = 0.999
  const safeContentHeight = contentHeight * SAFE_HEIGHT_RATIO

  const pages: string[] = []
  let startIdx = 0

  for (let i = 0; i < children.length; i++) {
    const pageFirst = children[startIdx]
    const current = children[i]

    // 从当前页面第一个元素到当前元素底部的累积高度。
    const pageHeight =
      current.getBoundingClientRect().bottom -
      pageFirst.getBoundingClientRect().top

    // ── Case 1: 超大单个元素（防御性回退） ───────
    if (pageHeight > safeContentHeight && i === startIdx) {
      const subPages = splitOversizedBlock(children[i], contentHeight)
      for (const sp of subPages) pages.push(sp)
      startIdx = i + 1
      if (startIdx >= children.length) {
        container.innerHTML = ''
        return _postValidateAndReturn(pages, fullHtml, container, contentHeight, SUBPIXEL_BUFFER, options, _preTotalHeight, _preChildCount, _preChildrenTags)
      }
      container.innerHTML = serializeElements(children, startIdx, children.length)
      const remaining = Array.from(container.children) as HTMLElement[]
      children.length = 0
      for (const c of remaining) children.push(c)
      startIdx = 0
      i = -1
      continue
    }

    // ── Case 2: 软页面溢出 ──────────────────────────────────
    if (pageHeight > safeContentHeight && i > startIdx) {
      // ── 计算当前页面剩余多少空间 ──────
      //  使用 children[i].top（而不是 children[i-1].bottom），因为
      //  元素之间的间隙包括折叠边距（P 标签有 margin-bottom:1em）。
      //  children[i].top 是填充块将放置的实际渲染位置。
      //
      //  🔧 FIX: cardHeight/layoutPaddingBottom 和
      //  getBoundingClientRect().top 现在都在视觉坐标中
      //  （测量容器有 transform: scale(0.95)）。
      //  对 layout 值应用 CARD_SCALE 以匹配。
      //
      //  🔧 FIX v11: contentAreaBottom 应该是从容器顶部边缘开始测量的
      //  内容区域底部。内容区域从 layoutPaddingTop * CARD_SCALE 开始，
      //  高度为 contentHeight。所以 contentAreaBottom = layoutPaddingTop * CARD_SCALE + contentHeight。
      const contentAreaBottom =
        layoutPaddingTop * CARD_SCALE + contentHeight
      const overflowTop =
        children[i].getBoundingClientRect().top
      // 🔧 FIX v11: 从 remainingSpace 计算中移除 SUBPIXEL_BUFFER。
      //  splitBlockByDOM 函数已经有自己的 PROBE_TOLERANCE，
      //  所以我们这里不需要保守。给它完整的剩余空间以最大化卡片填充。
      const remainingSpace =
        contentAreaBottom - overflowTop

      // ── FIX v4: 先填满后拆分 — 如果溢出元素是段落或标题
      //    且有显著的剩余空间，则拆分该元素本身，使第一部分
      //    填满当前页面，其余部分开始下一页。这消除了"半空卡片"问题，
      //    即大段落被整个推到下一页。
      const overflowTag = children[i].tagName
      // 🔧 FIX v8: 将 MIN_FILL_THRESHOLD 降低到 0.5% 以允许
      //  即使剩余空间很小时也能拆分。这确保我们始终在有剩余空间时
      //  尝试填充卡片。
      const MIN_FILL_THRESHOLD = contentHeight * 0.005
      const canFillBySplitting =
        remainingSpace > MIN_FILL_THRESHOLD &&
        (overflowTag === 'P' || /^H[1-6]$/.test(overflowTag))

      console.log('[autoSplitPages] Fill-split check', {
        tag: overflowTag,
        remainingSpace,
        MIN_FILL_THRESHOLD,
        canFillBySplitting,
        pageHeight,
        safeContentHeight,
        contentHeight,
        contentAreaBottom,
        overflowTop,
        layoutPaddingTop,
        CARD_SCALE,
      })

      if (canFillBySplitting) {
        const chunks = splitBlockByDOM(children[i], remainingSpace)
        if (chunks.length >= 1) {
          // 当前页面 = 累积的元素 + 第一个块
          const baseHTML = serializeElements(children, startIdx, i)
          pages.push(baseHTML + '\n' + chunks[0])
          console.log(
            `[autoSplitPages] Fill-split: filled ${remainingSpace.toFixed(0)}px ` +
            `remaining space with partial <${overflowTag}> (${chunks.length} chunk(s))`,
          )

          if (chunks.length > 1) {
            // 重建 children：剩余块 + i 之后的所有元素
            const afterHTML = serializeElements(children, i + 1, children.length)
            const restHTML =
              chunks.slice(1).join('\n') +
              (afterHTML ? '\n' + afterHTML : '')
            container.innerHTML = restHTML
            const rebuilt = Array.from(container.children) as HTMLElement[]
            children.length = 0
            for (const c of rebuilt) children.push(c)
            startIdx = 0
            i = -1 // 重新开始循环
            continue
          }

          // 单个块 — 整个元素适配；跳过它
          startIdx = i + 1
          continue
        }
      }

      // ── 回退：在块边界进行语义拆分 ───────────────
      let splitAt = findSemanticSplitPoint(children, startIdx, i, contentHeight)

      if (splitAt > startIdx && splitAt <= i) {
        pages.push(serializeElements(children, startIdx, splitAt))
        startIdx = splitAt
        i = splitAt - 1
        continue
      }

      // 最后手段：在当前元素边界处拆分
      pages.push(serializeElements(children, startIdx, i))
      startIdx = i
      i = i - 1
      continue
    }
  }

  // ── 剩余元素构成最后一页 ─────────────────────────
  if (startIdx < children.length) {
    pages.push(serializeElements(children, startIdx, children.length))
  }

  // ── 清理和后验证 ───────────────────────────────────────
  container.innerHTML = ''
  return _postValidateAndReturn(pages, fullHtml, container, contentHeight, SUBPIXEL_BUFFER, options, _preTotalHeight, _preChildCount, _preChildrenTags)
}

/**
 * 🔧 后验证生成的页面并应用启发式回退。
 *
 * **后验证**：对于多页结果，在容器中重新测量每个页面。
 *  如果任何页面的内容高度超过 `contentHeight`，
 *  通过 autoSplitPages 递归重新拆分（带深度保护）。
 *
 * **启发式回退**：如果只生成了 1 页但拆分前总高度明显超过一张卡片，
 *  通过均匀分配元素来强制拆分。这可以捕获测量失败的情况
 *  （例如容器未布局、字体未加载）。
 *
 * @returns 最终验证后的页面数组 — 永不为空。
 */
function _postValidateAndReturn(
  pages: string[],
  fullHtml: string,
  container: HTMLDivElement,
  contentHeight: number,
  SUBPIXEL_BUFFER: number,
  options: AutoSplitOptions,
  preTotalHeight: number,
  preChildCount: number,
  preChildrenTags: string[],
): string[] {
  const rawPages = pages.length >= 1 ? pages : [fullHtml]

  // ═════════════════════════════════════════════════════════════════════
  // 启发式回退：1 页但内容明显超过卡片高度
  // ═════════════════════════════════════════════════════════════════════
  if (rawPages.length === 1 && preChildCount > 1 && preTotalHeight > contentHeight * 1.2) {
    // 将单页解析回子元素以进行重新分配
    container.innerHTML = rawPages[0]
    const fallbackChildren = Array.from(container.children) as HTMLElement[]
    if (fallbackChildren.length > 1) {
      const avgPerPage = Math.max(
        1,
        Math.floor(fallbackChildren.length / Math.ceil(preTotalHeight / contentHeight)),
      )
      const forcedPages: string[] = []
      for (let i = 0; i < fallbackChildren.length; i += avgPerPage) {
        forcedPages.push(
          serializeElements(fallbackChildren, i, Math.min(i + avgPerPage, fallbackChildren.length)),
        )
      }
      container.innerHTML = ''
      console.warn('[autoSplitPages] Heuristic fallback triggered!', {
        preTotalHeight,
        contentHeight,
        preChildCount,
        fallbackChildren: fallbackChildren.length,
        forcedPages: forcedPages.length,
        avgPerPage,
        preChildrenTags,
      })
      return forcedPages
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // 后验证：重新测量每个页面 — 如果溢出则重新拆分
  // ═════════════════════════════════════════════════════════════════════
  if (rawPages.length <= 1) {
    container.innerHTML = ''
    return rawPages
  }

  const validated: string[] = []
  const MAX_DEPTH = 3 // 防止病理情况下的无限递归

  function validate(pagesToCheck: string[], depth: number): void {
    for (const pageHTML of pagesToCheck) {
      if (depth >= MAX_DEPTH) {
        validated.push(pageHTML)
        continue
      }

      container.innerHTML = pageHTML
      const pc = Array.from(container.children) as HTMLElement[]
      if (pc.length === 0) {
        validated.push(pageHTML)
        continue
      }

      const pageHeight =
        pc[pc.length - 1].getBoundingClientRect().bottom -
        pc[0].getBoundingClientRect().top

      if (pageHeight <= contentHeight + SUBPIXEL_BUFFER) {
        // 适配 — 保留。
        validated.push(pageHTML)
      } else {
        // 溢出 — 递归重新拆分此页。
        console.warn('[autoSplitPages] Post-validation overflow detected', {
          pageHeight,
          contentHeight,
          depth,
          childCount: pc.length,
          tags: pc.map((c) => c.tagName),
        })
        const subPages = autoSplitPages(pageHTML, options)
        if (subPages.length > 1) {
          validate(subPages, depth + 1)
        } else {
          // 无法进一步拆分 — 保持原样（比丢失内容好）。
          validated.push(pageHTML)
        }
      }
    }
  }

  validate(rawPages, 0)
  container.innerHTML = ''
  return validated.length > 0 ? validated : rawPages
}

/**
 * 🔧 递归拆分一个高于卡片内容区域的单个块元素。
 *
 * **重要**：此函数是只读的 — 它不会修改容器 DOM。
 *  它只通过 getBoundingClientRect 读取测量值。
 *  这确保调用方的元素引用保持有效。
 *
 * 支持的元素类型：
 * - UL / OL → 按 <li> 子元素拆分
 * - BLOCKQUOTE → 按块子元素拆分
 * - PRE → 按换行符分隔的行拆分
 * - DIV → 按块子元素拆分
 *
 * 对于任何其他元素类型，返回 `[el.outerHTML]`。
 */
function splitOversizedBlock(
  el: HTMLElement,
  contentHeight: number,
): string[] {
  const tag = el.tagName

  // ── UL / OL → 在 LI 边界处拆分 ──────────────────────────────
  if (tag === 'UL' || tag === 'OL') {
    const items = Array.from(el.children) as HTMLElement[]
    if (items.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const groups: string[] = []
    let groupStart = 0
    // 🔧 FIX: 使用 `let` 以便在每次拆分时更新引用。
    let firstItem: HTMLElement = items[0]

    for (let j = 0; j < items.length; j++) {
      const h =
        items[j].getBoundingClientRect().bottom -
        firstItem.getBoundingClientRect().top

      if (h > contentHeight && j > groupStart) {
        // groupStart … j-1 这些项目适合放在一页中。
        groups.push(wrapChildren(wrapperAttrs, items, groupStart, j))
        groupStart = j
        // 🔧 FIX: 将 firstItem 更新为新组的第一个元素，
        // 以便测量值相对于新组的顶部。
        firstItem = items[j]
      }
    }

    // 剩余项目构成最后一组。
    if (groupStart < items.length) {
      groups.push(wrapChildren(wrapperAttrs, items, groupStart, items.length))
    }

    return groups.length > 0 ? groups : [el.outerHTML]
  }

  // ── BLOCKQUOTE → 在块子元素边界处拆分 ───────────────────
  if (tag === 'BLOCKQUOTE') {
    const kids = Array.from(el.children) as HTMLElement[]
    if (kids.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const groups = groupChildrenByHeight(kids, contentHeight)

    return groups.map((g) => `<${tag}${wrapperAttrs} style="width:100%;display:block;">\n${g}\n</${tag}>`)
  }

  // ── PRE → 按近似行数拆分 ─────────────────────────
  if (tag === 'PRE') {
    const text = el.textContent || ''
    const lines = text.split('\n')
    if (lines.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const codeEl = el.querySelector('code')
    const codeAttrs = codeEl ? extractElementAttrs(codeEl) : ''

    // 从 pre 的计算样式估算行高。
    const preStyle = window.getComputedStyle(el)
    const lineH =
      parseFloat(preStyle.lineHeight) ||
      parseFloat(preStyle.fontSize) * 1.6
    if (lineH <= 0) return [el.outerHTML]

    const maxLinesPerPage = Math.max(1, Math.floor(contentHeight / lineH))
    const groups: string[] = []

    for (let start = 0; start < lines.length; start += maxLinesPerPage) {
      const chunk = lines.slice(start, start + maxLinesPerPage).join('\n')
      const inner = codeAttrs
        ? `<code${codeAttrs}>${escapeHtml(chunk)}</code>`
        : `<code>${escapeHtml(chunk)}</code>`
      groups.push(`<${tag}${wrapperAttrs} style="width:100%;display:block;">${inner}</${tag}>`)
    }

    return groups.length > 0 ? groups : [el.outerHTML]
  }

  // ── DIV（容器列等）→ 按块子元素拆分 ──────
  if (tag === 'DIV') {
    const kids = Array.from(el.children) as HTMLElement[]
    if (kids.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const cls = el.className
    const classAttr = cls ? ` class="${escapeAttr(cls)}"` : ''
    const groups = groupChildrenByHeight(kids, contentHeight)

    return groups.map(
      (g) => `<${tag}${classAttr}${wrapperAttrs} style="width:100%;display:block;">\n${g}\n</${tag}>`,
    )
  }

  // ── P / H1-H6 → DOM 测量的拆分 ──────────────────────────────────
  // 🔧 FIX v2: 用基于 DOM 测量的二分查找 + getBoundingClientRect
  // 替换了字符计数估算（avgCharWidth = fontSize*0.55）。
  // 旧的估算方法针对拉丁文本（~0.5em 平均宽度）校准，对 CJK 文本
  // （~1em 宽度）会系统性地高估每页字符数，导致 splitOversizedBlock
  // 返回未拆分的内容并溢出卡片容器。Range API 通过拆分保留了
  // 内联格式（粗体、斜体、链接、代码片段等）。
  if (tag === 'P' || /^H[1-6]$/.test(tag)) {
    return splitBlockByDOM(el, contentHeight)
  }

  // ── 通用块级回退 ────────────────────────────────────
  // 🔧 FIX v2: 对任何其他超大块元素使用 DOM 测量。
  // 出错时回退到 el.outerHTML（防御性处理）。
  const text = el.textContent || ''
  if (text.length > 1) {
    try {
      return splitBlockByDOM(el, contentHeight)
    } catch (e) {
      console.warn('[splitOversizedBlock] DOM split failed for', tag, e)
    }
  }

  // ── 真正不可拆分的元素（空、单字符等）──────────
  return [el.outerHTML]
}

/**
 * 🔧 FIX v3: 将一组块级子元素分组为子数组，每个子数组
 * 在 `contentHeight` 内适配，并具有语义边界感知能力。
 *
 * **相比 v2 的改进：**
 * - 使用 safeContentHeight（实际值的 92%）进行早期拆分
 * - 调用 findSemanticSplitPoint() 而不是在溢出点硬切割
 * - 防止段落/元素被尴尬地拆分到不同组中
 *
 * 只读 — 不修改 DOM。
 *
 * @param children      要分组的块级元素数组
 * @param contentHeight 每组允许的最大高度
 * @returns             HTML 字符串数组（每组一个）
 */
function groupChildrenByHeight(
  children: HTMLElement[],
  contentHeight: number,
): string[] {
  if (children.length === 0) return []

  /** 安全边距：在 99.9% 高度处触发分组 — 实际上没有浪费 */
  const SAFE_HEIGHT_RATIO = 0.999
  const safeContentHeight = contentHeight * SAFE_HEIGHT_RATIO

  const groups: string[] = []
  let groupStart = 0
  let firstChild: HTMLElement = children[0]

  for (let i = 0; i < children.length; i++) {
    const h =
      children[i].getBoundingClientRect().bottom -
      firstChild.getBoundingClientRect().top

    // 🔧 FIX v3: 使用 safeContentHeight 和语义边界检测
    if (h > safeContentHeight && i > groupStart) {
      const splitAt = findSemanticSplitPoint(children, groupStart, i, contentHeight)

      if (splitAt > groupStart && splitAt <= i) {
        groups.push(serializeElements(children, groupStart, splitAt))
        groupStart = splitAt
        firstChild = children[splitAt]
        i = splitAt - 1 // 从新起点重新评估
        continue
      }

      // 回退：在当前元素处硬拆分
      groups.push(serializeElements(children, groupStart, i))
      groupStart = i
      firstChild = children[i]
    }
  }

  if (groupStart < children.length) {
    groups.push(serializeElements(children, groupStart, children.length))
  }

  return groups
}

/**
 * 从元素中提取所有属性，转换为适合插入 HTML 开始标签的字符串。
 * 返回 '' 或 ' attr="value"…'。
 */
function extractElementAttrs(el: HTMLElement): string {
  const parts: string[] = []
  for (const attr of Array.from(el.attributes)) {
    // 跳过内部属性或会被重复的属性。
    if (attr.name === 'style') continue // style 因每个克隆而异
    parts.push(`${attr.name}="${escapeAttr(attr.value)}"`)
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : ''
}

/**
 * 🔧 FIX v3: 使用 DOM 实际测量和语义边界感知，将高于卡片内容区域的
 * 块级文本元素（P、H1-H6 或通用块）拆分为页面大小的块。
 *
 * **为什么使用 DOM 测量而不是字符估算：**
 * 旧方法（`avgCharWidth = fontSize * 0.55`）在以下情况会失败：
 * - CJK / 全角文本（字符宽度约 1 em，而不是约 0.55 em）
 * - 混合拉丁 + CJK 内容
 * - 可变宽度字体，真实平均值因文本样本而异
 * - 带有内联格式的文本，改变有效字符密度
 *
 * **🔧 v3 新增：语义边界检测以防止硬切割**
 *
 * 二分查找找到最大适配偏移量后，我们**回退**到最近的句子/单词边界，
 * 避免将单词切半。
 *
 * **边界优先级（从高到低）：**
 * 1. 句子结尾：。！？.!?\n（CJK + 拉丁标点符号）
 * 2. 从句分隔符：，,；;：:（逗号、分号）
 * 3. 单词边界：空格、连字符、CJK 字符转换
 *
 * **算法（每页）：**
 * 1. 对文本位置 [lo, hi] 进行二分查找，找到原始最大偏移量
 * 2. 回退到最近的句子/单词边界（语义清理）
 * 3. 使用 Range API 提取 innerHTML，保留内联格式
 * 4. 重复直到整个元素被消耗完
 *
 * @returns HTML 字符串数组，每个都包裹在原始元素标签中并带有原始属性。永不为空。
 */
function splitBlockByDOM(
  el: HTMLElement,
  contentHeight: number,
): string[] {
  const tag = el.tagName
  const fullText = el.textContent || ''

  if (fullText.length <= 1) return [el.outerHTML]

  const measureParent = el.parentElement
  if (!measureParent) return [el.outerHTML]

  const wrapperAttrs = extractElementAttrs(el)
  const cls = el.className
  const classAttr = cls ? ` class="${escapeAttr(cls)}"` : ''

  // ── 构建轻量级测试元素用于二分查找测量 ──
  const testEl = document.createElement(tag)
  if (cls) testEl.className = cls
  for (const attr of Array.from(el.attributes)) {
    if (attr.name !== 'style') testEl.setAttribute(attr.name, attr.value)
  }
  const elStyle = window.getComputedStyle(el)
  const LAYOUT_PROPS = [
    'font-size', 'font-family', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'word-spacing',
    'text-indent', 'white-space', 'word-break', 'overflow-wrap',
    'text-transform', 'font-variant', 'font-stretch',
    'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom',
    'box-sizing',
  ]
  testEl.style.cssText = LAYOUT_PROPS
    .map((p) => `${p}: ${elStyle.getPropertyValue(p)}`)
    .join('; ')
  
  // 🔧 FIX v11: 关键 — 测量容器有 transform: scale(0.95)。
  //  这意味着 getBoundingClientRect() 返回的是视觉（缩放）坐标，
  //  但 getComputedStyle() 返回的是布局（未缩放）值。
  //
  //  为了让测试元素具有与原始元素完全相同的文本换行行为，
  //  我们需要匹配其实际渲染宽度。
  //
  //  由于 testEl 和 el 都在同一个缩放容器中，它们都会被缩放 0.95 倍。
  //  所以我们应该为两者使用相同的宽度来源。
  //  使用 getComputedStyle().width 确保 testEl 具有与 el 相同的布局宽度，
  //  缩放后得到相同的视觉宽度和文本换行。
  testEl.style.width = elStyle.width
  testEl.style.display = 'block'

  // DEBUG: 记录测量详情
  console.log('[splitBlockByDOM] Test element setup', {
    tag,
    computedWidth: elStyle.width,
    boundingWidth: el.getBoundingClientRect().width,
    contentHeight,
    textLength: fullText.length,
  })

  // 🔧 FIX: 在测量期间将测试元素的外边距设为零。
  // 二分查找测量的是纯文本高度；外边距由主循环的
  // getBoundingClientRect().bottom - getBoundingClientRect().top 计算
  // 单独考虑。这里包含外边距会导致重复计算并导致过早拆分。
  testEl.style.marginTop = '0px'
  testEl.style.marginBottom = '0px'

  const pages: string[] = []
  let textStart = 0

  // ── 防止病理无限循环的安全守卫 ──────────────
  let safetyCounter = 0
  const MAX_PAGES = 500

  while (textStart < fullText.length && safetyCounter < MAX_PAGES) {
    safetyCounter++

    // ── 步骤 1: 二分查找原始最大偏移量 ─────────────────────
    let lo = textStart + 1
    let hi = fullText.length
    let bestEnd = textStart + 1

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      testEl.textContent = fullText.slice(textStart, mid)
      measureParent.appendChild(testEl)
      const measuredH = testEl.getBoundingClientRect().height
      measureParent.removeChild(testEl)

      // 二分查找允许小容差以更激进
      if (measuredH <= contentHeight + 0.5) {
        bestEnd = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    // 🔧 FIX v10: 超激进探测以最大化卡片填充。
    //  二分查找后，继续添加字符直到我们绝对确定无法再添加更多。
    //  使用宽松的容差（2px）来考虑亚像素渲染差异。
    if (bestEnd < fullText.length) {
      const PROBE_TOLERANCE = 2
      let probe = bestEnd
      
      // 继续探测直到找到超过限制的高度
      while (probe < fullText.length) {
        testEl.textContent = fullText.slice(textStart, probe + 1)
        measureParent.appendChild(testEl)
        const probeH = testEl.getBoundingClientRect().height
        measureParent.removeChild(testEl)
        
        // 如果适配（在容差内），继续
        if (probeH <= contentHeight + PROBE_TOLERANCE) {
          bestEnd = probe + 1
          probe++
        } else {
          // 不适配 - 停止探测
          break
        }
      }
      
      console.log('[splitBlockByDOM] Probing result', {
        bestEnd,
        charsInThisChunk: bestEnd - textStart,
        remainingChars: fullText.length - bestEnd,
      })
    }

    if (bestEnd <= textStart) {
      bestEnd = textStart + 1
    }

    // ── 步骤 2: 🔧 FIX v3 — 回退到语义边界 ─────────────
    // 找到原始字符限制后，向后回溯以避免将单词/句子切半。
    // 这防止了"硬切割"。
    const semanticEnd = findNearestSemanticBoundary(fullText, textStart, bestEnd)

    if (semanticEnd < bestEnd) {
      console.log(`[splitBlockByDOM] Semantic rewind: ${bestEnd} → ${semanticEnd} (${bestEnd - semanticEnd} chars saved from hard cut)`)
    }

    // ── 步骤 3: 提取 HTML 并保留内联格式 ────────────
    const pageInnerHTML = extractHTMLForTextRange(el, textStart, semanticEnd)
    // 🔧 FIX v9: 移除 width:100% 覆盖。原始元素的宽度
    //  由卡片的内边距和 CSS 决定。强制 width:100% 可能导致 p 标签
    //  比内容区域更宽，改变文本换行行为，与测量时不一致。
    pages.push(
      `<${tag}${classAttr}${wrapperAttrs} style="display:block;">${pageInnerHTML}</${tag}>`,
    )
    textStart = semanticEnd
  }

  if (safetyCounter >= MAX_PAGES) {
    console.warn('[splitBlockByDOM] Safety limit reached', {
      tag,
      textLength: fullText.length,
      pages: pages.length,
    })
  }

  return pages.length > 0 ? pages : [el.outerHTML]
}

/**
 * 🔧 FIX v3: 在 `rawEnd` 之前找到最近的语义边界。
 *
 * 从 `rawEnd` 向后扫描，找到一个不会尴尬地拆分单词或句子的
 * "自然"切割点。
 *
 * **边界模式**（按优先顺序检查）：
 *
 * | 模式 | 描述                          | 示例         |
 * |---------|--------------------------------------|------------------|
 * | 。！？.!?\n | 句子结尾（CJK + 拉丁）     | "Hello."        |
 * | ，,；: | 从句分隔符                    | "Hello, world"  |
 * | \s      | 单词空格                          | "Hello world"   |
 * | -       | 连字符（安全断点）           | "state-of-the-art" |
 *
 * **CJK 文本的特殊处理：**
 * 每个 CJK 字符是一个逻辑单元，因此我们可以在任何两个 CJK 字符之间安全切割，
 * 而不会破坏"单词"（CJK 不使用空格）。
 *
 * @param text     正在拆分的完整文本
 * @param start    当前页面起始偏移量（独占下界）
 * @param rawEnd   二分查找的原始结束偏移量（可能在单词中间）
 * @returns        调整后的结束偏移量，在最近的语义边界处 ≥ start+1
 */
function findNearestSemanticBoundary(
  text: string,
  start: number,
  rawEnd: number,
): number {
  // 必须保留至少 1 个字符
  if (rawEnd <= start + 1) return Math.min(start + 1, text.length)

  // 🔧 FIX v6: Disabled semantic rewind (0 chars).
  //  Any rewind reduces card fill.  The binary search already finds the
  //  optimal split point — rewinding for "nice" boundaries wastes space.
  const MAX_REWIND = 0
  const searchStart = Math.max(start + 1, rawEnd - MAX_REWIND)
  const searchText = text.slice(searchStart, rawEnd)

  // ── Gate: refuse to rewind more than 1 % of the current page ──────
  //  If the semantic boundary is too far back, we'd rather accept a
  //  slightly imperfect cut than waste significant card space.
  const pageLength = rawEnd - start
  const maxAllowedRewind = Math.max(1, Math.floor(pageLength * 0.01))

  function accept(pos: number): boolean {
    const rewind = rawEnd - pos
    return rewind <= maxAllowedRewind && pos > start
  }

  // ── Priority 1: Sentence endings (strongest boundary) ──────────────
  const sentenceEndMatch = searchText.match(/[。！？.!?\n][^。！？.!?\n]*$/)
  if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
    const pos = searchStart + sentenceEndMatch.index + 1
    if (accept(pos)) return pos
  }

  // ── Priority 2: Clause separators (commas, semicolons, colons) ─────
  const clauseSepMatch = searchText.match(/[，,；:][^，,；:]*$/)
  if (clauseSepMatch && clauseSepMatch.index !== undefined) {
    const pos = searchStart + clauseSepMatch.index + 1
    if (accept(pos)) return pos
  }

  // ── Priority 3: Spaces (word boundaries for Latin text) ────────────
  const spaceMatch = searchText.match(/\s+[^\s]*$/)
  if (spaceMatch && spaceMatch.index !== undefined) {
    const pos = searchStart + spaceMatch.index + 1
    if (accept(pos)) return pos
  }

  // ── Priority 4: Hyphens (compound word safe break points) ──────────
  const hyphenMatch = searchText.match(/-[^-]*$/)
  if (hyphenMatch && hyphenMatch.index !== undefined) {
    const pos = searchStart + hyphenMatch.index + 1
    if (accept(pos)) return pos
  }

  // ── Priority 5: CJK/Latin transition boundary ──────────────────────
  // 在 CJK 字符和非 CJK 字符之间（或反之）可以安全切割
  for (let i = rawEnd - 1; i > start + 1; i--) {
    const prevChar = text.charCodeAt(i - 1)
    const currChar = text.charCodeAt(i)
    const prevIsCJK = (prevChar >= 0x4e00 && prevChar <= 0x9fff) ||
                      (prevChar >= 0x3000 && prevChar <= 0x303f)
    const currIsCJK = (currChar >= 0x4e00 && currChar <= 0x9fff) ||
                      (currChar >= 0x3000 && currChar <= 0x303f)
    if (prevIsCJK !== currIsCJK) {
      if (accept(i)) return i
      break // CJK boundary too far — don't bother with deeper scan
    }
  }

  // ── Fallback: Return rawEnd (no acceptable semantic boundary) ──────
  return rawEnd
}

/**
 * 提取与纯文本字符范围 [startOffset, endOffset) 对应的
 * `el` 的 innerHTML，保留所有内联格式。
 *
 * 使用 TreeWalker 在深度克隆中定位文本节点，然后
 * 使用 Range.cloneContents()，使跨越边界的
 * 内联标签（<strong>, <em>, <a>, <code> 等）能正确地在输出中
 * 打开/关闭。
 *
 * @param el          源元素（不修改 — 我们克隆它）。
 * @param startOffset 在 el.textContent 中的字符偏移量。
 * @param endOffset   在 el.textContent 中的字符偏移量（不含）。
 * @returns           切片的 inner HTML 字符串。
 */
function extractHTMLForTextRange(
  el: HTMLElement,
  startOffset: number,
  endOffset: number,
): string {
  const clone = el.cloneNode(true) as HTMLElement
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT)
  let currentOffset = 0
  let startNode: Text | null = null
  let startNodeOffset = 0
  let endNode: Text | null = null
  let endNodeOffset = 0

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const len = node.textContent?.length || 0

    if (!startNode && currentOffset + len > startOffset) {
      startNode = node
      startNodeOffset = startOffset - currentOffset
    }

    if (currentOffset + len >= endOffset) {
      endNode = node
      endNodeOffset = endOffset - currentOffset
      break
    }

    currentOffset += len
  }

  // 如果无法定位到文本节点（不应发生），回退到
  // a plain-text slice so we never lose content.
  if (!startNode || !endNode) {
    return escapeHtml((el.textContent || '').slice(startOffset, endOffset))
  }

  const range = document.createRange()
  range.setStart(startNode, startNodeOffset)
  range.setEnd(endNode, endNodeOffset)

  const fragment = range.cloneContents()
  const tempDiv = document.createElement('div')
  tempDiv.appendChild(fragment)
  return tempDiv.innerHTML
}

/** 将子元素切片包裹在父标签的克隆中。 */
function wrapChildren(
  parentAttrs: string,
  children: HTMLElement[],
  from: number,
  to: number,
): string {
  const parts: string[] = []
  for (let i = from; i < to; i++) {
    parts.push(children[i].outerHTML)
  }
  const tag = children[0]?.parentElement?.tagName || 'UL'
  return `<${tag}${parentAttrs} style="width:100%;display:block;">\n${parts.join('\n')}\n</${tag}>`
}

/** <pre> 分割内文本内容的最小化 HTML 转义。 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 转义 HTML 属性值。 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 将 DOM 元素切片序列化为 HTML 字符串。 */
function serializeElements(
  children: HTMLElement[],
  from: number,
  to: number,
): string {
  const parts: string[] = []
  for (let i = from; i < to; i++) {
    parts.push(children[i].outerHTML)
  }
  return parts.join('\n')
}

/**
 * 🔧 FIX v3: Find the best semantic split point within [startIdx, endIdx].
 *
 * **Strategy**: Scan backwards from `endIdx` to find the highest-priority
 * semantic boundary where we can cleanly split content without cutting
 * words or sentences in half.
 *
 * **Priority order** (highest → lowest):
 *
 * | Priority | Element Type       | Reason                                    |
 * |----------|-------------------|-------------------------------------------|
 * | 1        | H1-H6, HR         | Natural section breaks (already existed)   |
 * | 2        | BLOCKQUOTE, PRE, TABLE | Block containers (self-contained)     |
 * | 3        | P, LI, DIV        | Paragraph-level elements                  |
 * | 4        | BR                | Line breaks within text flow              |
 *
 * **Safety constraints**:
 * - Never return a split point before `startIdx + 1` (must keep ≥1 element)
 * - Prefer boundaries that leave the current page < 92% full
 * - If no good boundary found, fall back to splitting at `endIdx`
 *
 * @param children   Array of block-level child elements
 * @param startIdx   First element of the current page
 * @param endIdx     The element that caused overflow (inclusive)
 * @returns          Recommended split index (elements [startIdx, splitAt) go to current page)
 */
function findSemanticSplitPoint(
  children: HTMLElement[],
  startIdx: number,
  endIdx: number,
  contentHeight: number,
): number {
  if (endIdx <= startIdx) return startIdx

  // ── Compute how much height the current page already has ──────────
  //  We use this to ensure semantic splits don't waste too much space.
  const pageFirst = children[startIdx]
  const pageFirstTop = pageFirst.getBoundingClientRect().top

  /**
   * 返回元素 [startIdx, splitAt) 所占 contentHeight 的比例。
 * 用于拒绝使页面内容过于稀疏的分割点。
   */
  function fillRatio(splitAt: number): number {
    if (splitAt <= startIdx) return 0
    const last = children[splitAt - 1]
    const h = last.getBoundingClientRect().bottom - pageFirstTop
    return h / contentHeight
  }

  // ── Priority 1: Headings and horizontal rules (natural section breaks) ──
  for (let scan = endIdx; scan > startIdx; scan--) {
    const tag = children[scan].tagName
    if (/^H[1-6]$/.test(tag) || tag === 'HR') {
      // 🔧 FIX v4: Only accept heading split if the page is reasonably full.
      //  If splitting before this heading would leave the page < 55 % full,
      //  skip it and try a lower-priority boundary instead — it's better to
      //  split mid-section than to waste half a card.
      if (fillRatio(scan) >= 0.55) {
        console.log(`[findSemanticSplitPoint] Accepted Priority-1 boundary at ${scan} <${tag}> (fillRatio=${(fillRatio(scan)*100).toFixed(0)}%)`)
        return scan
      }
      console.log(`[findSemanticSplitPoint] Skipped Priority-1 boundary at ${scan} <${tag}> — fillRatio only ${(fillRatio(scan)*100).toFixed(0)}%`)
    }
  }

  // ── Priority 2: Block containers (blockquote, pre, table) ────────────
  for (let scan = endIdx; scan > startIdx; scan--) {
    const tag = children[scan].tagName
    if (tag === 'BLOCKQUOTE' || tag === 'PRE' || tag === 'TABLE') {
      if (fillRatio(scan) >= 0.50) {
        console.log(`[findSemanticSplitPoint] Accepted Priority-2 boundary at ${scan} <${tag}>`)
        return scan
      }
      console.log(`[findSemanticSplitPoint] Skipped Priority-2 boundary at ${scan} <${tag}> — fillRatio too low`)
    }
  }

  // ── Priority 3: Paragraph-level elements (P, LI, DIV) ───────────────
  // 这些通常被接受，因为它们通常紧邻
  // overflow point — minimal waste.
  for (let scan = endIdx; scan > startIdx; scan--) {
    const tag = children[scan].tagName
    if (tag === 'P' || tag === 'LI' || tag === 'DIV') {
      // 🔧 FIX v4: Also check fill ratio for paragraph splits.
      //  If the page is extremely empty (< 35 %), keep looking for BR.
      if (fillRatio(scan) >= 0.35) {
        console.log(`[findSemanticSplitPoint] Found Priority-3 boundary at index ${scan}: <${tag}>`)
        return scan
      }
      console.log(`[findSemanticSplitPoint] Skipped Priority-3 at ${scan} — fill too low, trying lower priority`)
    }
  }

  // ── Priority 4: Line breaks (BR) ─────────────────────────────────────
  for (let scan = endIdx; scan > startIdx; scan--) {
    const el = children[scan]
    if (el.tagName === 'BR' || el.querySelectorAll('br').length > 0) {
      console.log(`[findSemanticSplitPoint] Found Priority-4 boundary at index ${scan}: BR detected`)
      return scan
    }
  }

  // ── Fallback: No semantic boundary found — split at endIdx ─────────
  console.warn(`[findSemanticSplitPoint] No semantic boundary found between ${startIdx} and ${endIdx}, fallback to hard split at ${endIdx}`)
  return endIdx
}

// ── 9d. noSplit──返回单页 ────────────────────────────────────────────

/**
 * 将完整 HTML 包装在单元素数组中返回。
 * 由长图文（noSplit）模式使用。
 */
export function noSplitPages(fullHtml: string): string[] {
  return [fullHtml || '<p></p>']
}

// ── Exports ─────────────────────────────────────────────────────────

export { md }