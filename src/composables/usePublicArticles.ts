import { computed, onMounted, onServerPrefetch, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/AxiosUtil'
import { useAppState } from './useAppState'
import type { RelatedArticleSummary } from './articleType'

export function usePublicArticles() {
  const route = useRoute()
  const state = useAppState()
  const lang = computed(() => (route.params.lang === 'ja' ? 'ja' : 'zh'))
  const cached = state.miletArticleListData
  const items = ref<RelatedArticleSummary[]>(cached?.key === lang.value ? cached.payload.items : [])
  const error = ref(cached?.key === lang.value ? cached.payload.error || '' : '')
  const loading = ref(false)
  let requestId = 0

  async function load() {
    const id = ++requestId
    const requestedLang = lang.value
    loading.value = true
    error.value = ''
    items.value = []
    try {
      const response = await axiosInstance.get<{
        success: boolean
        items: RelatedArticleSummary[]
      }>(`/api/articles/${requestedLang}`)
      if (id !== requestId) return
      if (!response.success || !Array.isArray(response.items))
        throw new Error('Unable to load articles')
      items.value = response.items
      state.miletArticleListData = { key: requestedLang, payload: { items: response.items } }
    } catch {
      if (id !== requestId) return
      error.value =
        requestedLang === 'ja' ? 'しばらくしてから、もう一度お試しください。' : '请稍后重试。'
      state.miletArticleListData = {
        key: requestedLang,
        payload: { items: [], error: error.value },
      }
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  onServerPrefetch(load)
  onMounted(() => {
    if (state.miletArticleListData?.key !== lang.value || error.value) void load()
  })
  watch(lang, () => {
    void load()
  })
  onBeforeUnmount(() => {
    requestId++
  })
  return { items, error, loading, lang, load }
}
