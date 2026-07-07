import MarkdownIt from 'markdown-it'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItContainer from 'markdown-it-container'
import { full as markdownItEmoji } from 'markdown-it-emoji'
import markdownItKatex from '@traptitech/markdown-it-katex'

// ── Minimal type interfaces ─────────────────────────────────────────
// We define only the properties / methods we actually use, avoiding
// the @types/markdown-it CJS namespace issue under ESNext module target.

/** Inline parsing state provided by markdown-it to each inline rule. */
interface InlineState {
  pos: number
  posMax: number
  src: string
  push(type: string, tag: string, nesting: number): Token
}

/** Token object from the markdown-it token stream. */
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

// ── Core instance ───────────────────────────────────────────────────

/** Shared markdown-it instance with all plugins registered. */
const md: MarkdownIt = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
})

// ── 1. markdown-it-attrs ────────────────────────────────────────────
md.use(markdownItAttrs)

// ── 2. markdown-it-container ────────────────────────────────────────
// Column layout containers: :::left / :::right / :::center

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

// ── 4. KaTeX ────────────────────────────────────────────────────────
md.use(markdownItKatex, { throwOnError: false, output: 'html' })

// ── 5. Mermaid fenced code → <div class="mermaid"> ──────────────────

const defaultFenceRenderer =
  md.renderer.rules.fence ||
  ((tokens, idx): string => {
    const token = tokens[idx]
    return `<pre><code>${md.utils.escapeHtml(token.content)}</code></pre>\n`
  })

md.renderer.rules.fence = (tokens, idx, options, env, self): string => {
  const token = tokens[idx]
  if (token.info.trim().toLowerCase() === 'mermaid') {
    // Include a min-height so the measurement engine accounts for the
    // diagram even before mermaid.run() renders it client-side.
    return `<div class="mermaid" style="min-height:180px">${md.utils.escapeHtml(token.content)}</div>\n`
  }
  return defaultFenceRenderer(tokens, idx, options, env, self)
}

// ── 6. ==highlight== custom inline plugin ────────────────────────────

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

// ── 7. ^underline^ custom inline plugin ─────────────────────────────

