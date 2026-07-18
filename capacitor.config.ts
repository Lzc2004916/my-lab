import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.richtexteditor.app',
  appName: 'Markdown Card',
  webDir: 'dist',

  server: {
    // 开发模式：通过环境变量指定 Vite dev server URL
    // 生产模式：使用 bundled files（webDir）
    url: process.env.CAPACITOR_DEV_URL,
    cleartext: true,
  },

  ios: {
    contentInset: 'automatic',
    // 允许应用处理链接预览
    allowsLinkPreview: false,
    // 状态栏样式：根据 app 主题自动切换
    preferredContentMode: 'automatic',
  },
}

export default config
