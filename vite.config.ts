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
    // 启用 CSS 压缩
    cssMinify: true,
    // 生产构建使用 esbuild 压缩（速度最快），同时开启 Drop console
    minify: 'esbuild',
    // 资源内联阈值：小于 4KB 的文件内联为 base64
    assetsInlineLimit: 4096,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
    // 目标浏览器（支持 ES2020+）
    target: 'es2020',
    // 关闭 sourcemap 减小体积
    sourcemap: false,
    // 输出构建体积报告
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // 实验性功能：压缩模块内常量
        compact: true,
        manualChunks: {
          'vendor-codemirror': [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/commands',
            '@codemirror/lang-markdown',
            '@codemirror/theme-one-dark',
          ],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-prism': ['prismjs'],
        },
      },
    },
    // esbuild 配置：生产环境移除 console 和 debugger
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },
})
