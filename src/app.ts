import './assets/main.css'

import { createSSRApp, reactive } from 'vue'
import VueLazyLoad from 'vue3-lazyload'

import App from './App.vue'
import loadingImg from './assets/loading.gif'
import { AppStateKey, createInitialState, type AppState } from './composables/useAppState'
import { createLangPlugin } from './plugins/LangPlugin'
import { createAppRouter } from './router'

interface CreateAppOptions {
  initialState?: Partial<AppState>
  requestHeaders?: Record<string, string | string[] | undefined>
}

export function createApp(options: CreateAppOptions = {}) {
  const app = createSSRApp(App)
  const router = createAppRouter(import.meta.env.SSR)
  const state = reactive(createInitialState(options.initialState))

  app.provide(AppStateKey, state)
  app.use(router)
  app.use(
    createLangPlugin({
      state,
      requestHeaders: options.requestHeaders,
    }),
  )

  if (!import.meta.env.SSR) {
    app.use(VueLazyLoad, {
      loading: loadingImg,
      error: './assets/default_images_list.svg',
    })
  }

  return { app, router, state }
}
