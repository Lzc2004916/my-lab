// ═══════════════════════════════════════════════════════════════════════════
// Blockquote 解析单元测试
// 验证引用块（`>` 开头）在缺失空行分隔、多行、紧邻正文等场景下，
// 都能被正确识别为独立引用块（修复「引用效果必须手动换行才展示」）。
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest'
import { parseInputBlocks } from '../layout'

const kinds = (md: string) => parseInputBlocks(md).map((b) => b.kind)
const quotes = (md: string) =>
  parseInputBlocks(md)
    .filter((b) => b.kind === 'quote')
    .map((b) => (b as any).raw as string)

describe('blockquote parsing', () => {
  it('standalone single quote → quote block', () => {
    expect(kinds('> 这是引用')).toEqual(['quote'])
    expect(quotes('> 这是引用')).toEqual(['这是引用'])
  })

  it('quote following body text with only a single newline (no blank line) is still a quote', () => {
    // 回归：此前会被合并进正文块而丢失引用样式
    const md = '一段正文\n> 紧跟的引用'
    expect(kinds(md)).toEqual(['body', 'quote'])
    expect(quotes(md)).toEqual(['紧跟的引用'])
  })

  it('quote before body text with only a single newline is still a quote', () => {
    const md = '> 前置引用\n一段正文'
    expect(kinds(md)).toEqual(['quote', 'body'])
    expect(quotes(md)).toEqual(['前置引用'])
  })

  it('multi-line consecutive quote → single quote block with joined raw', () => {
    const md = '> 第一行\n> 第二行\n> 第三行'
    const blocks = parseInputBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]!.kind).toBe('quote')
    expect((blocks[0] as any).raw).toBe('第一行\n第二行\n第三行')
  })

  it('blank-line separated quote still works', () => {
    const md = '一段正文\n\n> 引用\n\n另一段'
    expect(kinds(md)).toEqual(['body', 'quote', 'body'])
  })

  it('quote interleaved with heading and body', () => {
    const md = '正文\n# 标题\n> 引用\n更多正文'
    expect(kinds(md)).toEqual(['body', 'subheading', 'quote', 'body'])
  })

  it('quote then ordered list keeps both as separate blocks', () => {
    const md = '> 引言\n1. 第一项\n2. 第二项'
    expect(kinds(md)).toEqual(['quote', 'orderedList'])
  })
})
