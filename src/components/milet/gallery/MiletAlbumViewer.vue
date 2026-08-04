<template>
  <section ref="rootRef" :class="['milet-album-viewer', embedded ? 'is-embedded' : '']">
    <div
      v-if="showTip"
      class="mx-auto mb-6 max-w-3xl rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-6 text-yellow-800 shadow-md"
    >
      <div class="flex items-center">
        <svg class="mr-2 h-6 w-6 shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12h2V8H9v4zm0 4h2v-2H9v2zm1-14a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
        <h2 class="flex-1 text-lg font-bold">{{ pageText.tip }}</h2>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2" :class="embedded ? 'mb-2' : 'mb-4'">
      <div
        v-for="(column, columnIndex) in imageColumns"
        :key="`album-column-${columnIndex}`"
        class="flex min-w-0 flex-col"
        :class="embedded ? 'gap-2 sm:gap-3' : 'gap-6'"
      >
        <div
          v-for="img in column"
          :key="`${img.link}-${img.originalIndex}`"
          class="image-wrapper mx-auto w-full max-w-lg rounded-xl"
          :class="embedded ? 'p-2 sm:p-3' : 'p-6'"
        >
          <a
            :href="img.previewLink || img.link"
            :data-width="img.w || img.weight"
            :data-height="img.h || img.height"
            class="image-item group relative block overflow-hidden rounded-lg"
            :data-caption="img.comment || `Image ${img.originalIndex + 1}`"
            :data-download-src="img.link"
            @click="openLightbox($event, img.originalIndex)"
          >
            <img
              v-lazy="img.prelink || img.link"
              :alt="img.comment || `Image ${img.originalIndex + 1}`"
              class="block w-full rounded-lg object-contain shadow-[0_24px_70px_-48px_rgba(15,23,42,0.7)]"
              loading="lazy"
              decoding="async"
            />
            <span
              class="absolute inset-x-0 bottom-0 flex translate-y-0 items-center justify-center bg-black/50 transition-transform duration-300 ease-out md:translate-y-full md:group-hover:translate-y-0"
            >
              <button
                type="button"
                class="flex h-12 w-full cursor-pointer items-center justify-center text-sm font-medium text-white"
                title="download"
                @click="downloadImage($event, img.link)"
              >
                <svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                  />
                </svg>
              </button>
            </span>
          </a>
        </div>
      </div>
    </div>

    <div v-if="loading" class="p-5 text-center text-sm text-slate-500">loading...</div>
    <div v-else-if="error" class="p-5 text-center text-sm text-rose-600">{{ error }}</div>
    <div v-else-if="imgList.length === 0" class="p-5 text-center text-sm text-slate-500">
      No photos.
    </div>
    <div ref="observerTarget" class="w-full p-5 text-center text-sm text-slate-500" v-if="!isLastPage">
      loading...
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import axiosInstance from '@/AxiosUtil'
import { apiRoutes, buildStaticAssetPreviewUrl, buildStaticAssetUrl } from '@/config/api'
import { MILET_PIC_TEXT } from '@/composables/lang/miletPic'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

type GalleryLang = 'zh' | 'ja' | 'jp'

type GalleryImage = {
  link: string
  previewLink?: string
  prelink: string
  url_original?: string
  url_webp?: string
  w?: number
  h?: number
  weight?: number
  height?: number
  comment?: string
}

type IndexedGalleryImage = GalleryImage & {
  originalIndex: number
}

const props = withDefaults(
  defineProps<{
    galleryId: string
    embedded?: boolean
    layout?: 'detail' | 'compact'
    showTip?: boolean
    lang?: GalleryLang
  }>(),
  {
    embedded: false,
    layout: 'detail',
    showTip: true,
    lang: 'zh',
  },
)

const rootRef = ref<HTMLElement | null>(null)
const observerTarget = ref<HTMLElement | null>(null)
const observer = ref<IntersectionObserver | null>(null)
const imgList = ref<GalleryImage[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const isLastPage = ref(true)
const loading = ref(false)
const error = ref('')
const useSplitColumns = ref(false)
const pageText = computed(() => MILET_PIC_TEXT[props.lang === 'ja' ? 'jp' : props.lang])

function positiveDimension(value: number | undefined) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0
}

function estimatedImageHeight(img: GalleryImage) {
  const width = positiveDimension(img.w) || positiveDimension(img.weight)
  const height = positiveDimension(img.h) || positiveDimension(img.height)

  if (!width || !height) return 1
  return Math.min(4, Math.max(0.35, height / width))
}

const imageColumns = computed<IndexedGalleryImage[][]>(() => {
  const indexedImages = imgList.value.map((img, originalIndex) => ({ ...img, originalIndex }))
  if (!useSplitColumns.value) return [indexedImages]

  const columns: IndexedGalleryImage[][] = [[], []]
  const estimatedColumnHeights = [0, 0]

  indexedImages.forEach((img) => {
    const columnIndex = estimatedColumnHeights[0] <= estimatedColumnHeights[1] ? 0 : 1
    columns[columnIndex].push(img)
    estimatedColumnHeights[columnIndex] += estimatedImageHeight(img) + 0.08
  })

  return columns
})

