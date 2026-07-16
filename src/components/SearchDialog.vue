<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="visible"
        class="search-overlay"
        @click.self="onOverlayClick"
      >
        <div
          ref="dialogRef"
          class="search-dialog"
          role="dialog"
          aria-label="Markdown 内容查找"
        >
          <!-- ── Search input row ─────────────────────────────────── -->
          <div class="flex items-center gap-2">
            <!-- Search icon -->
            <svg
              class="w-4 h-4 shrink-0 opacity-50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <!-- Input -->
            <input
              ref="inputRef"
              v-model="localQuery"
              type="text"
              class="search-input"
              :placeholder="placeholderText"
              @input="onInput"
              @keydown="onKeydown"
            />

            <!-- Match counter -->
            <span
              v-if="localQuery.length > 0"
              class="text-xs tabular-nums shrink-0"
              :class="hasMatches ? 'opacity-70' : 'opacity-50 text-error'"
            >
              {{ hasMatches ? `${activeIndex + 1}/${total}` : '0/0' }}
            </span>
          </div>

          <!-- ── Action row ──────────────────────────────────────── -->
          <div class="flex items-center justify-between gap-1 mt-2">
            <!-- Left: navigation buttons -->
            <div class="flex items-center gap-0.5">
              <button
                class="search-btn"
                title="上一个 (Shift+Enter)"
                :disabled="!hasMatches"
                @click="onPrev"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>
              <button
                class="search-btn"
                title="下一个 (Enter)"
                :disabled="!hasMatches"
                @click="onNext"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            <!-- Right: options + close -->
            <div class="flex items-center gap-1">
              <!-- Content-only toggle -->
              <button
                class="search-btn search-btn-toggle"
                :class="{ 'search-btn-active': contentOnly }"
                title="仅搜索文本内容（忽略 Markdown 语法）"
                @click="contentOnly = !contentOnly"
              >
                <span class="text-[10px] font-semibold">Ab</span>
                <span v-if="contentOnly" class="text-[8px] ml-0.5">文本</span>
              </button>

              <!-- Case sensitive toggle -->
              <button
                class="search-btn search-btn-toggle"
                :class="{ 'search-btn-active': caseSensitive }"
                title="区分大小写"
                @click="caseSensitive = !caseSensitive"
              >
                <span class="text-[10px] font-semibold">Aa</span>
              </button>

              <!-- Close button -->
              <button
                class="search-btn search-btn-close"
                title="关闭 (Escape)"
                @click="onClose"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- ── No results message ───────────────────────────────── -->
          <div
            v-if="localQuery.length > 0 && !hasMatches"
            class="text-xs opacity-50 mt-2 text-center"
          >
            未找到 "{{ localQuery }}"
          </div>

          <!-- ── Help text ────────────────────────────────────────── -->
          <div
            v-if="!hasSearched"
            class="text-[10px] opacity-40 mt-2 text-center"
          >
            Enter 搜索 &middot; Shift+Enter 上一个 &middot; Escape 关闭
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

// ── Props ──────────────────────────────────────────────────────────────

interface Props {
  /** 控制弹窗可见性 */
  visible: boolean
  /** 搜索占位文本 */
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  placeholder: '搜索 Markdown 内容…',
})

// ── Emits ──────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'search', query: string, options: { contentOnly: boolean; caseSensitive: boolean }): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'close'): void
}>()

// ── Refs ───────────────────────────────────────────────────────────────

const dialogRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const localQuery = ref('')
const contentOnly = ref(true)
const caseSensitive = ref(false)

// ── Injected state (from parent via props or provide/inject) ───────────

// 这些由父组件在搜索回调后更新（通过暴露的方法）
const activeIndex = ref(-1)
const total = ref(0)
const hasMatches = computed(() => total.value > 0)
const hasSearched = ref(false)

// ── Computed ───────────────────────────────────────────────────────────

const placeholderText = computed(() => props.placeholder)

// ── Methods ────────────────────────────────────────────────────────────