function underlineRule(state: InlineState, silent: boolean): boolean {
  const start = state.pos
  const marker = '^'

  // Need at least ^ + 1 char + ^
  if (start + 3 > state.posMax) return false
  if (state.src.charCodeAt(start) !== 0x5e) return false

  // Disallow when preceded by an alphanumeric — this guards against
  // accidental captures inside KaTeX math (e.g. x^2) where ^ is
  // a superscript, not an underline marker.
  if (start > 0) {
    const prevChar = state.src.charCodeAt(start - 1)
    const isAlphanumeric =
      (prevChar >= 0x30 && prevChar <= 0x39) ||
      (prevChar >= 0x41 && prevChar <= 0x5a) ||
      (prevChar >= 0x61 && prevChar <= 0x7a)
    if (isAlphanumeric) return false
  }

  // Find closing ^
  const contentStart = start + 1
  const closePos = state.src.indexOf(marker, contentStart)
  if (closePos === -1 || closePos === contentStart) return false

  // Disallow when closing ^ is immediately followed by an alphanumeric
  // (another KaTeX guard: ^2^3 is not underline).
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

// ── 8. Image size extension ─────────────────────────────────────────

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

// ── 9. Split utilities ──────────────────────────────────────────────


// ── 9a. splitPages (hrSplit) ────────────────────────────────────────

/**
 * Split by `---` horizontal-rule markers in the Markdown **source**.
 * Each segment is independently rendered through the full plugin pipeline.
 *
 * Matches md2card.cn hrSplit behaviour.
 */
export function splitPages(source: string): string[] {
  const segments = source.split('\n---\n')
  return segments.map((s) => md.render(s))
}

// ── 9b. splitByRenderedHR ────────────────────────────────────────────

/**
 * Split **already-rendered** HTML by `<hr>` tags.
 *
 * This mirrors md2card.cn's approach: `r.split("<hr>")` on the rendered
 * output.  Each chunk is wrapped in a `<div>` so `v-html` always sees a
 * single root node.
 */
export function splitByRenderedHR(renderedHTML: string): string[] {
  const chunks = renderedHTML.split('<hr>')
  return chunks.map((c) => `<div>${c}</div>`)
}

// ── 9c. autoSplitPages (小红书拆分) ──────────────────────────────────

/** Options for {@link autoSplitPages}. */
export interface AutoSplitOptions {
  cardWidth: number
  cardHeight: number
  cardPadding: number
  bodyFontSize: number
  theme: string
}

/** Reusable off-screen measuring container (singleton). */
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
    // 🔧 FIX v8: Apply transform: scale(0.95) to the measurement container
    //  so ALL getBoundingClientRect measurements are in visual coordinates
    //  that exactly match CardPreview's real rendering.  No more scale
    //  compensation math — everything is naturally consistent.
    //  IMPORTANT: Must match .preview-root :deep(.card-preview) transform
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
 * Intelligent page splitting — client-side equivalent of md2card.cn's
 * backend auto-split API.
 *
 * **How it works:**
 * 1. Render the full markdown source to HTML through markdown-it.
 * 2. Inject the HTML into an off-screen container styled identically
 *    to the real card (same width, padding, font, theme CSS variables).
 * 3. Walk the block-level children, accumulating their rendered heights.
 * 4. When cumulative height exceeds the card's content area, split
 *    **before** the overflowing element (preferring heading boundaries).
 * 5. Serialise each page's elements back to HTML via `outerHTML`.
 *
 * **Edge cases handled:**
 * - Content shorter than one card → single page returned.
 * - A single element taller than one card (e.g. large code block) →
 *   gets its own page (overflow is unavoidable).
 * - Empty input → returns `['<p></p>']`.
 *
 * @returns Array of HTML strings — never empty, never fewer than 1.
 */
export function autoSplitPages(
  fullHtml: string,
  options: AutoSplitOptions,
): string[] {
  const { cardWidth, cardHeight, cardPadding, bodyFontSize, theme } = options

  // ── Guards ────────────────────────────────────────────────────────
  if (!fullHtml || fullHtml.trim().length === 0) {
    return ['<p></p>']
  }

  // ── Measure ───────────────────────────────────────────────────────
  const container = getMeasureContainer(
    cardWidth,
    cardHeight,
    bodyFontSize,
    theme,
  )
  container.innerHTML = fullHtml

  // Derive the content area height from the container's actual computed
  // padding (set by the .card-preview CSS class as 2rem) rather than
  // relying on the caller's estimate.
  const computedStyle = window.getComputedStyle(container)
  const layoutPaddingTop = parseFloat(computedStyle.paddingTop) || cardPadding
  const layoutPaddingBottom = parseFloat(computedStyle.paddingBottom) || cardPadding

  // 🔧 FIX v5: Measurement container now has transform: scale(0.95).
  //  All getBoundingClientRect() values are in VISUAL coordinates.
  //  The visual content area = (cardHeight − padding) × scale.
  //  No more dual-height complexity — one contentHeight for everything.
  //
  //  Numbers for 小红书 440×586 (padding 2rem = 32 px each side):
  //    layout content area  = 586 − 64            = 522 px
  //    visual content area  = 522 × 0.95          = 496 px
  //    contentHeight        = 496 − 2             = 494 px

  const CARD_SCALE = 0.95 // matches CardPreview.vue & measure container transform
  const SUBPIXEL_BUFFER = 1

  const layoutContentHeight =
    cardHeight - layoutPaddingTop - layoutPaddingBottom

  /** Single content height in VISUAL coordinates (post-scale).
   *  Used for page accumulation, element splitting, and fill-then-split. */
  const contentHeight =
    layoutContentHeight * CARD_SCALE - SUBPIXEL_BUFFER

  if (contentHeight <= 0) {
    container.innerHTML = ''
    return [fullHtml]
  }

  const children = Array.from(container.children) as HTMLElement[]

  // If markdown-it produced no block elements (unlikely but defensive),
  // return the full HTML as a single page.
  if (children.length === 0) {
    container.innerHTML = ''
    return [fullHtml]
  }

  // ── Quick heuristic: total content height vs card content area ────
  // If the full content is clearly taller than one card but we only
  // have a few block elements, each might be oversized.  We still
  // rely on the measurement loop below for precise splitting, but
  // this guards against pathological cases where measurement returns
  // all zeros (e.g. container not yet laid out).
  const totalHeight =
    children.length > 0
      ? children[children.length - 1].getBoundingClientRect().bottom -
        children[0].getBoundingClientRect().top
      : 0

  // 🔧 Save pre-split state for the heuristic fallback in post-validation.
  // children[] and totalHeight are captured BEFORE pre-validation flattens
  // oversized elements so the fallback has the original element counts.
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
  // 🔧 STEP 1 — PRE-VALIDATION: check EACH child's individual height
  // against the card's content area BEFORE the accumulation loop.
  //
  // If any single child is taller than contentHeight, pre-split it via
  // splitOversizedBlock so the main loop only processes elements that
  // are guaranteed to individually fit within one page.  This fixes the
  // scenario where an oversized element in the MIDDLE of the children
  // array isn't caught until Case 2 pushes it to the next page — by
  // flattening oversized children upfront, every child's height ≤
  // contentHeight, making the accumulation loop's job straightforward.
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

      // Rebuild container with flattened children so the main loop
      // measures fresh DOM elements at correct coordinates.
      container.innerHTML = flatHTML.join('\n')
      const newChildren = Array.from(container.children) as HTMLElement[]
      children.length = 0
      for (const c of newChildren) children.push(c)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2 — MAIN SPLIT LOOP: accumulate children into pages.
  //
  // 🔧 FIX v3: Soft-split with semantic boundary detection.
  //
  // Key improvements:
  // 1. SAFETY_MARGIN: Trigger split at 92% of contentHeight (not 100%)
  //     → Prevents text from touching the card bottom edge
  //     → Provides visual breathing room (8% of card height as padding)
  //
  // 2. Semantic boundary priority (high → low):
  //     - H1-H6 / HR (natural section breaks)          [Priority 1]
  //     - BLOCKQUOTE / PRE / TABLE (block containers)   [Priority 2]
  //     - P / LI / DIV (paragraph-level elements)       [Priority 3]
  //     - BR (line breaks within text)                  [Priority 4]
  //
  // 3. Never cut in the middle of a word/sentence when possible.
  // ═══════════════════════════════════════════════════════════════════════

  /** Split at 99.9% of contentHeight — effectively no waste */
  const SAFE_HEIGHT_RATIO = 0.999
  const safeContentHeight = contentHeight * SAFE_HEIGHT_RATIO

  const pages: string[] = []
  let startIdx = 0

  for (let i = 0; i < children.length; i++) {
    const pageFirst = children[startIdx]
    const current = children[i]

    // Cumulative height from the first element of the current page
    // to the bottom of the current element.
    const pageHeight =
      current.getBoundingClientRect().bottom -
      pageFirst.getBoundingClientRect().top

    // ── Case 1: Oversized single element (defensive fallback) ───────
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

    // ── Case 2: Soft page overflow ──────────────────────────────────
    if (pageHeight > safeContentHeight && i > startIdx) {
      // ── Calculate how much space remains on the current page ──────
      //  Use children[i].top (NOT children[i-1].bottom) because the
      //  gap between elements includes collapsed margins (P tags have
      //  margin-bottom:1em).  children[i].top is the actual rendering
      //  position where the fill-chunk will be placed.
      //
      //  🔧 FIX: Both cardHeight/layoutPaddingBottom and
      //  getBoundingClientRect().top are now in VISUAL coordinates
      //  (the measurement container has transform: scale(0.95)).
      //  Apply CARD_SCALE to layout values to match.
      //
      //  🔧 FIX v11: contentAreaBottom should be the bottom of the content
      //  area measured from the container's top edge.  The content area
      //  starts at layoutPaddingTop * CARD_SCALE and has height contentHeight.
      //  So contentAreaBottom = layoutPaddingTop * CARD_SCALE + contentHeight.
      const contentAreaBottom =
        layoutPaddingTop * CARD_SCALE + contentHeight
      const overflowTop =
        children[i].getBoundingClientRect().top
      // 🔧 FIX v11: Remove SUBPIXEL_BUFFER from remainingSpace calculation.
      //  The splitBlockByDOM function already has its own PROBE_TOLERANCE,
      //  so we don't need to be conservative here.  Give it the full
      //  remaining space to maximize card fill.
      const remainingSpace =
        contentAreaBottom - overflowTop

      // ── FIX v4: Fill-then-split — if the overflowing element is a
      //    paragraph or heading AND there's significant remaining space,
      //    split the element ITSELF so the first chunk fills the current
      //    page and the rest starts the next page.  This eliminates the
      //    "half-empty card" problem where a large paragraph gets pushed
      //    entirely to the next page.
      const overflowTag = children[i].tagName
      // 🔧 FIX v8: Lower the MIN_FILL_THRESHOLD to 0.5% to allow
      //  splitting even for tiny remaining spaces.  This ensures
      //  we ALWAYS try to fill the card when there's any space left.
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
          // Current page = accumulated elements + first chunk
          const baseHTML = serializeElements(children, startIdx, i)
          pages.push(baseHTML + '\n' + chunks[0])
          console.log(
            `[autoSplitPages] Fill-split: filled ${remainingSpace.toFixed(0)}px ` +
            `remaining space with partial <${overflowTag}> (${chunks.length} chunk(s))`,
          )

          if (chunks.length > 1) {
            // Rebuild children: remaining chunks + everything after i
            const afterHTML = serializeElements(children, i + 1, children.length)
            const restHTML =
              chunks.slice(1).join('\n') +
              (afterHTML ? '\n' + afterHTML : '')
            container.innerHTML = restHTML
            const rebuilt = Array.from(container.children) as HTMLElement[]
            children.length = 0
            for (const c of rebuilt) children.push(c)
            startIdx = 0
            i = -1 // restart loop
            continue
          }

          // Single chunk — the whole element fits; move past it
          startIdx = i + 1
          continue
        }
      }

      // ── Fallback: semantic split at block boundary ───────────────
      let splitAt = findSemanticSplitPoint(children, startIdx, i, contentHeight)

      if (splitAt > startIdx && splitAt <= i) {
        pages.push(serializeElements(children, startIdx, splitAt))
        startIdx = splitAt
        i = splitAt - 1
        continue
      }

      // Last resort: split at current element boundary
      pages.push(serializeElements(children, startIdx, i))
      startIdx = i
      i = i - 1
      continue
    }
  }

  // ── Remaining elements form the last page ─────────────────────────
  if (startIdx < children.length) {
    pages.push(serializeElements(children, startIdx, children.length))
  }

  // ── Cleanup & post-validate ───────────────────────────────────────
  container.innerHTML = ''
  return _postValidateAndReturn(pages, fullHtml, container, contentHeight, SUBPIXEL_BUFFER, options, _preTotalHeight, _preChildCount, _preChildrenTags)
}

