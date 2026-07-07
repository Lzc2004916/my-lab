import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for tracking the online/offline status of the application.
 */
export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine)

  function updateOnlineStatus() {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return { isOnline }
}
