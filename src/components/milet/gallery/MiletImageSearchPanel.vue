<template>
  <div ref="searchPanelRef" class="mx-auto mb-12 max-w-3xl scroll-mt-6">
    <section
      class="relative overflow-hidden rounded-2xl border border-white/80 bg-white/72 p-4 shadow-[0_22px_70px_-54px_rgba(15,61,99,0.68)] backdrop-blur-xl sm:p-5"
      aria-labelledby="milet-image-search-label"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(186,230,253,0.4),transparent_38%),linear-gradient(120deg,rgba(255,255,255,0.7),rgba(240,249,255,0.38))]"
      ></div>
      <form class="relative" role="search" @submit.prevent="submitSearch">
        <label
          id="milet-image-search-label"
          for="milet-image-search-input"
          class="mb-3 flex items-center gap-2 text-sm font-bold text-[#143d63]"
        >
          <svg
            class="h-4 w-4 text-[#317f8d]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke-width="1.8" />
            <path d="m16.5 16.5 4 4" stroke-linecap="round" stroke-width="1.8" />
          </svg>
          {{ text.searchLabel }}
        </label>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div class="relative min-w-0 flex-1">
            <input
              id="milet-image-search-input"
              v-model="draftQuery"
              type="text"
              enterkeyhint="search"
              autocomplete="off"
              :maxlength="MILET_IMAGE_SEARCH_MAX_LENGTH"
              :placeholder="text.searchPlaceholder"
              class="min-h-12 w-full rounded-xl border border-sky-100/90 bg-white/90 px-4 pr-11 text-base text-slate-800 shadow-inner shadow-sky-950/[0.025] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/70"
              :aria-describedby="
                queryValidationMessage
                  ? 'milet-image-search-validation'
                  : 'milet-image-search-capability'
              "
              @input="scheduleDraftSearch"
            />
            <button
              v-if="draftQuery"
              type="button"
              class="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-sky-50 hover:text-[#143d63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              :aria-label="text.searchClear"
              @click="clearSearch"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <button
            v-echo-press
            type="submit"
            class="min-h-12 shrink-0 rounded-xl bg-[#143d63] px-6 text-sm font-bold text-white shadow-[0_12px_28px_-18px_rgba(20,61,99,0.9)] transition hover:bg-[#1b527f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#317f8d] focus-visible:ring-offset-2 sm:min-w-28"
          >
            {{ text.searchButton }}
          </button>
        </div>

        <p
          v-if="queryValidationMessage"
          id="milet-image-search-validation"
          class="mt-2 text-xs font-medium text-amber-700"
          role="status"
        >
          {{ queryValidationMessage }}
        </p>
        <p v-else id="milet-image-search-capability" class="mt-2 text-xs leading-5 text-slate-500">
          {{ text.searchCapability }}
        </p>
      </form>
    </section>

    <section
      v-if="active"
      ref="resultsHeadingRef"
      class="mt-9 scroll-mt-6"
      aria-live="polite"
      :aria-busy="loading"
    >
      <div
        class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/70 pb-4"
      >
        <div class="min-w-0">
          <p class="text-[0.65rem] font-semibold tracking-[0.18em] text-[#317f8d]">PHOTO SEARCH</p>
          <h2 class="mt-1 break-words text-xl font-bold text-slate-800 sm:text-2xl">
            {{ formatText(text.searchResults, { query: activeQuery }) }}
          </h2>
          <p v-if="hasResponse" class="mt-1 text-sm text-slate-500">
            {{
              formatText(text.searchCount, {
                total: total,
                page: currentPage,
                maxPage: displayMaxPage,
              })
            }}
          </p>
        </div>
        <button
          v-echo-press
          type="button"
          class="min-h-11 rounded-full border border-sky-200/90 bg-white/80 px-4 text-sm font-semibold text-[#245f73] transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          @click="clearSearch"
        >
          {{ text.searchExit }}
        </button>
      </div>

      <div
        v-if="loading && results.length === 0"
        class="grid min-h-[36rem] grid-cols-1 gap-5 md:grid-cols-2"
      >
        <div
          v-for="index in 6"
          :key="`search-skeleton-${index}`"
          class="animate-pulse rounded-xl border border-white/80 bg-white/65 p-3 shadow-[0_20px_55px_-46px_rgba(15,23,42,0.65)]"
          aria-hidden="true"
        >
          <div
            :class="index % 3 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'"
            class="rounded-lg bg-sky-100/75"
          ></div>
          <div class="mt-3 h-3 w-3/4 rounded-full bg-slate-200/80"></div>
          <div class="mt-2 h-2.5 w-1/2 rounded-full bg-slate-100"></div>
        </div>
        <p class="sr-only">{{ text.searchLoading }}</p>
      </div>

      <EchoAsyncState
        v-else-if="errorMessage && results.length === 0"
        state="error"
        :title="text.searchError"
        :description="errorMessage"
        :action-label="text.searchRetry"
        @action="retrySearch"
      />

      <EchoAsyncState
        v-else-if="!loading && hasResponse && results.length === 0"
        state="empty"
        :title="text.searchEmpty"
        :description="text.searchEmptyHint"
      />

      <div v-else-if="results.length > 0" class="relative min-h-48">
        <div
          v-if="errorMessage"
          class="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/85 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{{ errorMessage }}</p>
          <button
            type="button"
            class="min-h-11 shrink-0 rounded-full border border-amber-300 bg-white px-4 font-bold transition hover:bg-amber-50"
            @click="retrySearch"
          >
            {{ text.searchRetry }}
          </button>
        </div>

        <div
          class="grid grid-cols-1 gap-5 transition-opacity duration-200 md:grid-cols-2"
          :class="loading ? 'pointer-events-none opacity-45' : ''"
        >
          <div
            v-for="(column, columnIndex) in imageColumns"
            :key="`search-column-${columnIndex}`"
            class="flex min-w-0 flex-col gap-5"
          >
            <article
              v-for="image in column"
              :key="image.imgId"
              class="overflow-hidden rounded-xl border border-white/80 bg-white/82 p-3 shadow-[0_24px_65px_-48px_rgba(15,23,42,0.72)] backdrop-blur-sm"
            >
              <a
                :href="imagePreviewLink(image)"
                class="group relative block cursor-zoom-in overflow-hidden rounded-lg bg-slate-100"
                :aria-label="`${text.searchOpenImage}: ${imageDescription(image, image.originalIndex)}`"
                :data-caption="imageDescription(image, image.originalIndex)"
                @click="openLightbox($event, image.originalIndex)"
              >
                <img
                  :src="imageThumbnailLink(image)"
                  :alt="imageDescription(image, image.originalIndex)"
                  :width="positiveDimension(image.width) || undefined"
                  :height="positiveDimension(image.height) || undefined"
                  class="block w-full rounded-lg object-contain shadow-[0_24px_70px_-48px_rgba(15,23,42,0.7)] transition duration-300 group-hover:scale-[1.012]"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  class="absolute inset-x-0 bottom-0 flex translate-y-0 items-center justify-center bg-black/50 transition-transform duration-300 ease-out md:translate-y-full md:group-hover:translate-y-0"
                >
                  <button
                    type="button"
                    class="flex min-h-12 w-full cursor-pointer items-center justify-center text-white"
                    :aria-label="text.searchDownload"
                    @click="downloadImage($event, imageOriginalLink(image))"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
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
              <div class="px-1 pb-1 pt-3">
                <p class="text-sm font-medium leading-6 text-slate-700">
                  {{ imageDescription(image, image.originalIndex) }}
                </p>
                <p v-if="imageSecondaryText(image)" class="mt-1 text-xs leading-5 text-slate-400">
                  {{ imageSecondaryText(image) }}
                </p>
              </div>
            </article>
          </div>
        </div>

        <div
          v-if="loading"
          class="pointer-events-none absolute inset-x-0 top-5 flex justify-center"
          role="status"
        >
          <span
            class="rounded-full border border-sky-100 bg-white/95 px-4 py-2 text-sm font-medium text-[#245f73] shadow-lg"
          >
            {{ text.searchLoading }}
          </span>
        </div>
      </div>

      <nav
        v-if="hasResponse && results.length > 0 && displayMaxPage > 1"
        class="mt-7 flex items-center justify-between gap-3"
        :aria-label="formatText(text.searchResults, { query: activeQuery })"
      >
        <button
          v-echo-press
          type="button"
          class="min-h-11 rounded-full border border-sky-200 bg-white/85 px-4 text-sm font-bold text-[#245f73] transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="loading || currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          <span aria-hidden="true">←</span>
          <span class="ml-1">{{ text.searchPrevious }}</span>
        </button>
        <span
          class="hidden min-h-11 items-center rounded-full bg-white/60 px-5 text-sm font-medium text-slate-500 sm:inline-flex"
        >
          {{
            formatText(text.searchCount, {
              total: total,
              page: currentPage,
              maxPage: displayMaxPage,
            })
          }}
        </span>
        <span class="text-sm font-medium text-slate-500 sm:hidden">
          {{ currentPage }} / {{ displayMaxPage }}
        </span>
        <button
          v-echo-press
          type="button"
          class="min-h-11 rounded-full border border-sky-200 bg-white/85 px-4 text-sm font-bold text-[#245f73] transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="loading || currentPage >= displayMaxPage"
          @click="goToPage(currentPage + 1)"
        >
          <span class="mr-1">{{ text.searchNext }}</span>
          <span aria-hidden="true">→</span>
        </button>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'
