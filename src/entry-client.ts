import { createApp } from './app'
import { acquireBrowserScrollHistoryLease } from './composables/page-scroll'

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

const historyLease = acquireBrowserScrollHistoryLease()
let application: ReturnType<typeof createApp> | null = null
let tornDown = false

function teardown() {
  if (tornDown) return
  tornDown = true
  application?.app.unmount()
  application?.scrollCoordinator.dispose()
  historyLease.release()
}

async function bootstrap() {
  try {
    application = createApp({
      initialState: window.__INITIAL_STATE__,
      hydrate: shouldHydrate,
      browserHistoryManager: historyLease.manager,
    })
    await application.router.isReady()
    application.app.mount(appRoot || '#app')
  } catch (error) {
    teardown()
    throw error
  }
}

void bootstrap()

if (import.meta.hot) {
  import.meta.hot.dispose(teardown)
}
