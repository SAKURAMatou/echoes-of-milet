import { ref, onMounted, onBeforeUnmount } from 'vue'
import axiosInstance from '@/AxiosUtil'
import type { Work } from './releaseType'

export interface ReleaseDataOptions {
  // 类型: 1 = ALBUM, 2 = EP/SINGLE, 3 = LIVE
  type: 1 | 2 | 3
  elementId: string
}

export function useReleaseData(options: ReleaseDataOptions) {
  const data = ref<Work[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const hasMore = ref(true)
  const isInitialized = ref(false)
  let observer: IntersectionObserver | null = null

  const apiBaseUrl = import.meta.env.VITE_URL_API_MILET_RELEASE
  const pageSize = 5

  const fetchData = async (page: number) => {
    loading.value = true
    error.value = null
    try {
      // 接口路径：baseUrl + type (1,2,3)
      const url = `${apiBaseUrl}${options.type}?page=${page}&pageSize=${pageSize}`
      const response = await axiosInstance.get<{ data: Work[]; total: Number }>(url)
      const newData = Array.isArray(response.data) ? response.data : response.data.data || []
      // newData.length = 5
      // 如果返回数据少于pageSize，说明没有更多数据
      if (newData.length <= pageSize) {
        hasMore.value = false
      }

      // 追加数据而不是替换
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

  const setupObserver = () => {
    const element = document.getElementById(options.elementId)
    if (!element) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当元素进入视口且还未初始化时，加载第一页数据
          if (entry.isIntersecting && !isInitialized.value) {
            isInitialized.value = true
            fetchData(1)
          }
        })
      },
      {
        rootMargin: '100px', // 提前100px开始加载
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
    loadMore,
  }
}