import {
  MILET_IMAGE_SEARCH_MAX_LENGTH,
  MILET_IMAGE_SEARCH_MIN_LENGTH,
  imageSearchQueryLength,
  searchMiletImages,
  type MiletImageSearchItem,
} from '@/composables/miletImageSearch'
import { MILET_GALLERY_TEXT } from '@/composables/lang/miletGallery'
import { buildStaticAssetPreviewUrl, buildStaticAssetUrl } from '@/config/api'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

type IndexedSearchImage = MiletImageSearchItem & { originalIndex: number }
type TextValues = Record<string, string | number>

const props = withDefaults(defineProps<{ lang?: 'zh' | 'jp' }>(), { lang: 'zh' })
const emit = defineEmits<{ 'update:active': [active: boolean] }>()
const route = useRoute()
const router = useRouter()

const text = computed(() => MILET_GALLERY_TEXT[props.lang])
const draftQuery = ref('')
const activeQuery = ref('')
const currentPage = ref(1)
const maxPage = ref(1)
const total = ref(0)
const results = ref<MiletImageSearchItem[]>([])
const active = ref(false)
const loading = ref(false)
const hasResponse = ref(false)
const errorMessage = ref('')
const searchPanelRef = ref<HTMLElement | null>(null)
const resultsHeadingRef = ref<HTMLElement | null>(null)
const useSplitColumns = ref(false)
const displayMaxPage = computed(() => Math.max(1, maxPage.value))
const queryValidationMessage = computed(() => {
  const query = draftQuery.value.trim()
  if (query && imageSearchQueryLength(query) < MILET_IMAGE_SEARCH_MIN_LENGTH) {
    return text.value.searchMinimum
  }
  return ''
})

