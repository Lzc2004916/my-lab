import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const title = ref('Rich Text Editor')
  const locale = ref('en')

  function setLocale(lang: string) {
    locale.value = lang
  }

  return { title, locale, setLocale }
})
