<template>
  <div class="w-full px-4 py-6">
    <!-- 提示信息 -->
    <div
      class="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-xl shadow-md relative mb-8"
      id="tips"
    >
      <div class="flex items-center mb-3">
        <svg
          class="w-6 h-6 flex-shrink-0 mr-2 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9 12h2V8H9v4zm0 4h2v-2H9v2zm1-14a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
        <h2 class="text-lg font-bold flex-1">
          {{ $getConfigLang('miletGallery')['tip'] }}
        </h2>
      </div>
    </div>

    <!-- 置顶相册列表 -->
    <div
      id="pick-gallery"
      v-if="!loading && topAlbumList.length > 0"
      class="max-w-3xl mx-auto mb-12"
    >
      <div class="flex items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <span class="mr-2">📌</span>
          {{ $getConfigLang('miletGallery')['topAlbums'] }}
        </h2>
        <div
          class="flex-grow ml-4 h-1 bg-gradient-to-r from-pink-300 to-transparent rounded-full"
        ></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="album in topAlbumList"
          :key="album.galleryId"
          class="album-card group cursor-pointer"
          @click="goToGallery(album.galleryId)"
        >
          <div
            class="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <!-- 封面图片作为背景 -->
            <div class="relative w-full h-80 overflow-hidden bg-gray-200">
              <img
                :src="getImageUrl(album.coverUrl)"
                :alt="getAlbumTitle(album.description)"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <!-- 覆盖层 -->
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>

              <!-- 顶部标题和数量 - 绝对定位在图片上方 -->
              <div
                class="absolute flex items-center justify-between top-0 left-0 right-0 px-5 pt-4 pb-2 bg-gradient-to-b from-black/40 to-transparent"
              >
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h3 class="text-lg font-bold text-white line-clamp-2 flex-1 drop-shadow-md">
                    {{ getAlbumTitle(album.description) }}
                  </h3>
                  <span
                    class="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap"
                    >📌 {{ $getConfigLang('miletGallery')['toptip'] }}</span
                  >
                </div>
                <div class="flex items-center text-sm text-gray-100 drop-shadow-md">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    />
                  </svg>
                  {{ album.imgCount }}
                </div>
              </div>
            </div>

            <!-- 底部描述 -->
            <div class="px-5 py-4 bg-white">
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ getAlbumDescription(album.description) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 普通相册列表 -->
    <div id="all-gallery" v-if="!loading && normalAlbumList.length > 0" class="max-w-3xl mx-auto">
      <div class="flex items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <span class="mr-2">🎞️</span>
          {{ $getConfigLang('miletGallery')['albums'] }}
        </h2>
        <div
          class="flex-grow ml-4 h-1 bg-gradient-to-r from-blue-300 to-transparent rounded-full"
        ></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div
          v-for="album in normalAlbumList"
          :key="album.galleryId"
          class="album-card group cursor-pointer"
          @click="goToGallery(album.galleryId)"
        >
          <div
            class="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <!-- 封面图片作为背景 -->
            <div class="relative w-full h-80 overflow-hidden bg-gray-200">
              <img
                :src="getImageUrl(album.coverUrl)"
                :alt="getAlbumTitle(album.description)"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <!-- 覆盖层 -->
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>

              <!-- 顶部标题和数量 - 绝对定位在图片上方 -->
              <div
                class="absolute top-0 flex items-center justify-between left-0 right-0 px-5 pt-4 pb-2 bg-gradient-to-b from-black/40 to-transparent"
              >
                <h3 class="text-lg font-bold text-white line-clamp-2 mb-1 drop-shadow-md">
                  {{ getAlbumTitle(album.description) }}
                </h3>
                <div class="flex items-center text-sm text-gray-100 drop-shadow-md">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    />
                  </svg>
                  {{ album.imgCount }}
                </div>
              </div>
            </div>

            <!-- 底部描述 -->
            <div class="px-5 py-4 bg-white">
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ getAlbumDescription(album.description) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 自动翻页的锚点元素 -->
      <div ref="observerTarget" class="w-full p-5 text-center text-gray-500" v-if="!isLastPage">
        <p class="flex items-center justify-center">
          <span class="inline-block animate-spin mr-2">⏳</span>
          加载中...
        </p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="max-w-3xl mx-auto text-center py-12">
      <div class="inline-block">
        <svg
          class="animate-spin h-12 w-12 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <p class="mt-4 text-gray-600">加载相册中...</p>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!loading && topAlbumList.length === 0 && normalAlbumList.length === 0"
      class="max-w-3xl mx-auto text-center py-12"
    >
      <p class="text-gray-500 text-lg">暂无相册数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axiosInstance from '@/AxiosUtil'

