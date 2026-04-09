import { createApp } from './app'

declare global {
  interface Window {
    __INITIAL_STATE__?: Partial<import('./composables/useAppState').AppState>
  }
}

const { app, router } = createApp({
  initialState: window.__INITIAL_STATE__,
})

router.isReady().then(() => {
  app.mount('#app', true)
})
