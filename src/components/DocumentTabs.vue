<template>
  <div class="flex items-center bg-base-200 border-b border-base-300/60 pl-1.5 pr-1 py-0 gap-0.5">
    <!-- ── Tab list ────────────────────────────────────────────── -->
    <div class="flex-1 overflow-x-auto flex flex-nowrap items-end">
      <button
        v-for="doc in store.documents"
        :key="doc.id"
        class="group relative flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] rounded-t-md transition-all duration-150 shrink-0 max-w-[160px] leading-none"
        :class="doc.id === store.activeId
          ? 'bg-base-100 text-base-content font-medium shadow-sm'
          : 'text-base-content/60 hover:text-base-content hover:bg-base-100/50'"
        @click="store.setActive(doc.id)"
      >
        <span class="truncate">
          {{ doc.title || '未命名' }}
        </span>
        <span
          v-if="store.documents.length > 1"
          class="inline-flex items-center justify-center w-4 h-4 rounded-full opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
          @click.stop="handleClose(doc.id)"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      </button>
    </div>

    <!-- ── New tab button ──────────────────────────────────────── -->
    <button
      class="btn btn-ghost btn-sm btn-square h-7 w-7 min-h-0 shrink-0"
      aria-label="新建文档"
      title="新建文档 (Ctrl+T)"
      @click="handleAdd"
    >
      <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDocumentsStore } from '@/stores/documents'

const store = useDocumentsStore()

function handleAdd(): void {
  store.addDocument()
}

function handleClose(id: string): void {
  store.removeDocument(id)
}
</script>