const router = useRouter()
const route = useRoute()
const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

// 数据相关
const topAlbumList = ref([])
const normalAlbumList = ref([])
const loading = ref(true)
const isLoadingMore = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const isLastPage = ref(false)
const observerTarget = ref(null)
const galleryObserver = ref(null)

/**
 * 获取相册列表数据
 */
const loadAlbums = async (istop, page) => {
  try {
    const response = await axiosInstance.get(
      `${import.meta.env.VITE_URL_API_MILET_GALLERY}/${istop}/${page}`,
    )

    if (response.code === 200) {
      const albums = response.data

      if (istop === 1) {
        // 置顶相册
        topAlbumList.value = albums
      } else {
        // 普通相册，追加到列表
        normalAlbumList.value.push(...albums)
      }

      totalPages.value = response.maxPage || 1
      return response.maxPage || 1
    }
  } catch (error) {
    console.error('获取相册数据失败:', error)
  }
  return 1
}

/**
 * 初始化加载
 */
const initLoad = async () => {
  loading.value = true
  try {
    // 加载置顶相册
    await loadAlbums(1, 1)
    // 加载普通相册第一页
    const maxPage = await loadAlbums(0, 1)
    totalPages.value = maxPage
    isLastPage.value = currentPage.value >= maxPage
  } catch (error) {
    console.error('初始化加载失败:', error)
  } finally {
    loading.value = false
    await nextTick()
    setupIntersectionObserver()
  }
}

/**
 * 获取图片完整URL
 */
const getImageUrl = (coverUrl) => {
  if (!coverUrl) return ''
  return import.meta.env.VITE_BASE_IMG_URL + import.meta.env.VITE_URL_STATIC_MILET_I + coverUrl
}

/**
 * 获取相册标题
 */
const getAlbumTitle = (descriptions) => {
  if (!descriptions || descriptions.length === 0) return '未命名相册'
  const currentLang = global.$lang.lang
  const langMap = { zh: 'zh-CN', jp: 'ja-JP' }
  const targetLang = langMap[currentLang] || 'zh-CN'

  const desc = descriptions.find((d) => d.lang === targetLang)
  return desc?.title || descriptions[0]?.title || '未命名相册'
}

/**
 * 获取相册描述
 */
const getAlbumDescription = (descriptions) => {
  if (!descriptions || descriptions.length === 0) return '暂无描述'
  const currentLang = global.$lang.lang
  const langMap = { zh: 'zh-CN', jp: 'ja-JP' }
  const targetLang = langMap[currentLang] || 'zh-CN'

  const desc = descriptions.find((d) => d.lang === targetLang)
  return desc?.description || descriptions[0]?.description || '暂无描述'
}

/**
 * 跳转到相册详情页
 */
const goToGallery = (galleryId) => {
  router.push({
    name: 'galleryDetail',
    params: { galleryId: galleryId },
  })
}

/**
 * 设置 IntersectionObserver 监听无限滚动
 */
const setupIntersectionObserver = () => {
  if (galleryObserver.value) {
    galleryObserver.value.disconnect()
    galleryObserver.value = null
  }

  if (isLastPage.value || !observerTarget.value) return

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      console.log('滚动到页面底部，加载下一页')
      delayLoadMore()
    }
  })

  observer.observe(observerTarget.value)

  // 保存 observer 引用以便后续清理
  galleryObserver.value = observer
}

/**
 * 节流函数用于自动翻页
 */
const throttle = (fn, delay) => {
  let lastCall = 0
  return function () {
    const now = Date.now()
    if (now - lastCall > delay) {
      lastCall = now
      fn.apply(this)
    }
  }
}

/**
 * 加载更多数据
 */
const delayLoadMore = throttle(() => {
  if (isLastPage.value || isLoadingMore.value) return

  isLoadingMore.value = true
  currentPage.value += 1
  console.log('load more data, page:', currentPage.value)
  loadAlbums(0, currentPage.value)
    .then((maxPage) => {
      isLastPage.value = currentPage.value >= maxPage
      // 重新设置观察器
    })
    .finally(() => {
      isLoadingMore.value = false
      nextTick(() => {
        setupIntersectionObserver()
      })
    })
}, 1500)

onMounted(() => {
  document.title = 'milet photo albums'
  initLoad()
})

onUnmounted(() => {
  if (galleryObserver.value) {
    galleryObserver.value.disconnect()
  }
})
</script>

<style scoped>
.album-card {
  transition: all 0.3s ease;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
