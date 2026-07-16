// ═══════════════════════════════════════════════════════════════════════════
// useSearch — Markdown 内容搜索 composable
// ═══════════════════════════════════════════════════════════════════════════
//
// 提供在 Markdown 源文本中搜索关键词的能力，支持：
//   - 仅搜索文本内容（忽略 Markdown 语法标记）
//   - 原始文本搜索（包含 Markdown 语法）
//   - 大小写敏感/不敏感切换
//   - 多匹配项遍历（上一个/下一个）
//
// 使用示例：
//   const search = useSearch()
//   search.search('关键词', sourceText, { contentOnly: true })
//   search.next()   // 跳转到下一个匹配
//   search.prev()   // 跳转到上一个匹配
//   search.clear()  // 清除搜索
//

import { ref, computed, type Ref, type ComputedRef } from 'vue'

// ── Types ───────────────────────────────────────────────────────────────

export interface SearchMatch {
  /** 匹配在原始源文本中的起始位置（0-based 字符偏移）。 */
  from: number
  /** 匹配在原始源文本中的结束位置（0-based 字符偏移，不包含）。 */
  to: number
  /** 匹配在"内容视图"中的起始位置（contentOnly 模式下有效）。 */
  contentFrom: number
  /** 匹配在"内容视图"中的结束位置（contentOnly 模式下有效）。 */
  contentTo: number
  /** 匹配的文本（源文本中的原始文本）。 */
  text: string
}

export interface SearchOptions {
  /** 是否仅搜索文本内容（忽略 Markdown 语法标记）。默认 true。 */
  contentOnly?: boolean
  /** 是否大小写敏感。默认 false（不区分大小写）。 */
  caseSensitive?: boolean
}

export interface SearchState {
  /** 当前搜索关键词。 */
  query: Ref<string>
  /** 当前激活的匹配项索引（0-based，-1 表示无激活项）。 */
  activeIndex: Ref<number>
  /** 所有匹配项列表。 */
  matches: Ref<SearchMatch[]>
  /** 搜索选项。 */
  options: Ref<SearchOptions>
  /** 匹配总数。 */
  total: ComputedRef<number>
  /** 是否有匹配项。 */
  hasMatches: ComputedRef<boolean>
}

export interface UseSearchReturn extends SearchState {
  /** 执行搜索 */
  search: (query: string, source: string, options?: SearchOptions) => void
  /** 跳转到下一个匹配项 */
  next: () => SearchMatch | null
  /** 跳转到上一个匹配项 */
  prev: () => SearchMatch | null
  /** 清除搜索状态 */
  clear: () => void
}

// ── Markdown syntax stripping ───────────────────────────────────────────

/**
 * 内容视图构建结果。
 */
export interface ContentViewResult {
  /** 内容视图字符串（markdown 语法被空格替换，与原字符串等长）。 */
  view: string
  /** 每个位置的屏蔽标记（true = 该位置是 markdown 语法，已被屏蔽）。 */
  mask: boolean[]
}

/**
 * 从 Markdown 源文本构建"内容视图"。
 * 将 Markdown 语法标记替换为等长的空格，从而在保留原始位置映射的同时
 * 实现纯内容的搜索。
 *
 * 处理的语法：
 *   - 标题前缀 `#{1,6} `
 *   - 粗体 `**text**` / `__text__`
 *   - 斜体 `*text*` / `_text_`
 *   - 删除线 `~~text~~`
 *   - 高亮 `==text==`
 *   - 下划线 `^text^`
 *   - 行内代码 `` `code` ``
 *   - 链接 `[text](url)` / `![alt](url)`
 *   - 图片 `![alt](url)`
 *   - 代码块（``` 围栏及其内容）
 *   - 引用前缀 `> `
 *   - 列表标记 `- ` / `* ` / `+ ` / `1. `
 *   - 水平线 `---` / `***` / `___`
 *   - HTML 标签 `<tag>`
 */
