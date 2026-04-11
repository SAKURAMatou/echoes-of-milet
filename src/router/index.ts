import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import { routes } from './routes'

export function createAppRouter(isServer = import.meta.env.SSR) {
  return createRouter({
    history: isServer ? createMemoryHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
    routes,
  })
}

export default createAppRouter()

