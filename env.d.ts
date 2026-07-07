/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'markdown-it-attrs' {
  import type MarkdownIt from 'markdown-it'
  function markdownItAttrs(md: MarkdownIt): void
  export default markdownItAttrs
}

declare module 'markdown-it-container' {
  import type MarkdownIt from 'markdown-it'
  interface ContainerOpts {
    marker?: string
    validate?: (params: string) => boolean
    render?: (tokens: unknown[], idx: number, options: unknown, env: unknown, self: unknown) => string
  }
  function markdownItContainer(md: MarkdownIt, name: string, opts: ContainerOpts): void
  export default markdownItContainer
}

declare module 'markdown-it-emoji' {
  import type { PluginWithOptions } from 'markdown-it'
  export const full: PluginWithOptions
  export const bare: PluginWithOptions
  export const light: PluginWithOptions
}

declare module 'mermaid' {
  const mermaid: {
    run: (opts?: { nodes?: (string | Element)[] }) => Promise<void>
    initialize: (config: Record<string, unknown>) => void
  }
  export default mermaid
}

declare module 'prismjs' {
  const Prism: {
    highlightElement: (element: Element, async?: boolean) => void
    highlight: (text: string, grammar: unknown, language: string) => string
  }
  export default Prism
}
