import './assets/main.css'

import { createApp as createClientApp, createSSRApp, reactive, type DirectiveBinding } from 'vue'
import VueLazyLoad from 'vue3-lazyload'

import App from './App.vue'
import loadingImg from './assets/loading.gif'
import {
  type BrowserScrollHistoryManager,
  createPageScrollCoordinator,
  PageScrollCoordinatorKey,
} from './composables/page-scroll'
import { AppStateKey, createInitialState, type AppState } from './composables/useAppState'
import {
  createSiteInteractionCoordinator,
  SiteInteractionCoordinatorKey,
} from './composables/site-interaction'
import { createLangPlugin } from './plugins/LangPlugin'
import { createAppRouter } from './router'
import { echoPress } from './directives/echoPress'

interface CreateAppOptions {
  initialState?: Partial<AppState>
  requestHeaders?: Record<string, string | string[] | undefined>
  currentPath?: string
  hydrate?: boolean
  browserHistoryManager?: BrowserScrollHistoryManager
}

export function createApp(options: CreateAppOptions = {}) {
  const shouldHydrate = import.meta.env.SSR || options.hydrate !== false
  const app = shouldHydrate ? createSSRApp(App) : createClientApp(App)
  const scrollCoordinator = createPageScrollCoordinator()
  const interactionCoordinator = createSiteInteractionCoordinator()
  const router = createAppRouter(
    import.meta.env.SSR,
    scrollCoordinator,
    options.browserHistoryManager,
    interactionCoordinator,
  )
  const state = reactive(createInitialState(options.initialState))

  app.provide(AppStateKey, state)
  app.provide(PageScrollCoordinatorKey, scrollCoordinator)
  app.provide(SiteInteractionCoordinatorKey, interactionCoordinator)
  app.use(router)
  app.directive('echo-press', echoPress)
  app.use(
    createLangPlugin({
      state,
      requestHeaders: options.requestHeaders,
      currentPath: options.currentPath,
    }),
  )

  if (!import.meta.env.SSR) {
    app.use(VueLazyLoad, {
      loading: loadingImg,
      error: './assets/default_images_list.svg',
    })
  } else {
    app.directive('lazy', {
      getSSRProps(binding: DirectiveBinding<string>) {
        return binding.value ? { src: binding.value } : {}
      },
    })
  }

  app.onUnmount(() => {
    interactionCoordinator.dispose()
    scrollCoordinator.dispose()
  })

  return { app, router, state, scrollCoordinator, interactionCoordinator }
}
