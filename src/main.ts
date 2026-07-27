import './assets/main.css'

import { createApp } from './app'
import { acquireBrowserScrollHistoryLease } from './composables/page-scroll'

const historyLease = acquireBrowserScrollHistoryLease()
const { app, router, scrollCoordinator } = createApp({
  browserHistoryManager: historyLease.manager,
})

router.isReady().then(() => {
  app.mount('#app')
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.unmount()
    scrollCoordinator.dispose()
    historyLease.release()
  })
}