const imageColumns = computed<IndexedSearchImage[][]>(() => {
  const indexedImages = results.value.map((image, originalIndex) => ({ ...image, originalIndex }))
  if (!useSplitColumns.value) return [indexedImages]

  const columns: IndexedSearchImage[][] = [[], []]
  const columnHeights = [0, 0]
  indexedImages.forEach((image) => {
    const columnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1
    columns[columnIndex].push(image)
    columnHeights[columnIndex] += estimatedImageHeight(image) + 0.16
  })
  return columns
})

let mounted = false
let debounceTimer: number | null = null
let requestController: AbortController | null = null
let requestId = 0
let scrollAfterLoad = false
let columnMediaQuery: MediaQueryList | null = null
let fancyboxApi: (typeof import('@fancyapps/ui'))['Fancybox'] | null = null
let lightboxRequestId = 0

function formatText(template: string, values: TextValues) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template,
  )
}

function routeQueryValue(value: unknown) {
  return Array.isArray(value) ? String(value[0] || '') : typeof value === 'string' ? value : ''
}

function parsePage(value: unknown) {
  const raw = routeQueryValue(value)
  const page = Number.parseInt(raw, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function clearDebounce() {
  if (debounceTimer !== null && typeof window !== 'undefined') window.clearTimeout(debounceTimer)
  debounceTimer = null
}

function positiveDimension(value: number | null | undefined) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0
}

function estimatedImageHeight(image: MiletImageSearchItem) {
  const width = positiveDimension(image.width)
  const height = positiveDimension(image.height)
  if (!width || !height) return 1
  return Math.min(4, Math.max(0.35, height / width))
}

function imageOriginalLink(image: MiletImageSearchItem) {
  return buildStaticAssetUrl(image.urlOriginal || image.urlWebp || '')
}

function imageThumbnailLink(image: MiletImageSearchItem) {
  return buildStaticAssetUrl(image.urlWebp || image.urlOriginal || '')
}

function imagePreviewLink(image: MiletImageSearchItem) {
  return buildStaticAssetPreviewUrl(image.urlOriginal || image.urlWebp || '')
}

function imageDescription(image: MiletImageSearchItem, index: number) {
  return image.comment?.trim() || `${text.value.searchGenericImage} ${index + 1}`
}

function imageSecondaryText(image: MiletImageSearchItem) {
  const albumTitle = image.albumTitle?.trim() || image.album?.trim() || ''
  const date = image.capturedAt?.trim() || image.takenAt?.trim() || image.createdAt?.trim() || ''
  return [albumTitle, date].filter(Boolean).join(' · ')
}

function resolveError(error: unknown) {
  const source = error as {
    code?: string
    response?: { status?: number; data?: { code?: number | string; message?: string } }
  }
  if (
    source.response?.status === 503 ||
    source.response?.data?.code === 'IMAGE_SEARCH_UNAVAILABLE'
  ) {
    return text.value.searchUnavailable
  }
  return source.response?.data?.message || text.value.searchError
}

function isCancelled(error: unknown) {
  const source = error as { code?: string; name?: string }
  return source.code === 'ERR_CANCELED' || source.name === 'AbortError'
}

async function loadSearch(query: string, page: number) {
  const normalizedLength = imageSearchQueryLength(query)
  if (
    normalizedLength < MILET_IMAGE_SEARCH_MIN_LENGTH ||
    normalizedLength > MILET_IMAGE_SEARCH_MAX_LENGTH
  ) {
    loading.value = false
    hasResponse.value = false
    results.value = []
    total.value = 0
    maxPage.value = 1
    return
  }

  requestController?.abort()
  const controller = new AbortController()
  requestController = controller
  const currentRequestId = ++requestId
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await searchMiletImages({ query, page, signal: controller.signal })
    if (!mounted || currentRequestId !== requestId || controller.signal.aborted) return
    if (response.code !== 200) throw new Error(`Image search failed: ${response.code}`)

    results.value = Array.isArray(response.data) ? response.data : []
    total.value = Number.isFinite(response.total)
      ? Math.max(0, response.total)
      : results.value.length
    maxPage.value = Number.isFinite(response.maxPage) ? Math.max(1, response.maxPage) : 1
    currentPage.value = Number.isFinite(response.page) ? Math.max(1, response.page) : page
    hasResponse.value = true
  } catch (error) {
    if (!mounted || currentRequestId !== requestId || isCancelled(error)) return
    errorMessage.value = resolveError(error)
  } finally {
    if (mounted && currentRequestId === requestId) {
      loading.value = false
      if (scrollAfterLoad) {
        scrollAfterLoad = false
        await nextTick()
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        resultsHeadingRef.value?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        })
      }
    }
  }
}