/**
 * 🔧 Post-validate generated pages and apply heuristic fallback.
 *
 * **Post-validation**: For multi-page results, re-measure each page in the
 * container.  If any page's content height exceeds `contentHeight`,
 * recursively re-split it via autoSplitPages (with depth guard).
 *
 * **Heuristic fallback**: If only 1 page was produced but the pre-split
 * total height clearly exceeds one card, force-split by distributing
 * elements evenly.  This catches edge cases where measurement fails
 * (e.g. container not laid out, font not loaded).
 *
 * @returns Final validated page array — never empty.
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
  // Heuristic fallback: 1 page but content clearly exceeds card height
  // ═════════════════════════════════════════════════════════════════════
  if (rawPages.length === 1 && preChildCount > 1 && preTotalHeight > contentHeight * 1.2) {
    // Parse the single page back into children for redistribution
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
  // Post-validation: re-measure each page — re-split if it overflows
  // ═════════════════════════════════════════════════════════════════════
  if (rawPages.length <= 1) {
    container.innerHTML = ''
    return rawPages
  }

  const validated: string[] = []
  const MAX_DEPTH = 3 // prevent infinite recursion in pathological cases

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
        // Fits — keep.
        validated.push(pageHTML)
      } else {
        // Overflows — recursively re-split this page.
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
          // Can't split further — keep as-is (better than losing content).
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
 * 🔧 Recursively split a single block element that is taller than the
 * card's content area.
 *
 * **IMPORTANT**: This function is READ-ONLY — it does NOT mutate the
 * container DOM.  It only reads measurements via getBoundingClientRect.
 * This ensures the caller's element references stay valid.
 *
 * Supported element types:
 * - UL / OL → split by <li> children
 * - BLOCKQUOTE → split by block children
 * - PRE → split by newline-delimited lines
 * - DIV → split by block children
 *
 * For any other element type, returns `[el.outerHTML]`.
 */
