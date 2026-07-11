<template>
  <div class="md-code-block theme-aware" :style="codeBlockStyle">
    <!-- Header: language label + copy button -->
    <div v-if="language" class="md-code-header">
      <span class="md-code-lang">{{ language }}</span>
      <button class="md-code-copy-btn" @click="copyCode" :title="copied ? '已复制' : '复制'">
        <svg v-if="!copied" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg v-else class="w-3.5 h-3.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>
    <!-- Code lines -->
    <pre class="md-code-pre"><code
      class="md-code-code"
      :class="language ? `language-${language}` : ''"
      v-html="highlightedHTML"
    ></code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Prism from 'prismjs'
import { useMarkdownTheme } from '@/composables/useMarkdownTheme'

const props = withDefaults(
  defineProps<{
    language: string
    code: string
    showLineNumbers?: boolean
  }>(),
  { language: '', showLineNumbers: true },
)

const ctx = useMarkdownTheme()
const copied = ref(false)

const codeBlockStyle = computed(() => ({
  backgroundColor: 'var(--card-code-bg)',
  borderRadius: 'var(--card-code-radius)',
  border: '1px solid var(--card-code-border)',
  fontSize: ctx ? `${Math.round(ctx.bodySize.value * 0.88)}px` : '14px',
  lineHeight: '1.6',
  margin: '1em 0',
  overflow: 'hidden',
}))

const highlightedHTML = computed(() => {
  if (!props.code) return ''
  const lang = props.language || 'plaintext'
  try {
    const grammar = Prism.languages[lang] ?? Prism.languages.plaintext
    const highlighted = Prism.highlight(props.code, grammar!, lang)
    if (props.showLineNumbers) {
      const lines = highlighted.split('\n')
      return lines
        .map(
          (line, i) =>
            `<span class="line"><span class="line-number">${String(i + 1).padStart(2, ' ')}</span>${line || ' '}</span>`,
        )
        .join('\n')
    }
    return highlighted
  } catch {
    if (props.showLineNumbers) {
      const lines = props.code.split('\n')
      return lines
        .map(
          (_, i) =>
            `<span class="line"><span class="line-number">${String(i + 1).padStart(2, ' ')}</span></span>`,
        )
        .join('\n')
    }
    return props.code
  }
})

async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = props.code
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.md-code-block {
  position: relative;
}

.md-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid var(--card-code-border, rgba(0,0,0,0.08));
}

.md-code-lang {
  font-size: 0.75rem;
  color: var(--card-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}

.md-code-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--card-text-muted);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.md-code-copy-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--card-text);
}

.md-code-pre {
  margin: 0;
  padding: 12px 16px;
  overflow-x: auto;
  background: transparent;
}

.md-code-code {
  display: block;
  font-family: var(--font-mono, 'JetBrains Mono', 'Fira Code', monospace);
  color: var(--card-code-text);
}

/* Line numbers */
.md-code-code :deep(.line) {
  display: block;
}

.md-code-code :deep(.line-number) {
  display: inline-block;
  width: 2em;
  margin-right: 1em;
  color: var(--card-code-line-color);
  text-align: right;
  user-select: none;
  -webkit-user-select: none;
  opacity: 0.5;
}
</style>
