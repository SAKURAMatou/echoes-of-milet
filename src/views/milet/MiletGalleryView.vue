<template>
  <div ref="galleryRoot" class="w-full px-4 py-6">
    <section
      class="relative mx-auto mb-10 max-w-3xl overflow-hidden rounded-2xl border border-white/80 bg-white/80 px-6 py-8 shadow-[0_24px_70px_-50px_rgba(15,61,99,0.55)] backdrop-blur sm:px-9 sm:py-10"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(186,230,253,0.5),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.88),rgba(240,249,255,0.5))]"
      ></div>
      <div class="relative">
        <p class="text-[0.68rem] font-semibold tracking-[0.2em] text-[#317f8d]">
          {{ pageText.pageKicker }}
        </p>
        <h1 class="milet-page-title-font mt-4 text-4xl leading-tight text-[#143d63] sm:text-5xl">
          {{ pageText.pageTitle }}
        </h1>
        <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[0.95rem]">
          {{ pageText.description }}
        </p>
      </div>
    </section>

    <MiletImageSearchPanel
      :lang="global.$lang.lang"
      @update:active="searchActive = $event"
    />

    <div v-show="!searchActive">
    <!-- 置顶相册列表 -->
    <div
      id="pick-gallery"
      v-if="!loading && topAlbumList.length > 0"
      class="max-w-3xl mx-auto mb-12"
    >
      <div class="flex items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <svg class="mr-2 h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m14 4 6 6-3 1-4 4-1 5-2-2-4 4-2-2 4-4-2-2 5-1 4-4 1-3Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" /></svg>
          {{ pageText.topAlbums }}
        </h2>
        <div
          class="flex-grow ml-4 h-1 bg-gradient-to-r from-pink-300 to-transparent rounded-full"
        ></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          v-for="album in topAlbumList"
          :key="album.galleryId"
          v-echo-press
          type="button"
          :data-page-scroll-anchor="`gallery-${album.galleryId}`"
          class="album-card group w-full cursor-pointer text-left"
          :aria-label="getAlbumTitle(album.description)"
          @click="goToGallery(album.galleryId)"
        >
          <div
            class="relative overflow-hidden rounded-xl shadow-md transition-shadow duration-300 hover:shadow-xl"
          >
            <!-- 封面图片作为背景 -->
            <div class="relative w-full h-80 overflow-hidden bg-gray-200">
              <img
                :src="getImageUrl(album.coverUrlAccess || album.coverUrl)"
                :alt="getAlbumTitle(album.description)"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                :style="galleryTransitionStyle(album.galleryId)"
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
                    >{{ pageText.toptip }}</span
                  >
                  <span
                    v-if="isRecentlyUpdated(album.updatedAt)"
                    class="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap"
                    >{{ pageText.recentlyUpdated }}</span
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
        </button>
      </div>
    </div>

    <!-- 普通相册列表 -->
    <div id="all-gallery" v-if="!loading && normalAlbumList.length > 0" class="max-w-3xl mx-auto">
      <div class="flex items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <svg class="mr-2 h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.7"/><path d="M7 5v14M17 5v14M3 9h4m10 0h4M3 15h4m10 0h4" stroke-width="1.7"/></svg>
          {{ pageText.albums }}
        </h2>
        <div
          class="flex-grow ml-4 h-1 bg-gradient-to-r from-blue-300 to-transparent rounded-full"
        ></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <button
          v-for="album in normalAlbumList"
          :key="album.galleryId"
          v-echo-press
          type="button"
          :data-page-scroll-anchor="`gallery-${album.galleryId}`"
          class="album-card group w-full cursor-pointer text-left"
          :aria-label="getAlbumTitle(album.description)"
          @click="goToGallery(album.galleryId)"
        >
          <div
            class="relative overflow-hidden rounded-xl shadow-md transition-shadow duration-300 hover:shadow-xl"
          >
            <!-- 封面图片作为背景 -->
            <div class="relative w-full h-80 overflow-hidden bg-gray-200">
              <img
                :src="getImageUrl(album.coverUrlAccess || album.coverUrl)"
                :alt="getAlbumTitle(album.description)"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                :style="galleryTransitionStyle(album.galleryId)"
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
                <div class="flex shrink-0 items-center gap-2">
                  <span
                    v-if="isRecentlyUpdated(album.updatedAt)"
                    class="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap"
                    >{{ pageText.recentlyUpdated }}</span
                  >
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
            </div>

            <!-- 底部描述 -->
            <div class="px-5 py-4 bg-white">
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ getAlbumDescription(album.description) }}
              </p>
            </div>
          </div>
        </button>
      </div>

      <!-- 自动翻页的锚点元素 -->
      <div ref="observerTarget" class="w-full p-5 text-center text-gray-500" v-if="!isLastPage">
        <p class="flex items-center justify-center">
          <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" aria-hidden="true"></span>
          加载中...
        </p>
      </div>
    </div>

    <!-- 加载状态 -->
    <EchoAsyncState
      v-if="loading"
      class="mx-auto max-w-3xl"
      state="loading"
      :title="global.$lang.lang === 'jp' ? 'アルバムを読み込んでいます' : '正在加载相册'"
    />

    <!-- 空状态 -->
    <EchoAsyncState
      v-if="!loading && loadError && topAlbumList.length === 0 && normalAlbumList.length === 0"
      class="mx-auto max-w-3xl"
      state="error"
      :title="global.$lang.lang === 'jp' ? 'アルバムを表示できません' : '暂时无法显示相册'"
      :description="loadError"
      :action-label="global.$lang.lang === 'jp' ? '再試行' : '重试'"
      @action="initLoad"
    />
    <EchoAsyncState
      v-else-if="!loading && topAlbumList.length === 0 && normalAlbumList.length === 0"
      class="mx-auto max-w-3xl"
      state="empty"
      :title="global.$lang.lang === 'jp' ? '公開中のアルバムはまだありません' : '暂无相册数据'"
    />
    <div
      v-if="!loading && loadError && (topAlbumList.length > 0 || normalAlbumList.length > 0)"
      class="mx-auto mt-5 flex max-w-3xl flex-col gap-3 rounded-lg border border-amber-200/80 bg-amber-50/78 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{{ global.$lang.lang === 'jp' ? '最新のアルバムを読み込めませんでした。現在の一覧を表示しています。' : '最新相册加载失败，当前仍显示原有列表。' }}</p>
      <button
        v-echo-press
        type="button"
        class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white/80 px-4 font-bold text-amber-900 transition hover:bg-white"
        @click="initLoad"
      >
        {{ global.$lang.lang === 'jp' ? '再試行' : '重试' }}
      </button>
    </div>

    </div>

    <Teleport v-if="clientMounted" to="body">
      <Transition name="gallery-notice">
        <div
          v-if="noticeOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
          @click.self="closeNotice"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-notice-title"
            aria-describedby="gallery-notice-description"
            class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_28px_90px_-28px_rgba(15,23,42,0.55)] ring-1 ring-white/35 backdrop-blur-2xl"
          >
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_85%_0%,rgba(186,230,253,0.7),transparent_55%),linear-gradient(90deg,rgba(240,249,255,0.9),rgba(255,255,255,0))]"
            ></div>
            <button
              type="button"
              class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-lg text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-[#143d63]"
              :aria-label="pageText.noticeCloseAria"
              @click="closeNotice"
            >
              ×
            </button>

            <div class="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-xl text-[#317f8d]"
                aria-hidden="true"
              >
                i
              </div>
              <p class="mt-5 text-[0.68rem] font-semibold tracking-[0.18em] text-[#317f8d]">
                ECHOES OF MILET
              </p>
              <h2 id="gallery-notice-title" class="mt-2 text-xl font-semibold text-[#143d63]">
                {{ pageText.noticeTitle }}
              </h2>
              <p id="gallery-notice-description" class="mt-4 text-sm leading-7 text-slate-600">
                {{ pageText.tip }}
              </p>
              <p class="mt-4 text-xs leading-5 text-slate-400">
                {{ pageText.noticeRepeat }}
              </p>
              <button
                type="button"
                autofocus
                class="mt-6 min-h-11 w-full rounded-lg bg-[#143d63] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b527f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#317f8d] focus-visible:ring-offset-2"
                @click="closeNotice"
              >
                {{ pageText.noticeClose }}
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  getCurrentInstance,
  onServerPrefetch,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'
import MiletImageSearchPanel from '@/components/milet/gallery/MiletImageSearchPanel.vue'
import axiosInstance from '@/AxiosUtil'
import { withLangParam } from '@/composables/useLangRoute'
import { apiRoutes, buildStaticAssetUrl } from '@/config/api'
import { MILET_GALLERY_TEXT } from '@/composables/lang/miletGallery'
import { useAppState } from '@/composables/useAppState'
import {
  useBusinessAnchorScrollRestoration,
  usePageScroll,
  usePageScrollPage,
} from '@/composables/page-scroll'

const router = useRouter()
const route = useRoute()
const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties
const appState = useAppState()
const pageScroll = usePageScroll()
const { markScrollContentPending } = usePageScrollPage()
const galleryRoot = ref(null)
const searchActive = ref(false)
const GALLERY_LIST_CACHE_KEY = 'milet-gallery-list:v1'
const cachedGalleryList =
  appState.miletGalleryListData?.key === GALLERY_LIST_CACHE_KEY
    ? appState.miletGalleryListData.payload
    : null

const pageText = computed(() => {
  const lang = global.$lang?.lang ? global.$lang.lang : 'zh'
  return MILET_GALLERY_TEXT[lang]
})
const RECENT_UPDATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const GALLERY_NOTICE_DISMISSED_AT_KEY = 'milet-gallery-notice:dismissed-at:v1'
const GALLERY_NOTICE_REPEAT_MS = 7 * 24 * 60 * 60 * 1000
const clientMounted = ref(false)
const noticeOpen = ref(false)
let noticeTimer = null
let releaseNoticeLock = null

// 数据相关
const topAlbumList = ref(cachedGalleryList?.topAlbums || [])
const normalAlbumList = ref(cachedGalleryList?.normalAlbums || [])
const loading = ref(!cachedGalleryList)
const loadError = ref('')
const isLoadingMore = ref(false)
const currentPage = ref(1)
const totalPages = ref(cachedGalleryList?.maxPage || 1)
const isLastPage = ref(
  cachedGalleryList ? currentPage.value >= (cachedGalleryList.maxPage || 1) : false,
)
const observerTarget = ref(null)
const galleryObserver = ref(null)

const clearNoticeTimer = () => {
  if (noticeTimer === null) return
  window.clearTimeout(noticeTimer)
  noticeTimer = null
}

const openNotice = () => {
  noticeTimer = null
  releaseNoticeLock?.()
  releaseNoticeLock = pageScroll.lockPageScroll('gallery-notice')
  noticeOpen.value = true
}

const scheduleNotice = (delay) => {
  clearNoticeTimer()
  noticeTimer = window.setTimeout(openNotice, Math.max(0, delay))
}

const scheduleNoticeFromStorage = () => {
  try {
    const dismissedAt = Number(window.localStorage.getItem(GALLERY_NOTICE_DISMISSED_AT_KEY))
    if (Number.isFinite(dismissedAt) && dismissedAt > 0) {
      scheduleNotice(Math.max(0, GALLERY_NOTICE_REPEAT_MS - (Date.now() - dismissedAt)))
      return
    }
  } catch {
    // localStorage 不可用时仍显示本次提醒。
  }
  scheduleNotice(350)
}

const closeNotice = () => {
  noticeOpen.value = false
  releaseNoticeLock?.()
  releaseNoticeLock = null
  const dismissedAt = Date.now()
  try {
    window.localStorage.setItem(GALLERY_NOTICE_DISMISSED_AT_KEY, String(dismissedAt))
  } catch {
    // 无法持久化时仅影响下次展示时间，不阻断关闭操作。
  }
  scheduleNotice(GALLERY_NOTICE_REPEAT_MS)
}

const handleNoticeKeydown = (event) => {
  if (event.key === 'Escape' && noticeOpen.value) closeNotice()
}

/**
 * 获取相册列表数据
 */
const loadAlbums = async (istop, page, signal) => {
  try {
    loadError.value = ''
    const response = await axiosInstance.get(`${apiRoutes.miletGallery}/${istop}/${page}`, {
      signal,
    })
    if (signal?.aborted) return totalPages.value

    if (response.code === 200) {
      const albums = Array.isArray(response.data) ? response.data : []

      if (istop === 1) {
        //置顶相册 缂傚倸鍊搁崰姘跺闯閿濆违濠电姴娲﹂崕搴ｇ磼鐎ｎ亞浠㈤柡鍌楀亾
        topAlbumList.value = albums
      } else {
        //普通相册，追加到列表 闂備礁鎼幏瀣闯閿濆鐒垫い鎺嶇劍閻ㄦ垶绻涢弶鎴█鐎规洘锚閻ｆ繄鈧綆鍓涢ˇ顕€鏌℃径鍡樻珗婵☆偄瀚幈銊╂倷閸濆嫮顦梺鍝勵槸閻忔繈鎮樺▎鎾村仩?
        normalAlbumList.value.push(...albums)
      }

      totalPages.value = response.maxPage || 1
      return response.maxPage || 1
    }
  } catch (error) {
    if (signal?.aborted) return totalPages.value
    console.error('获取相册数据失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Gallery load failed.'
  }
  return 1
}

useBusinessAnchorScrollRestoration({
  root: galleryRoot,
  capturePageState: () => ({ loadedPage: currentPage.value }),
  async prepare(snapshot, signal) {
    const targetPage = Number((snapshot.pageState || {}).loadedPage)
    if (!Number.isFinite(targetPage) || targetPage <= currentPage.value) return

    for (
      let nextPage = currentPage.value + 1;
      nextPage <= targetPage && !signal.aborted;
      nextPage += 1
    ) {
      const maxPage = await loadAlbums(0, nextPage, signal)
      currentPage.value = nextPage
      totalPages.value = maxPage
      isLastPage.value = nextPage >= maxPage
      if (isLastPage.value) break
    }
    await nextTick()
    pageScroll.invalidateMetrics()
  },
})

/**
 * 初始化加载
 */
const initLoad = async () => {
  loading.value = true
  currentPage.value = 1
  topAlbumList.value = []
  normalAlbumList.value = []

  try {
    // 加载置顶相册
    await loadAlbums(1, 1)
    // 加载普通相册第一页
    const maxPage = await loadAlbums(0, 1)
    totalPages.value = maxPage
    isLastPage.value = currentPage.value >= maxPage
    appState.miletGalleryListData = {
      key: GALLERY_LIST_CACHE_KEY,
      payload: {
        topAlbums: topAlbumList.value,
        normalAlbums: normalAlbumList.value,
        maxPage,
      },
    }
  } catch (error) {
    console.error('初始化加载失败:', error)
  } finally {
    loading.value = false
    if (!import.meta.env.SSR) {
      await nextTick()
      setupIntersectionObserver()
    }
  }
}

/**
 * 获取图片完整URL
 */
const getImageUrl = (coverUrl) => {
  if (!coverUrl) return ''
  return buildStaticAssetUrl(coverUrl)
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
  return desc?.description || descriptions[0]?.description || 'No description'
}

const isRecentlyUpdated = (updatedAt) => {
  if (!updatedAt) return false
  const updatedTime = new Date(updatedAt).getTime()
  if (!Number.isFinite(updatedTime)) return false
  const diff = Date.now() - updatedTime
  return diff >= 0 && diff <= RECENT_UPDATE_WINDOW_MS
}

/**
 * 跳转到相册详情页
 */
const goToGallery = (galleryId) => {
  const target = withLangParam(
    { name: 'galleryDetail', params: { galleryId: galleryId } },
    String(route.params.lang || 'zh'),
  )
  const startViewTransition = Reflect.get(document, 'startViewTransition')
  if (typeof startViewTransition === 'function') {
    startViewTransition.call(document, () => router.push(target))
    return
  }
  void router.push(target)
}

function galleryTransitionStyle(galleryId) {
  return { viewTransitionName: `gallery-${String(galleryId).replace(/[^a-zA-Z0-9_-]/g, '-')}` }
}

/**
 * 设置 IntersectionObserver 监听无限滚动
 */
const setupIntersectionObserver = () => {
  if (typeof IntersectionObserver === 'undefined') return

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

onServerPrefetch(initLoad)

onMounted(async () => {
  const releasePending = markScrollContentPending('gallery-initial-data')
  clientMounted.value = true
  document.title = pageText.value.metaTitle
  window.addEventListener('keydown', handleNoticeKeydown)
  scheduleNoticeFromStorage()
  if (cachedGalleryList) {
    await nextTick()
    setupIntersectionObserver()
    pageScroll.invalidateMetrics()
    releasePending()
    return
  }

  try {
    await initLoad()
    await nextTick()
    pageScroll.invalidateMetrics()
  } finally {
    releasePending()
  }
})

onUnmounted(() => {
  clearNoticeTimer()
  window.removeEventListener('keydown', handleNoticeKeydown)
  releaseNoticeLock?.()
  releaseNoticeLock = null
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

.gallery-notice-enter-active,
.gallery-notice-leave-active {
  transition: opacity 0.2s ease;
}

.gallery-notice-enter-active section,
.gallery-notice-leave-active section {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.gallery-notice-enter-from,
.gallery-notice-leave-to,
.gallery-notice-enter-from section,
.gallery-notice-leave-to section {
  opacity: 0;
}

.gallery-notice-enter-from section,
.gallery-notice-leave-to section {
  transform: translateY(10px) scale(0.985);
}
</style>
