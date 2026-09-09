import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppState } from './useAppState'
import { renderPageSeo } from '@/server/page-seo'

export function usePageSeo() {
  const route = useRoute()
  const state = useAppState()
  function updateHead() {
    const template = document.createElement('template')
    template.innerHTML = renderPageSeo(route.meta.seoKey, route.fullPath, state)
    document.head.querySelectorAll('[data-milet-seo]').forEach((element) => element.remove())
    document.head.append(template.content)
  }
  onMounted(updateHead)
  watch(
    () => renderPageSeo(route.meta.seoKey, route.fullPath, state),
    () => {
      if (!import.meta.env.SSR) updateHead()
    },
    { flush: 'post' },
  )
}