export function buildContentView(source: string): ContentViewResult {
  // 使用字符数组以便高效替换
  const chars = source.split('')
  const mask = new Array<boolean>(chars.length).fill(false)

  // Helper: 标记一个范围为被屏蔽（masked）
  function maskRange(from: number, to: number): void {
    for (let i = from; i < to && i < mask.length; i++) {
      mask[i] = true
    }
  }

  // Helper: 检查某个位置是否已被屏蔽
  function isMasked(pos: number): boolean {
    return pos < mask.length && mask[pos]
  }

  // 1. 代码块（``` 围栏）— 先处理以避免内部模式干扰
  const fenceRe = /^```[\s\S]*?^```/gm
  for (const m of source.matchAll(fenceRe)) {
    if (m.index !== undefined) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 2. 行内代码 `` `code` ``
  const inlineCodeRe = /`[^`\n]+`/g
  for (const m of source.matchAll(inlineCodeRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 3. 图片 ![...](...) — 必须在链接之前处理（共享后缀语法）
  const imageRe = /!\[([^\]]*)\]\([^)]+\)/g
  for (const m of source.matchAll(imageRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 4. 链接 [text](url)
  const linkRe = /\[([^\]]*)\]\([^)]+\)/g
  for (const m of source.matchAll(linkRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      // 仅屏蔽语法部分：[...] 和 (url)，保留链接文本
      const fullMatch = m[0]
      const textPart = m[1]
      const textStart = fullMatch.indexOf('[')
      const textEnd = textStart + textPart.length + 1 // +1 for '['
      // 屏蔽 [ 和 ](url) 部分
      maskRange(m.index, m.index + textStart + 1) // leading [
      maskRange(m.index + textEnd, m.index + fullMatch.length) // ](url)
    }
  }

  // 5. 粗体 **text** / __text__
  const boldRe = /\*\*([^*\n]+?)\*\*|__([^_\n]+?)__/g
  for (const m of source.matchAll(boldRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      const full = m[0]
      const inner = m[1] ?? m[2]
      const innerStart = full.indexOf(inner)
      // 屏蔽 ** 或 __ 标记
      maskRange(m.index, m.index + innerStart)
      maskRange(m.index + innerStart + inner.length, m.index + full.length)
    }
  }

  // 6. 斜体 *text* / _text_（非双字符标记，且不在单词内部）
  const italicRe = /(?<!\*)\*([^*\n]+?)\*(?!\*)|(?<!_)_([^_\n]+?)_(?!_)/g
  for (const m of source.matchAll(italicRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      const full = m[0]
      const inner = m[1] ?? m[2]
      const innerStart = full.indexOf(inner)
      maskRange(m.index, m.index + innerStart)
      maskRange(m.index + innerStart + inner.length, m.index + full.length)
    }
  }

  // 7. 删除线 ~~text~~
  const strikethroughRe = /~~([^\n]+?)~~/g
  for (const m of source.matchAll(strikethroughRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      const full = m[0]
      const inner = m[1]
      const innerStart = full.indexOf(inner)
      maskRange(m.index, m.index + innerStart)
      maskRange(m.index + innerStart + inner.length, m.index + full.length)
    }
  }

  // 8. 高亮 ==text==
  const markRe = /==([^\n]+?)==/g
  for (const m of source.matchAll(markRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      const full = m[0]
      const inner = m[1]
      const innerStart = full.indexOf(inner)
      maskRange(m.index, m.index + innerStart)
      maskRange(m.index + innerStart + inner.length, m.index + full.length)
    }
  }

  // 9. 下划线 ^text^
  const underlineRe = /\^([^^\n]+?)\^/g
  for (const m of source.matchAll(underlineRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      const full = m[0]
      const inner = m[1]
      const innerStart = full.indexOf(inner)
      maskRange(m.index, m.index + innerStart)
      maskRange(m.index + innerStart + inner.length, m.index + full.length)
    }
  }

  // 10. 标题前缀 `#{1,6} `（行首）
  const headingRe = /^#{1,6}\s/gm
  for (const m of source.matchAll(headingRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 11. 引用前缀 `> `（行首，支持多层嵌套）
  const quoteRe = /^>\s?/gm
  for (const m of source.matchAll(quoteRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 12. 无序列表前缀 `- ` / `* ` / `+ `（行首）
  const ulRe = /^[\s]*[-*+]\s/gm
  for (const m of source.matchAll(ulRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 13. 有序列表前缀 `1. ` / `1) `（行首）
  const olRe = /^[\s]*\d+[.)]\s/gm
  for (const m of source.matchAll(olRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 14. 水平线 --- / *** / ___（单独一行）
  const hrRe = /^[-*_]{3,}\s*$/gm
  for (const m of source.matchAll(hrRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 15. HTML 标签
  const htmlRe = /<\/?[a-zA-Z][^>]*>/g
  for (const m of source.matchAll(htmlRe)) {
    if (m.index !== undefined && !isMasked(m.index)) {
      maskRange(m.index, m.index + m[0].length)
    }
  }

  // 构建内容视图：将屏蔽字符替换为空格
  let result = ''
  for (let i = 0; i < chars.length; i++) {
    result += mask[i] ? ' ' : chars[i]
  }
  return { view: result, mask }
}

/**
 * 将内容视图中的位置映射回原始源文本中的位置。
 * 跳过被屏蔽（masked）的字符。
 *
 * @param contentPos - 内容视图中的字符索引
 * @param mask - 屏蔽标记数组（true = 该位置是 markdown 语法）
 * @returns 源文本中对应的位置
 */
export function mapContentToSource(contentPos: number, mask: boolean[]): number {
  // 内容视图中的位置已经与源文本位置一一对应（等长字符串）
  // 因为屏蔽字符被替换为空格，所以索引本身就是对齐的
  return Math.min(contentPos, mask.length)
}

/**
 * 在内容视图中查找匹配后，将内容视图位置映射到源文本范围。
 * 处理内容视图中的空格（屏蔽字符）与源文本字符不对齐的情况。
 *
 * @param contentFrom - 内容视图匹配起始位置
 * @param contentTo - 内容视图匹配结束位置
 * @param mask - 屏蔽标记数组
 * @param source - 原始源文本
 * @returns 源文本中的实际范围
 */
export function mapContentRangeToSource(
  contentFrom: number,
  contentTo: number,
  mask: boolean[],
  source: string,
): { from: number; to: number; text: string } {
  let from = contentFrom
  let to = contentTo

  // 确保 from 不在屏蔽区域内 — 向前调整
  while (from < mask.length && mask[from]) from++
  // 确保 to 不在屏蔽区域内 — 向前调整
  while (to < mask.length && mask[to]) to++

  // 收紧范围到非屏蔽区域
  // from: 找到第一个非屏蔽字符
  while (from < to && mask[from]) from++
  // to: 从后往前找到最后一个非屏蔽字符
  while (to > from && mask[to - 1]) to--

  return {
    from: Math.min(from, source.length),
    to: Math.min(to, source.length),
    text: source.slice(Math.min(from, source.length), Math.min(to, source.length)),
  }
}

// ── Search composable ───────────────────────────────────────────────────

export function useSearch(): UseSearchReturn {
  const query = ref('')
  const activeIndex = ref(-1)
  const matches = ref<SearchMatch[]>([])
  const options = ref<SearchOptions>({
    contentOnly: true,
    caseSensitive: false,
  })

  // 缓存最近一次搜索的源文本和内容视图，避免重复构建
  let lastSource = ''
  let lastContentView = ''
  let lastMask: boolean[] = []

  const total = computed(() => matches.value.length)
  const hasMatches = computed(() => matches.value.length > 0)

  /**
   * 在当前源文本中搜索 query。自动更新 matches 和 activeIndex。
   */
  function search(
    searchQuery: string,
    source: string,
    searchOpts?: SearchOptions,
  ): void {
    const opts = { ...options.value, ...searchOpts }
    query.value = searchQuery

    if (!searchQuery || !source) {
      matches.value = []
      activeIndex.value = -1
      return
    }

    // 构建内容视图（仅在 contentOnly 模式且源文本变更时）
    if (opts.contentOnly && source !== lastSource) {
      const result = buildContentView(source)
      lastContentView = result.view
      lastMask = result.mask
      lastSource = source
    }

    const searchText = opts.contentOnly ? lastContentView : source
    const flags = opts.caseSensitive ? 'g' : 'gi'
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedQuery, flags)

    const results: SearchMatch[] = []
    for (const m of searchText.matchAll(regex)) {
      const contentFrom = m.index!
      const contentTo = contentFrom + m[0].length

      if (opts.contentOnly) {
        // 将内容视图位置映射回源文本位置
        const mapped = mapContentRangeToSource(contentFrom, contentTo, lastMask, source)
        results.push({
          from: mapped.from,
          to: mapped.to,
          contentFrom,
          contentTo,
          text: mapped.text || m[0],
        })
      } else {
        results.push({
          from: contentFrom,
          to: contentTo,
          contentFrom,
          contentTo,
          text: m[0],
        })
      }
    }

    matches.value = results
    activeIndex.value = results.length > 0 ? 0 : -1
  }

  /**
   * 跳转到下一个匹配项（循环）。
   */
  function next(): SearchMatch | null {
    if (matches.value.length === 0) return null
    activeIndex.value = (activeIndex.value + 1) % matches.value.length
    return matches.value[activeIndex.value] ?? null
  }

  /**
   * 跳转到上一个匹配项（循环）。
   */
  function prev(): SearchMatch | null {
    if (matches.value.length === 0) return null
    activeIndex.value =
      activeIndex.value <= 0
        ? matches.value.length - 1
        : activeIndex.value - 1
    return matches.value[activeIndex.value] ?? null
  }

  /**
   * 清除所有搜索状态。
   */
  function clear(): void {
    query.value = ''
    activeIndex.value = -1
    matches.value = []
    lastSource = ''
    lastContentView = ''
    lastMask = []
  }

  return {
    query,
    activeIndex,
    matches,
    options,
    total,
    hasMatches,
    search,
    next,
    prev,
    clear,
  }
}
