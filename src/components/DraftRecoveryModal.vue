<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-sm p-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h3 class="text-base font-semibold">检测到未保存的草稿</h3>
          <p class="text-sm text-base-content/60 mt-1">上次编辑的内容还未保存，是否恢复到之前的编辑状态？</p>
        </div>
      </div>
      <div class="modal-action mt-5">
        <button class="btn btn-ghost btn-sm h-8 min-h-0 text-sm" @click="onDiscard">
          忽略
        </button>
        <button class="btn btn-primary btn-sm h-8 min-h-0 text-sm" @click="onRestore">
          恢复
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'restore'): void
  (e: 'discard'): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

onMounted(() => {
  dialogRef.value?.showModal()
})

function onRestore(): void {
  dialogRef.value?.close()
  emit('restore')
}

function onDiscard(): void {
  dialogRef.value?.close()
  emit('discard')
}
</script>
