import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// ── 平台初始化 ──────────────────────────────────────────────────────
// 必须在 Vue 挂载前运行：当检测到 Capacitor 移动端平台时，
// 注入 window.electronAPI 兼容桥接层，使现有代码无需修改。
import { initPlatform } from './platforms'

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
  // 平台桥接层初始化（Electron / Capacitor / Web）
  await initPlatform()

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // 确保 Splash 至少显示了 SPLASH_MIN_DURATION 毫秒
  const elapsed = getSplashElapsed()
  const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed)
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining))
  }

  // 保存 splash DOM 引用 — app.mount('#app') 会清空 #app 内容
  const splashEl = document.querySelector<HTMLDivElement>('#app .splash')

  // 挂载 Vue（会替换 #app 内所有内容）
  app.mount('#app')

  // 将保存的 splash 重新插入 #app，覆盖在 Vue 渲染内容之上
  if (splashEl) {
    document.querySelector('#app')!.appendChild(splashEl)
  }

  // 等待 Vue 组件完全渲染（Canvas / Editor 初始化完成）
  await new Promise<void>((resolve) => {
    const onReady = () => {
      window.removeEventListener('app-render-ready', onReady)
      resolve()
    }
    window.addEventListener('app-render-ready', onReady)
    // 安全超时：8 秒后强制淡出
    setTimeout(() => {
      window.removeEventListener('app-render-ready', onReady)
      resolve()
    }, 8000)
  })

  // 淡出 splash
  if (splashEl) {
    splashEl.classList.add('splash-fade-out')
    await new Promise((resolve) => setTimeout(resolve, FADE_OUT_DURATION + 50))
    splashEl.remove()
  }
}

bootstrap()
