<template>
  <div class="stats shadow">
    <div class="stat">
      <div class="stat-figure text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div class="stat-title">Documents</div>
      <div class="stat-value text-primary">{{ docCount }}</div>
      <div class="stat-desc">Total documents</div>
    </div>
    <div class="stat">
      <div class="stat-figure text-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
      <div class="stat-title">Views</div>
      <div class="stat-value text-secondary">{{ viewCount.toLocaleString() }}</div>
      <div class="stat-desc">Total page views</div>
    </div>
    <div class="stat">
      <div class="stat-figure text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div class="stat-title">Words</div>
      <div class="stat-value text-accent">{{ wordCount.toLocaleString() }}</div>
      <div class="stat-desc">Words written today</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const docCount = ref(12)
const viewCount = ref(2847)
const wordCount = ref(3521)
</script>
