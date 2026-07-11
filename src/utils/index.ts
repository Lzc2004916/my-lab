/**
 * 将日期字符串格式化为本地化格式。
 */
export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 统计给定文本中的单词数。
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

/**
 * 统计给定文本中的字符数（不包括空白字符）。
 */
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length
}

/**
 * 防抖函数调用。
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 生成唯一 ID。
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}