let columnMediaQuery: MediaQueryList | null = null
let fancyboxApi: typeof import('@fancyapps/ui')['Fancybox'] | null = null
let lightboxRequestId = 0
let componentMounted = false

function updateColumnMode() {
  useSplitColumns.value = Boolean(columnMediaQuery?.matches)
}

function handleColumnMediaQueryChange() {
  updateColumnMode()
}

function setupColumnMediaQuery() {
  if (typeof window === 'undefined') return
  columnMediaQuery = window.matchMedia('(min-width: 768px)')
  updateColumnMode()
  columnMediaQuery.addEventListener?.('change', handleColumnMediaQueryChange)
}

function cleanupColumnMediaQuery() {
  columnMediaQuery?.removeEventListener?.('change', handleColumnMediaQueryChange)
  columnMediaQuery = null
}

async function loadPage() {
  if (!props.galleryId) {
    error.value = 'Missing gallery id.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const resData = await axiosInstance.get<{ code: number; data?: GalleryImage[]; maxPage?: number }>(
      `${apiRoutes.miletPiclist}/${currentPage.value}/${props.galleryId}`,
    )
    if (resData.code === 200) {
      const resImgList = Array.isArray(resData.data) ? resData.data : []
      totalPages.value = resData.maxPage || 1
      imgList.value.push(
        ...resImgList.map((img) => ({
          ...img,
          link: buildStaticAssetUrl(img.url_original || img.link),
          previewLink: buildStaticAssetPreviewUrl(img.url_original || img.link),
          prelink: buildStaticAssetUrl(img.url_webp || img.prelink || img.link),
        })),
      )
    }
    isLastPage.value = currentPage.value >= totalPages.value
    await nextTick()
    setupObserver()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Album load failed.'
  } finally {
    loading.value = false
  }
}

function lightboxOptions(startIndex: number) {
  return {
    startIndex,
    Hash: false as const,
    Carousel: {
      Toolbar: {
        display: {
          left: ['counter'],
          middle: [],
          right: ['download', 'thumbs', 'close'],
        },
      },
    },
    on: {
      'Carousel.ready': (fancybox) => {
        const downloadBtn = (fancybox as any).Toolbar?.querySelector('[data-fancybox-download]')
        downloadBtn?.setAttribute('download', '')
      },
    },
  }
}

async function openLightbox(event: MouseEvent, startIndex: number) {
  event.preventDefault()
  const fallbackHref = (event.currentTarget as HTMLAnchorElement | null)?.href
  const requestId = ++lightboxRequestId

  try {
    const { Fancybox } = await import('@fancyapps/ui')
    if (!componentMounted || requestId !== lightboxRequestId) return

    fancyboxApi = Fancybox
    const slides = imgList.value.map((img, index) => ({
      src: img.link,
      thumbSrc: img.prelink || img.link,
      alt: img.comment || `Image ${index + 1}`,
      caption: img.comment || `Image ${index + 1}`,
      width: img.w || img.weight,
      height: img.h || img.height,
      downloadSrc: img.link,
    }))
    Fancybox.show(slides, lightboxOptions(startIndex))
  } catch {
    if (componentMounted && requestId === lightboxRequestId && fallbackHref) {
      window.location.assign(fallbackHref)
    }
  }
}

function setupObserver() {
  observer.value?.disconnect()
  observer.value = null
  if (isLastPage.value || !observerTarget.value) return

  observer.value = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) delayFetchData()
  })
  observer.value.observe(observerTarget.value)
}

function throttle(fn: () => void, delay: number) {
  let lastCall = 0
  return function throttled() {
    const now = Date.now()
    if (now - lastCall > delay) {
      lastCall = now
      fn()
    }
  }
}

const delayFetchData = throttle(() => {
  if (isLastPage.value || loading.value) return
  currentPage.value += 1
  loadPage()
}, 1500)

function downloadImage(event: MouseEvent, src: string) {
  event.stopPropagation()
  event.preventDefault()
  const a = document.createElement('a')
  a.href = `${src}?download=true`
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function resetAndLoad() {
  observer.value?.disconnect()
  observer.value = null
  imgList.value = []
  currentPage.value = 1
  totalPages.value = 1
  isLastPage.value = true
  loadPage()
}

onMounted(() => {
  componentMounted = true
  setupColumnMediaQuery()
  resetAndLoad()
})

watch(
  () => props.galleryId,
  () => resetAndLoad(),
)

onUnmounted(() => {
  componentMounted = false
  lightboxRequestId += 1
  observer.value?.disconnect()
  cleanupColumnMediaQuery()
  fancyboxApi?.close(false)
  fancyboxApi = null
})
</script>
