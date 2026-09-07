import { createApp } from './app'
import { acquireBrowserScrollHistoryLease } from './composables/page-scroll'
import type { ClientPetHostHandle } from './components/pet/mountPetHost'

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
let petHost: ClientPetHostHandle | null = null
let tornDown = false

function teardown() {
  if (tornDown) return
  tornDown = true
  petHost?.stop()
  petHost = null
  application?.app.unmount()
  application?.scrollCoordinator.dispose()
  historyLease.release()
}

async function bootstrapPetHost() {
  const petRoot = document.querySelector('[data-pet-client-root]')
  if (!petRoot || tornDown || !application) return

  try {
    const { mountPetHost } = await import('./components/pet/mountPetHost')
    if (tornDown || !application) return
    petHost = mountPetHost(petRoot, application)
    await petHost.ready
  } catch (error) {
    petHost?.stop()
    petHost = null
    console.error('[pet] Client host failed to mount.', error)
  }
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
    void bootstrapPetHost()
  } catch (error) {
    teardown()
    throw error
  }
}

void bootstrap()

if (import.meta.hot) {
  import.meta.hot.dispose(teardown)
}
