import './assets/main.css'

import { createApp as createClientApp, createSSRApp, reactive, type DirectiveBinding } from 'vue'
import VueLazyLoad from 'vue3-lazyload'

import App from './App.vue'
import loadingImg from './assets/loading.gif'
import { AppStateKey, createInitialState, type AppState } from './composables/useAppState'
import { createLangPlugin } from './plugins/LangPlugin'
import { createAppRouter } from './router'

interface CreateAppOptions {
  initialState?: Partial<AppState>
  requestHeaders?: Record<string, string | string[] | undefined>
  currentPath?: string
  hydrate?: boolean
}

export function createApp(options: CreateAppOptions = {}) {
  const shouldHydrate = import.meta.env.SSR || options.hydrate !== false
  const app = shouldHydrate ? createSSRApp(App) : createClientApp(App)
  const router = createAppRouter(import.meta.env.SSR)
  const state = reactive(createInitialState(options.initialState))

  app.provide(AppStateKey, state)
  app.use(router)
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

  return { app, router, state }
}
