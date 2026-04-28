import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import { routes } from './routes'

function resetPageScrollContainer() {
  if (import.meta.env.SSR) {
    return
  }

  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[data-page-scroll-container]')?.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  })
}

export function createAppRouter(isServer = import.meta.env.SSR) {
  return createRouter({
    history: isServer
      ? createMemoryHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }

      if (to.hash) {
        return {
          el: to.hash,
          top: 88,
        }
      }

      resetPageScrollContainer()
      return {
        top: 0,
        left: 0,
      }
    },
  })
}

export default createAppRouter()
