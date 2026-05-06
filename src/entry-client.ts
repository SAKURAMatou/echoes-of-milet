import { createApp } from './app'

declare global {
  interface Window {
    __INITIAL_STATE__?: Partial<import('./composables/useAppState').AppState>
  }
}

const appRoot = document.querySelector('#app')
const shouldHydrate = Boolean(appRoot?.innerHTML.trim())

const { app, router } = createApp({
  initialState: window.__INITIAL_STATE__,
  hydrate: shouldHydrate,
})

router.isReady().then(() => {
  app.mount(appRoot || '#app')
})