function resetResultState() {
  requestController?.abort()
  requestController = null
  requestId += 1
  activeQuery.value = ''
  currentPage.value = 1
  maxPage.value = 1
  total.value = 0
  results.value = []
  active.value = false
  loading.value = false
  hasResponse.value = false
  errorMessage.value = ''
  emit('update:active', false)
}

function syncFromRoute() {
  if (!mounted) return
  const query = routeQueryValue(route.query.q).trim()
  if (!query) {
    draftQuery.value = ''
    resetResultState()
    return
  }

  const page = parsePage(route.query.page)
  clearDebounce()
  draftQuery.value = query
  activeQuery.value = query
  currentPage.value = page
  active.value = true
  emit('update:active', true)
  void loadSearch(query, page)
}

async function setSearchRoute(query: string, page: number, replace: boolean) {
  const nextQuery = { ...route.query, q: query, page: String(page) }
  const isSame = routeQueryValue(route.query.q) === query && parsePage(route.query.page) === page
  if (isSame) {
    syncFromRoute()
    return
  }
  await (replace ? router.replace({ query: nextQuery }) : router.push({ query: nextQuery }))
}

function applyDraftSearch(replace: boolean) {
  clearDebounce()
  const query = draftQuery.value.trim()
  if (!query) {
    void clearSearch()
    return
  }
  if (imageSearchQueryLength(query) < MILET_IMAGE_SEARCH_MIN_LENGTH) return
  void setSearchRoute(query, 1, replace)
}

