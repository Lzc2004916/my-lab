import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './style.css'

// ── Locale messages ──────────────────────────────────────────────────

import zh from './locales/zh.json'
import en from './locales/en.json'

/** Restore persisted language preference, falling back to 'zh'. */
const savedLang: string = localStorage.getItem('lang') || 'zh'

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages: { zh, en },
})

// ── Bootstrap ────────────────────────────────────────────────────────

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
