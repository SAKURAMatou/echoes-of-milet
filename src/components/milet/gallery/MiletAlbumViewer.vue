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
        v-for="(img, index) in imgList"
        :key="`${img.link}-${index}`"
        class="image-wrapper mx-auto w-full max-w-lg rounded-xl"
        :class="embedded ? 'p-2 sm:p-3' : 'p-6'"
      >
        <a
          :data-fancybox="fancyboxGroup"
          :href="img.link"
          :data-width="img.w || img.weight"
          :data-height="img.h || img.height"
          class="image-item group relative block overflow-hidden rounded-lg"
          :data-caption="img.comment || `Image ${index + 1}`"
          :data-download-src="img.link"
        >
          <img
            :src="img.prelink || img.link"
            :alt="img.comment || `Image ${index + 1}`"
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
import { apiRoutes, buildStaticAssetUrl } from '@/config/api'
import { MILET_PIC_TEXT } from '@/composables/lang/miletPic'
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

type GalleryLang = 'zh' | 'ja' | 'jp'

type GalleryImage = {
  link: string
  prelink: string
  url_original?: string
  url_webp?: string
  w?: number
  h?: number
  weight?: number
  height?: number
  comment?: string
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
const instanceId = `album-${Math.random().toString(36).slice(2)}`
const fancyboxGroup = computed(() => `album-gallery-${props.galleryId}-${instanceId}`)
const fancyboxSelector = computed(() => `[data-fancybox="${fancyboxGroup.value}"]`)
const pageText = computed(() => MILET_PIC_TEXT[props.lang === 'ja' ? 'jp' : props.lang])

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
          prelink: buildStaticAssetUrl(img.url_webp || img.prelink || img.link),
        })),
      )
    }
    isLastPage.value = currentPage.value >= totalPages.value
    await nextTick()
    setupLightbox()
    setupObserver()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Album load failed.'
  } finally {
    loading.value = false
  }
}

function setupLightbox() {
  if (!rootRef.value) return
  Fancybox.unbind(rootRef.value, fancyboxSelector.value)
  Fancybox.bind(rootRef.value, fancyboxSelector.value, {
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
  })
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

onMounted(resetAndLoad)

watch(
  () => props.galleryId,
  () => resetAndLoad(),
)

onUnmounted(() => {
  observer.value?.disconnect()
  if (rootRef.value) Fancybox.unbind(rootRef.value, fancyboxSelector.value)
})
</script>
