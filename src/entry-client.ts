import { createApp } from './app'

declare global {
  interface Window {
    __INITIAL_STATE__?: Partial<import('./composables/useAppState').AppState>
  }
}

const appRoot = document.querySelector('#app')
const shouldHydrate = Array.from(appRoot?.childNodes || []).some((node) => {
  if (node.nodeType === Node.ELEMENT_NODE) return true
  if (node.nodeType !== Node.TEXT_NODE) return false
  return Boolean(node.textContent?.trim())
})

const { app, router } = createApp({
  initialState: window.__INITIAL_STATE__,
  hydrate: shouldHydrate,
})

router.isReady().then(() => {
  app.mount(appRoot || '#app')
})
