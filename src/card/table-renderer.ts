// ═══════════════════════════════════════════════════════════════════════════
// CardPreview — 表格块渲染器
// ═══════════════════════════════════════════════════════════════════════════

import type { ThemeDefinition, TableDisplayBlock } from './types'
import { CONTENT_WIDTH, BODY_FONT_FAMILY, BODY_TEXT_WEIGHT, BODY_BOLD_WEIGHT } from './types'
import { parseInlineMarkdown, wrapInlineTokensByWidth, getBodyTokenWidth } from './measure'

// ═══════════════════════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════════════════════

const CELL_PADDING_X = 10
const CELL_PADDING_Y = 8
const MIN_COL_WIDTH = 60
const HEADER_SEP_HEIGHT = 3
const BORDER_WIDTH = 0.8
const OUTER_BORDER_WIDTH = 1.2

// ═══════════════════════════════════════════════════════════════════════════
// 测量
// ═══════════════════════════════════════════════════════════════════════════

/** 计算表格的列宽、行高和总尺寸。 */
export function measureTableBlock(
  block: TableDisplayBlock,
  fontSize: number,
  lineHeight: number,
  fontFamily?: string,
): { colWidths: number[]; rowHeights: number[]; totalWidth: number; totalHeight: number } {
  const numCols = block.headers.length
  if (numCols === 0) {
    return { colWidths: [], rowHeights: [], totalWidth: CONTENT_WIDTH, totalHeight: 40 }
  }

  // 测量每列的文本宽度
  const allRows = [block.headers, ...block.rows]
  const colTextWidths: number[][] = Array.from({ length: numCols }, () => [])

  for (const row of allRows) {
    for (let ci = 0; ci < Math.min(numCols, row.length); ci++) {
      const cellText = row[ci] ?? ''
      // 使用测量画布获取精确宽度
      const font = `${BODY_BOLD_WEIGHT} ${fontSize}px ${fontFamily ?? BODY_FONT_FAMILY}`
      const ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        ctx.font = font
        colTextWidths[ci]!.push(ctx.measureText(cellText).width + CELL_PADDING_X * 2)
      } else {
        colTextWidths[ci]!.push(cellText.length * fontSize * 0.6 + CELL_PADDING_X * 2)
      }
    }
  }

  // 计算列宽
  const naturalWidths = colTextWidths.map((widths) => Math.max(MIN_COL_WIDTH, ...widths))
  const totalNatural = naturalWidths.reduce((a, b) => a + b, 0)

  let colWidths: number[]
  if (totalNatural <= CONTENT_WIDTH) {
    // 按比例分配额外空间
    const extra = CONTENT_WIDTH - totalNatural
    colWidths = naturalWidths.map((w) => w + extra / numCols)
  } else {
    // 按比例缩小
    const scale = CONTENT_WIDTH / totalNatural
    colWidths = naturalWidths.map((w) => Math.max(MIN_COL_WIDTH, w * scale))
  }

  // 计算行高（列宽内文本换行）
  const rowHeights: number[] = []
  for (let ri = 0; ri < allRows.length; ri++) {
    const row = allRows[ri]!
    let maxLines = 1
    for (let ci = 0; ci < Math.min(numCols, row.length); ci++) {
      const cellText = row[ci] ?? ''
      const colWidth = colWidths[ci]!
      const availableWidth = colWidth - CELL_PADDING_X * 2
      if (availableWidth <= 0) continue
      // 解析单元格文本中的内联标记并换行
      try {
        const tokens = parseInlineMarkdown(cellText)
        const lines = wrapInlineTokensByWidth(tokens, fontSize, availableWidth)
        if (lines.length > maxLines) maxLines = lines.length
      } catch {
        // 回退：按字符数估算行数
        const estLines = Math.ceil(cellText.length * fontSize * 0.6 / availableWidth)
        if (estLines > maxLines) maxLines = estLines
      }
    }
    rowHeights.push(maxLines * lineHeight + CELL_PADDING_Y * 2)
  }

  const totalWidth = colWidths.reduce((a, b) => a + b, 0)
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0) + HEADER_SEP_HEIGHT

  // 将计算值缓存到 block 上
  block.colWidths = colWidths
  block.rowHeights = rowHeights
  block.totalWidth = totalWidth

  return { colWidths, rowHeights, totalWidth, totalHeight }
}

// ═══════════════════════════════════════════════════════════════════════════
// 绘制
// ═══════════════════════════════════════════════════════════════════════════

