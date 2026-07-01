import { ref, onMounted, onBeforeUnmount } from 'vue'

import axiosInstance from '@/AxiosUtil'
import { apiRoutes } from '@/config/api'
import { liveLangRequestConfig } from '@/composables/liveArchive'

import type { Work } from './releaseType'

export interface ReleaseDataOptions {
  type: 1 | 2 | 3
  elementId: string
}

export function useReleaseData(options: ReleaseDataOptions) {
  const data = ref<Work[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const hasMore = ref(true)
  const total = ref(0)
  const isInitialized = ref(false)
  let observer: IntersectionObserver | null = null

  const apiBaseUrl = apiRoutes.miletRelease
  const pageSize = 5

  const fetchData = async (page: number) => {
    loading.value = true
    error.value = null

    try {
      const lang = window.location.pathname.startsWith('/ja') ? 'ja' : 'zh'
      const url = `${apiBaseUrl}${options.type}?page=${page}&pageSize=${pageSize}`
      const response = await axiosInstance.get<{ data: Work[]; total: number }>(
        url,
        liveLangRequestConfig(lang),
      )
      const newData = Array.isArray(response.data) ? response.data : []

      total.value = Number(response.total || 0)
      hasMore.value = total.value > data.value.length + newData.length
      data.value = [...data.value, ...newData]
      currentPage.value = page
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch data'
      console.error(`Failed to fetch release data for type ${options.type}:`, err)
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return
    await fetchData(currentPage.value + 1)
  }

  const retry = async () => {
    if (loading.value) return
    await fetchData(data.value.length > 0 ? currentPage.value + 1 : 1)
  }

  const setupObserver = () => {
    const element = document.getElementById(options.elementId)
    if (!element) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInitialized.value) {
            isInitialized.value = true
            fetchData(1)
          }
        })
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      },
    )

    observer.observe(element)
  }

  onMounted(() => {
    setupObserver()
  })

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    data,
    loading,
    error,
    currentPage,
    hasMore,
    total,
    loadMore,
    retry,
  }
}