function emitSearch(): void {
  hasSearched.value = true
  emit('search', localQuery.value, {
    contentOnly: contentOnly.value,
    caseSensitive: caseSensitive.value,
  })
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emitSearch()
  }, 150)
}

function onNext(): void {
  emit('next')
}

function onPrev(): void {
  emit('prev')
}

function onClose(): void {
  localQuery.value = ''
  hasSearched.value = false
  emit('close')
  emit('update:visible', false)
}

function onOverlayClick(): void {
  onClose()
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (localQuery.value) {
      // 如果有搜索词但还没搜过，先搜索
      if (!hasSearched.value || total.value === 0) {
        emitSearch()
      }
      emit('next')
    }
  } else if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault()
    if (localQuery.value) {
      if (!hasSearched.value || total.value === 0) {
        emitSearch()
      }
      emit('prev')
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    onClose()
  }
}

// ── Watchers ───────────────────────────────────────────────────────────

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      localQuery.value = ''
      activeIndex.value = -1
      total.value = 0
      hasSearched.value = false
      await nextTick()
      inputRef.value?.focus()
    }
  },
)

// ── Exposed API（供父组件更新搜索状态）─────────────────────────────────

function updateResults(newActiveIndex: number, newTotal: number): void {
  activeIndex.value = newActiveIndex
  total.value = newTotal
}

defineExpose({
  updateResults,
  focus: () => inputRef.value?.focus(),
})

// ── Cleanup ────────────────────────────────────────────────────────────

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   Search Dialog — floating find panel
   ═══════════════════════════════════════════════════════════════════════ */

.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  background: transparent;
  pointer-events: none;
}

.search-overlay > * {
  pointer-events: auto;
}

.search-dialog {
  width: 520px;
  max-width: 92vw;
  height: fit-content;
  padding: 16px 18px;
  border-radius: 14px;
  background: oklch(var(--b1) / 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid oklch(var(--b3) / 0.6);
  box-shadow:
    0 1px 3px oklch(0 0 0 / 0.04),
    0 8px 24px oklch(0 0 0 / 0.08),
    0 20px 56px oklch(0 0 0 / 0.06);
}

/* ── Input ─────────────────────────────────────────────────────────── */

.search-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid oklch(var(--b3) / 0.5);
  border-radius: 8px;
  background: oklch(var(--b2) / 0.5);
  color: oklch(var(--bc));
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input::placeholder {
  color: oklch(var(--bc) / 0.4);
}

.search-input:focus {
  border-color: oklch(var(--p) / 0.5);
  box-shadow: 0 0 0 3px oklch(var(--p) / 0.1);
}

/* ── Buttons ────────────────────────────────────────────────────────── */

.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: oklch(var(--bc) / 0.6);
  cursor: pointer;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.search-btn:hover:not(:disabled) {
  background: oklch(var(--b3) / 0.4);
  color: oklch(var(--bc) / 0.9);
}

.search-btn:active:not(:disabled) {
  background: oklch(var(--b3) / 0.6);
}

.search-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.search-btn:focus-visible {
  outline: 2px solid oklch(var(--p) / 0.5);
  outline-offset: 1px;
}

/* ── Toggle buttons ─────────────────────────────────────────────────── */

.search-btn-toggle {
  width: auto;
  min-width: 30px;
  padding: 0 6px;
  font-size: 10px;
  gap: 1px;
}

.search-btn-active {
  background: oklch(var(--p) / 0.12);
  color: oklch(var(--p));
}

/* ── Close button ───────────────────────────────────────────────────── */

.search-btn-close:hover {
  background: oklch(0.55 0.22 25 / 0.12);
  color: oklch(0.55 0.22 25);
}

/* ── Transition ─────────────────────────────────────────────────────── */

.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.15s ease;
}

.search-fade-enter-active .search-dialog,
.search-fade-leave-active .search-dialog {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}

.search-fade-enter-from .search-dialog {
  transform: translateY(-8px) scale(0.97);
  opacity: 0;
}

.search-fade-leave-to .search-dialog {
  transform: translateY(-4px) scale(0.98);
  opacity: 0;
}
</style>
