import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-codemirror': [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/commands',
            '@codemirror/lang-markdown',
            '@codemirror/theme-one-dark',
          ],
          'vendor-markdown': [
            'markdown-it',
            'markdown-it-attrs',
            'markdown-it-container',
            'markdown-it-emoji',
          ],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-prism': ['prismjs'],
        },
      },
    },
  },
})
