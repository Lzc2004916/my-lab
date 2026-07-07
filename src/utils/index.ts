/**
 * Format a date string to a localized format.
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
 * Count words in a given text.
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

/**
 * Count characters in a given text (excluding whitespace).
 */
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length
}

/**
 * Debounce a function call.
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
 * Generate a unique ID.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
