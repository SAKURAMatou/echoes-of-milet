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
  const hasLoaded = ref(false)
  let observer: IntersectionObserver | null = null

  const apiBaseUrl = import.meta.env.VITE_URL_API_MILET_RELEASE

  const fetchData = async () => {
    if (hasLoaded.value) return

    loading.value = true
    error.value = null

    try {
      // 接口路径：baseUrl + type (1,2,3)
      const url = `${apiBaseUrl}${options.type}`
      const response = await axiosInstance.get<Work[]>(url)
      data.value = Array.isArray(response) ? response : response.data || []
      hasLoaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch data'
      console.error(`Failed to fetch release data for type ${options.type}:`, err)
    } finally {
      loading.value = false
    }
  }

  const setupObserver = () => {
    const element = document.getElementById(options.elementId)
    if (!element) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded.value) {
            fetchData()
            // 加载完成后可以停止观察
            if (observer) {
              observer.unobserve(element)
            }
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
    hasLoaded,
  }
}
