import { ref, type Ref } from 'vue'

/**
 * 基于 Canvas 的 CardPreview 简化 markdown 可组合函数。
 *
 * 新的 CardPreview 组件直接接收 `source` 并通过 canvas 引擎
 * 内部处理渲染。此可组合函数提供了一个最小化的响应式包装器：
 * 追踪源文本和当前页面索引。
 *
 * 在 noSplit 模式下，页面索引始终为 0（单长页面）。
 */
export function useMarkdown(source: Ref<string>): {
  source: Ref<string>
  /** 源文本（别名，保持一致）。 */
  currentPage: Ref<number>
} {
  const currentPage = ref<number>(0)

  return { source, currentPage }
}