<template>
  <div class="min-h-[calc(100dvh-8rem)] bg-base-200">
    <!-- ═══ Hero ═══════════════════════════════════════════════════════ -->
    <section class="w-full max-w-5xl mx-auto px-8 py-20 lg:py-32">
      <div class="max-w-2xl">
        <h1 class="text-5xl lg:text-6xl font-extrabold tracking-tight text-base-content leading-none mb-4">
          {{ $t('app.title') }}
        </h1>
        <p class="text-xl text-base-content/60 leading-relaxed max-w-lg mb-10">
          {{ $t('app.tagline') }}
        </p>

        <div class="flex items-center gap-4">
          <router-link
            :to="{ name: 'editor' }"
            class="btn btn-primary btn-lg px-8 h-12 text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Open Editor
          </router-link>
        </div>
      </div>
    </section>

    <!-- ═══ Features — asymmetric 2-col grid ═══════════════════════ -->
    <section class="w-full max-w-5xl mx-auto px-8 pb-24">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <!-- Main feature card (spans 3 cols) -->
        <div class="lg:col-span-3 border border-base-300/60 bg-base-100/60 rounded-xl p-8 card-interactive">
          <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-base-content mb-2">Powerful Markdown Editing</h3>
          <p class="text-sm text-base-content/60 leading-relaxed max-w-md">
            Write with a full-featured Markdown editor backed by CodeMirror 6. Syntax highlighting, live preview, and real-time rendering make every keystroke immediate and satisfying.
          </p>
        </div>

        <!-- Secondary features (stacked, spans 2 cols) -->
        <div class="lg:col-span-2 flex flex-col gap-5">
          <div class="border border-base-300/60 bg-base-100/60 rounded-xl p-6 card-interactive">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-base-content mb-1">Live Preview & Themes</h3>
            <p class="text-sm text-base-content/60 leading-relaxed">
              Real-time card previews with canvas rendering. KaTeX math, Mermaid diagrams, and multiple card themes for every style.
            </p>
          </div>

          <div class="border border-base-300/60 bg-base-100/60 rounded-xl p-6 card-interactive">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-base-content mb-1">Export Anywhere</h3>
            <p class="text-sm text-base-content/60 leading-relaxed">
              Export to PNG, JPG, PDF or copy to clipboard. Your content, ready for any platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>
