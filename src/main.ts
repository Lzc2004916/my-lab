import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// ── 启动 — 带 Splash 过渡 ──────────────────────────────────────────

/** Splash 最小显示时长（ms）。 */
const SPLASH_MIN_DURATION = 2000
/** 淡出动画时长（ms），需与 index.html 中 CSS transition 一致。 */
const FADE_OUT_DURATION = 400

/** 页面加载时由 index.html 内联脚本写入的时间戳。 */
declare global {
  interface Window {
    __SPLASH_START__?: number
  }
}

function getSplashElapsed(): number {
  return Date.now() - (window.__SPLASH_START__ ?? Date.now())
}

async function bootstrap(): Promise<void> {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // 确保 Splash 至少显示了 SPLASH_MIN_DURATION 毫秒
  const elapsed = getSplashElapsed()
  const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed)
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining))
  }

  // 淡出 splash
  const splashEl = document.querySelector<HTMLDivElement>('#app .splash')
  if (splashEl) {
    splashEl.classList.add('splash-fade-out')
    await new Promise((resolve) => setTimeout(resolve, FADE_OUT_DURATION + 50))
  }

  // 挂载 Vue（替换 #app 内容）
  app.mount('#app')
}

bootstrap()