/** 在 canvas 上绘制表格块。 */
export function drawTableBlock(
  ctx: CanvasRenderingContext2D,
  block: TableDisplayBlock,
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  theme: ThemeDefinition,
  fontFamily?: string,
): number {
  const numCols = block.headers.length
  if (numCols === 0) return 0

  // 确保已计算测量值
  const colWidths = block.colWidths ?? (() => {
    const m = measureTableBlock(block, fontSize, lineHeight, fontFamily)
    return m.colWidths
  })()
  const rowHeights = block.rowHeights ?? (() => {
    const m = measureTableBlock(block, fontSize, lineHeight, fontFamily)
    return m.rowHeights
  })()
  const totalWidth = colWidths.reduce((a: number, b: number) => a + b, 0)
  const totalHeight = rowHeights.reduce((a: number, b: number) => a + b, 0) + HEADER_SEP_HEIGHT
  const allRows = [block.headers, ...block.rows]

  let cursorY = y

  // 辅助函数：绘制单元格文本
  function drawCellText(
    text: string,
    cx: number,
    cy: number,
    cw: number,
    isBold: boolean,
    _alignment: 'left' | 'center' | 'right',
  ): void {
    const availableWidth = cw - CELL_PADDING_X * 2
    if (availableWidth <= 0) return

    const tokens = parseInlineMarkdown(text)
    const lines = wrapInlineTokensByWidth(tokens, fontSize, availableWidth)
    const fontWeight = isBold ? BODY_BOLD_WEIGHT : BODY_TEXT_WEIGHT

    ctx.save()
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily ?? BODY_FONT_FAMILY}`
    ctx.fillStyle = theme.palette.text
    ctx.textBaseline = 'alphabetic'

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]!
      let lineWidth = 0
      for (const token of line.tokens) {
        lineWidth += getBodyTokenWidth(token, fontSize)
      }

      // 对齐
      let startX: number
      const align = _alignment
      if (align === 'center') {
        startX = cx + (cw - lineWidth) / 2
      } else if (align === 'right') {
        startX = cx + cw - lineWidth - CELL_PADDING_X
      } else {
        startX = cx + CELL_PADDING_X
      }

      let cursorX = startX
      for (const token of line.tokens) {
        const tw = getBodyTokenWidth(token, fontSize)
        ctx.fillText(token.text, cursorX, cy + fontSize * 0.84 + li * lineHeight)
        cursorX += tw
      }
    }
    ctx.restore()
  }

  // 绘制每一行
  for (let ri = 0; ri < allRows.length; ri++) {
    const row = allRows[ri]!
    const rowH = rowHeights[ri]!
    let cx = x

    // 行背景
    ctx.save()
    if (ri === 0) {
      // 表头
      ctx.fillStyle = `rgba(0,0,0,0.04)`
    } else if (ri % 2 === 1) {
      // 交替行
      ctx.fillStyle = `rgba(0,0,0,0.02)`
    }
    if (ri <= 1 || ri % 2 === 1) {
      ctx.fillRect(cx, cursorY, totalWidth, rowH)
    }
    ctx.restore()

    // 绘制单元格
    for (let ci = 0; ci < numCols; ci++) {
      const cw = colWidths[ci]!
      const cellText = ci < row.length ? (row[ci] ?? '') : ''
      const align = block.alignments[ci] ?? 'left'
      drawCellText(cellText, cx, cursorY, cw, ri === 0, align)
      cx += cw
    }

    cursorY += rowH

    // 表头分隔线
    if (ri === 0) {
      ctx.save()
      ctx.strokeStyle = theme.palette.border
      ctx.lineWidth = HEADER_SEP_HEIGHT
      ctx.beginPath()
      ctx.moveTo(x, cursorY)
      ctx.lineTo(x + totalWidth, cursorY)
      ctx.stroke()
      ctx.restore()
      cursorY += HEADER_SEP_HEIGHT
    }
  }

  // 外边框
  ctx.save()
  ctx.strokeStyle = theme.palette.border
  ctx.lineWidth = OUTER_BORDER_WIDTH
  ctx.strokeRect(x, y, totalWidth, totalHeight)

  // 列分隔线
  ctx.lineWidth = BORDER_WIDTH
  let sepX = x
  for (let ci = 0; ci < numCols - 1; ci++) {
    sepX += colWidths[ci]!
    ctx.beginPath()
    ctx.moveTo(sepX, y)
    ctx.lineTo(sepX, y + totalHeight)
    ctx.stroke()
  }

  // 数据行之间的细分隔线
  let rowY = y + rowHeights[0]! + HEADER_SEP_HEIGHT
  for (let ri = 1; ri < allRows.length; ri++) {
    ctx.beginPath()
    ctx.moveTo(x, rowY)
    ctx.lineTo(x + totalWidth, rowY)
    ctx.stroke()
    rowY += rowHeights[ri]!
  }

  ctx.restore()
  return totalHeight
}