function splitOversizedBlock(
  el: HTMLElement,
  contentHeight: number,
): string[] {
  const tag = el.tagName

  // ── UL / OL → split at LI boundaries ──────────────────────────────
  if (tag === 'UL' || tag === 'OL') {
    const items = Array.from(el.children) as HTMLElement[]
    if (items.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const groups: string[] = []
    let groupStart = 0
    // 🔧 FIX: use `let` so we can update the reference on each split.
    let firstItem: HTMLElement = items[0]

    for (let j = 0; j < items.length; j++) {
      const h =
        items[j].getBoundingClientRect().bottom -
        firstItem.getBoundingClientRect().top

      if (h > contentHeight && j > groupStart) {
        // Items groupStart … j-1 fit in one page.
        groups.push(wrapChildren(wrapperAttrs, items, groupStart, j))
        groupStart = j
        // 🔧 FIX: update firstItem to the first element of the new group
        // so measurements are relative to the new group's top.
        firstItem = items[j]
      }
    }

    // Remaining items form the last group.
    if (groupStart < items.length) {
      groups.push(wrapChildren(wrapperAttrs, items, groupStart, items.length))
    }

    return groups.length > 0 ? groups : [el.outerHTML]
  }

  // ── BLOCKQUOTE → split at block-child boundaries ───────────────────
  if (tag === 'BLOCKQUOTE') {
    const kids = Array.from(el.children) as HTMLElement[]
    if (kids.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const groups = groupChildrenByHeight(kids, contentHeight)

    return groups.map((g) => `<${tag}${wrapperAttrs} style="width:100%;display:block;">\n${g}\n</${tag}>`)
  }

  // ── PRE → split by approximate line count ─────────────────────────
  if (tag === 'PRE') {
    const text = el.textContent || ''
    const lines = text.split('\n')
    if (lines.length <= 1) return [el.outerHTML]

    const wrapperAttrs = extractElementAttrs(el)
    const codeEl = el.querySelector('code')
    const codeAttrs = codeEl ? extractElementAttrs(codeEl) : ''

    // Estimate line height from the pre's computed style.
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

  // ── DIV (container columns, etc.) → split by block children ──────
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

  // ── P / H1-H6 → DOM-measured split ──────────────────────────────────
  // 🔧 FIX v2: Replaced char-count estimation (avgCharWidth = fontSize*0.55)
  // with actual DOM measurement via binary search + getBoundingClientRect.
  // The old estimation was calibrated for Latin text (~0.5em avg width) and
  // systematically overestimated chars-per-page for CJK text (~1em width),
  // causing splitOversizedBlock to return unsplit content that overflowed
  // the card container.  Range API preserves inline formatting (bold, italic,
  // links, code spans, etc.) through the split.
  if (tag === 'P' || /^H[1-6]$/.test(tag)) {
    return splitBlockByDOM(el, contentHeight)
  }

  // ── Generic block-level fallback ────────────────────────────────────
  // 🔧 FIX v2: Use DOM measurement for any other oversized block element.
  // Falls back to el.outerHTML on error (defensive).
  const text = el.textContent || ''
  if (text.length > 1) {
    try {
      return splitBlockByDOM(el, contentHeight)
    } catch (e) {
      console.warn('[splitOversizedBlock] DOM split failed for', tag, e)
    }
  }

  // ── Truly unsplittable element (empty, single-char, etc.) ──────────
  return [el.outerHTML]
}

/**
 * 🔧 FIX v3: Group an array of block-level children into sub-arrays that
 * each fit within `contentHeight` with semantic boundary awareness.
 *
 * **Improvements over v2:**
 * - Uses safeContentHeight (92% of actual) for early splitting
 * - Calls findSemanticSplitPoint() instead of hard-cutting at overflow point
 * - Prevents paragraphs/elements from being split across groups awkwardly
 *
 * READ-ONLY — no DOM mutation.
 *
 * @param children      Array of block-level elements to group
 * @param contentHeight Maximum allowed height per group
 * @returns             Array of HTML strings (one per group)
 */
function groupChildrenByHeight(
  children: HTMLElement[],
  contentHeight: number,
): string[] {
  if (children.length === 0) return []

  /** Safety margin: trigger grouping at 99.9% height — effectively no waste */
  const SAFE_HEIGHT_RATIO = 0.999
  const safeContentHeight = contentHeight * SAFE_HEIGHT_RATIO

  const groups: string[] = []
  let groupStart = 0
  let firstChild: HTMLElement = children[0]

  for (let i = 0; i < children.length; i++) {
    const h =
      children[i].getBoundingClientRect().bottom -
      firstChild.getBoundingClientRect().top

    // 🔧 FIX v3: Use safeContentHeight and semantic boundary detection
    if (h > safeContentHeight && i > groupStart) {
      const splitAt = findSemanticSplitPoint(children, groupStart, i, contentHeight)

      if (splitAt > groupStart && splitAt <= i) {
        groups.push(serializeElements(children, groupStart, splitAt))
        groupStart = splitAt
        firstChild = children[splitAt]
        i = splitAt - 1 // Re-evaluate from the new start
        continue
      }

      // Fallback: hard split at current element
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
 * Extract all attributes from an element as a string suitable for
 * inserting into an opening HTML tag.  Returns '' or ' attr="value"…'.
 */
function extractElementAttrs(el: HTMLElement): string {
  const parts: string[] = []
  for (const attr of Array.from(el.attributes)) {
    // Skip attributes that are internal or would be duplicated.
    if (attr.name === 'style') continue // style varies per clone
    parts.push(`${attr.name}="${escapeAttr(attr.value)}"`)
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : ''
}

/**
 * 🔧 FIX v3: Split a block-level text element (P, H1-H6, or generic block)
 * that is taller than the card's content area into page-sized chunks using
 * actual DOM measurement with semantic boundary awareness.
 *
 * **Why DOM measurement instead of character estimation:**
 * The old approach (`avgCharWidth = fontSize * 0.55`) fails for:
 * - CJK / full-width text (characters are ~1 em wide, not ~0.55 em)
 * - Mixed Latin + CJK content
 * - Variable-width fonts where the true average varies per text sample
 * - Text with inline formatting that changes effective character density
 *
 * **🔧 NEW in v3: Semantic boundary detection to prevent hard cuts**
 *
 * After binary search finds the maximum fitting offset, we **rewind** to
 * the nearest sentence/word boundary to avoid cutting words in half.
 *
 * **Boundary priority (highest → lowest):**
 * 1. Sentence endings: 。！？.!?\n (CJK + Latin punctuation)
 * 2. Clause separators: ，,；;：: (commas, semicolons)
 * 3. Word boundaries: spaces, hyphens, CJK character transitions
 *
 * **Algorithm (per page):**
 * 1. Binary search on text positions [lo, hi] to find the raw max offset
 * 2. Rewind to nearest sentence/word boundary (semantic cleanup)
 * 3. Use Range API to extract innerHTML preserving inline formatting
 * 4. Repeat until the whole element is consumed
 *
 * @returns Array of HTML strings, each wrapped in the original element tag
 *          with the original attributes.  Never empty.
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

  // ── Build lightweight test element for binary-search measurements ──
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
  
  // 🔧 FIX v11: CRITICAL — The measurement container has transform: scale(0.95).
  //  This means getBoundingClientRect() returns VISUAL (scaled) coordinates,
  //  but getComputedStyle() returns LAYOUT (unscaled) values.
  //
  //  For the test element to have IDENTICAL text wrapping behavior as the
  //  original element, we need to match its ACTUAL rendered width.
  //
  //  Since both testEl and el are in the SAME scaled container, they both
  //  get scaled by 0.95.  So we should use the SAME width source for both.
  //  Using getComputedStyle().width ensures testEl has the same LAYOUT width
  //  as el, which after scaling gives identical visual width and text wrapping.
  testEl.style.width = elStyle.width
  testEl.style.display = 'block'

  // DEBUG: Log measurement details
  console.log('[splitBlockByDOM] Test element setup', {
    tag,
    computedWidth: elStyle.width,
    boundingWidth: el.getBoundingClientRect().width,
    contentHeight,
    textLength: fullText.length,
  })

  // 🔧 FIX: Zero out margins for the test element during measurement.
  // The binary search measures pure text height; margins are accounted
  // for separately by the main loop's getBoundingClientRect().bottom -
  // getBoundingClientRect().top calculation.  Including margins here
  // would double-count them and cause premature splitting.
  testEl.style.marginTop = '0px'
  testEl.style.marginBottom = '0px'

  const pages: string[] = []
  let textStart = 0

  // ── Safety guards against pathological infinite loops ──────────────
  let safetyCounter = 0
  const MAX_PAGES = 500

  while (textStart < fullText.length && safetyCounter < MAX_PAGES) {
    safetyCounter++

    // ── Step 1: Binary search for raw max offset ─────────────────────
    let lo = textStart + 1
    let hi = fullText.length
    let bestEnd = textStart + 1

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      testEl.textContent = fullText.slice(textStart, mid)
      measureParent.appendChild(testEl)
      const measuredH = testEl.getBoundingClientRect().height
      measureParent.removeChild(testEl)

      // Allow small tolerance in binary search to be more aggressive
      if (measuredH <= contentHeight + 0.5) {
        bestEnd = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    // 🔧 FIX v10: Ultra-aggressive probing to maximize card fill.
    //  After binary search, keep adding characters until we're absolutely
    //  sure no more can fit.  Use a generous tolerance (2px) to account
    //  for subpixel rendering differences.
    if (bestEnd < fullText.length) {
      const PROBE_TOLERANCE = 2
      let probe = bestEnd
      
      // Keep probing until we find a height that exceeds the limit
      while (probe < fullText.length) {
        testEl.textContent = fullText.slice(textStart, probe + 1)
        measureParent.appendChild(testEl)
        const probeH = testEl.getBoundingClientRect().height
        measureParent.removeChild(testEl)
        
        // If it fits (with tolerance), keep going
        if (probeH <= contentHeight + PROBE_TOLERANCE) {
          bestEnd = probe + 1
          probe++
        } else {
          // Doesn't fit - stop probing
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

    // ── Step 2: 🔧 FIX v3 — Rewind to semantic boundary ─────────────
    // After finding the raw character limit, backtrack to avoid cutting
    // words/sentences in half. This prevents "硬切割" (hard cuts).
    const semanticEnd = findNearestSemanticBoundary(fullText, textStart, bestEnd)

    if (semanticEnd < bestEnd) {
      console.log(`[splitBlockByDOM] Semantic rewind: ${bestEnd} → ${semanticEnd} (${bestEnd - semanticEnd} chars saved from hard cut)`)
    }

    // ── Step 3: Extract HTML preserving inline formatting ────────────
    const pageInnerHTML = extractHTMLForTextRange(el, textStart, semanticEnd)
    // 🔧 FIX v9: Remove the width:100% override.  The original element's
    //  width is determined by the card's padding and CSS.  Forcing
    //  width:100% can cause the p tag to be wider than the content area,
    //  changing text wrapping behavior from what was measured.
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
 * 🔧 FIX v3: Find the nearest semantic boundary before `rawEnd`.
 *
 * Scans backwards from `rawEnd` to find a "natural" cut point that
 * doesn't split words or sentences awkwardly.
 *
 * **Boundary patterns** (checked in order of preference):
 *
 * | Pattern | Description                          | Example         |
 * |---------|--------------------------------------|------------------|
 * | 。！？.!?\n | Sentence endings (CJK + Latin)     | "Hello."        |
 * | ，,；: | Clause separators                    | "Hello, world"  |
 * | \s      | Word spaces                          | "Hello world"   |
 * | -       | Hyphens (safe break point)           | "state-of-the-art" |
 *
 * **Special handling for CJK text:**
 * Each CJK character is a logical unit, so we can safely cut between any
 * two CJK characters without breaking "words" (CJK doesn't use spaces).
 *
 * @param text     Full text being split
 * @param start    Current page start offset (exclusive lower bound)
 * @param rawEnd   Raw end offset from binary search (may be mid-word)
 * @returns        Adjusted end offset at nearest semantic boundary ≥ start+1
 */
function findNearestSemanticBoundary(
  text: string,
  start: number,
  rawEnd: number,
): number {
  // Must keep at least 1 character
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
  // Safe to cut between a CJK char and a non-CJK char (or vice versa)
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
 * Extract the innerHTML of `el` corresponding to the plain-text character
 * range [startOffset, endOffset), preserving all inline formatting.
 *
 * Uses TreeWalker to locate text nodes inside a deep clone, then
 * Range.cloneContents() so that inline tags (<strong>, <em>, <a>, <code>,
 * etc.) straddling the boundary are correctly opened/closed in the output.
 *
 * @param el          The source element (not mutated — we clone it).
 * @param startOffset Character offset into el.textContent.
 * @param endOffset   Character offset into el.textContent (exclusive).
 * @returns           Inner HTML string for the slice.
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

  // If we couldn't locate the text nodes (shouldn't happen), fall back to
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

/** Wrap a slice of children in a clone of the parent tag. */
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

/** Minimal HTML escaping for text content inside <pre> splits. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escape an HTML attribute value. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Serialise a slice of DOM elements to an HTML string. */
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
   * Return the fraction of contentHeight that elements [startIdx, splitAt)
   * would fill.  Used to reject split points that leave the page too empty.
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
  // These are always accepted because they're typically adjacent to the
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
 * Return the full HTML wrapped in a single-element array.
 * Used by the 长图文 (noSplit) mode.
 */
export function noSplitPages(fullHtml: string): string[] {
  return [fullHtml || '<p></p>']
}

// ── Exports ─────────────────────────────────────────────────────────

export { md }