function scheduleDraftSearch() {
  clearDebounce()
  if (!mounted) return
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null
    const query = draftQuery.value.trim()
    if (!query) {
      void clearSearch()
      return
    }
    if (imageSearchQueryLength(query) >= MILET_IMAGE_SEARCH_MIN_LENGTH) {
      void setSearchRoute(query, 1, true)
    }
  }, 350)
}

function submitSearch() {
  applyDraftSearch(false)
}

async function clearSearch() {
  clearDebounce()
  const shouldRestoreSearchPosition = active.value
  draftQuery.value = ''
  const nextQuery = { ...route.query }
  delete nextQuery.q
  delete nextQuery.page
  if (route.query.q === undefined && route.query.page === undefined) {
    resetResultState()
    if (shouldRestoreSearchPosition) await scrollToSearchPanel()
    return
  }
  await router.push({ query: nextQuery })
  if (shouldRestoreSearchPosition) await scrollToSearchPanel()
}

async function scrollToSearchPanel() {
  await nextTick()
  if (!mounted || !searchPanelRef.value) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  searchPanelRef.value.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })
}

function retrySearch() {
  if (!activeQuery.value) return
  void loadSearch(activeQuery.value, currentPage.value)
}

function goToPage(page: number) {
  if (loading.value || page < 1 || page > displayMaxPage.value || page === currentPage.value) return
  scrollAfterLoad = true
  void setSearchRoute(activeQuery.value, page, false)
}

function setupColumnMediaQuery() {
  columnMediaQuery = window.matchMedia('(min-width: 768px)')
  const update = () => {
    useSplitColumns.value = Boolean(columnMediaQuery?.matches)
  }
  update()
  columnMediaQuery.addEventListener?.('change', update)
  ;(columnMediaQuery as MediaQueryList & { __searchUpdate?: () => void }).__searchUpdate = update
}

function cleanupColumnMediaQuery() {
  const source = columnMediaQuery as (MediaQueryList & { __searchUpdate?: () => void }) | null
  if (source?.__searchUpdate) source.removeEventListener?.('change', source.__searchUpdate)
  columnMediaQuery = null
}

function lightboxOptions(startIndex: number) {
  return {
    startIndex,
    Hash: false as const,
    Carousel: {
      Toolbar: {
        display: { left: ['counter'], middle: [], right: ['download', 'thumbs', 'close'] },
      },
    },
  }
}

async function openLightbox(event: MouseEvent, startIndex: number) {
  event.preventDefault()
  const fallbackHref = (event.currentTarget as HTMLAnchorElement | null)?.href
  const currentLightboxRequestId = ++lightboxRequestId

  try {
    const { Fancybox } = await import('@fancyapps/ui')
    if (!mounted || currentLightboxRequestId !== lightboxRequestId) return
    fancyboxApi = Fancybox
    const slides = results.value.map((image, index) => ({
      src: imageOriginalLink(image),
      thumbSrc: imageThumbnailLink(image),
      alt: imageDescription(image, index),
      caption: imageDescription(image, index),
      width: positiveDimension(image.width) || undefined,
      height: positiveDimension(image.height) || undefined,
      downloadSrc: imageOriginalLink(image),
    }))
    Fancybox.show(slides, lightboxOptions(startIndex))
  } catch {
    if (mounted && currentLightboxRequestId === lightboxRequestId && fallbackHref) {
      window.location.assign(fallbackHref)
    }
  }
}

function downloadImage(event: MouseEvent, src: string) {
  event.stopPropagation()
  event.preventDefault()
  const anchor = document.createElement('a')
  anchor.href = `${src}?download=true`
  anchor.download = ''
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

watch(
  () => [route.query.q, route.query.page],
  () => syncFromRoute(),
)

onMounted(() => {
  mounted = true
  setupColumnMediaQuery()
  syncFromRoute()
})

onUnmounted(() => {
  mounted = false
  clearDebounce()
  requestController?.abort()
  cleanupColumnMediaQuery()
  lightboxRequestId += 1
  fancyboxApi?.close(false)
  fancyboxApi = null
})
</script>
