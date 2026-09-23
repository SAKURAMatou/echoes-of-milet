<template>
  <div class="min-h-svh">
    <Header :showHanbor="false" />
    <LanguageSelect v-if="!isPreview" class="max-md:hidden" />

    <div
      v-if="article?.toc?.length"
      ref="mobileTocRoot"
      class="pointer-events-none fixed inset-x-0 top-[3.45rem] z-40 block px-4 pt-2 min-[1180px]:hidden"
    >
      <button
        ref="mobileTocButton"
        v-echo-press
        type="button"
        class="pointer-events-auto mx-auto flex h-11 w-full max-w-md items-center justify-center gap-2 rounded-lg border border-[rgba(171,209,223,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(239,249,255,0.86)),radial-gradient(circle_at_92%_0,rgba(186,230,253,0.36),transparent_9rem)] text-[0.8rem] font-bold uppercase tracking-[0.12em] text-[#143d63] shadow-[0_16px_42px_-32px_rgba(20,61,99,0.72)] backdrop-blur-xl transition active:translate-y-px"
        aria-controls="article-mobile-toc-panel"
        :aria-expanded="mobileTocOpen"
        @click="mobileTocOpen = !mobileTocOpen"
      >
        <span>{{ routeLang === 'ja' ? 'Contents' : '目录' }}</span>
        <svg
          class="h-4 w-4 text-[#317f8d] transition-transform duration-200"
          :class="{ 'rotate-180': mobileTocOpen }"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <Transition name="article-mobile-toc-panel">
        <div
          v-if="mobileTocOpen"
          id="article-mobile-toc-panel"
          ref="mobileTocPanel"
          class="pointer-events-auto mx-auto mt-2 w-full max-w-md rounded-lg border border-[rgba(171,209,223,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,250,255,0.9)),radial-gradient(circle_at_100%_0,rgba(186,230,253,0.28),transparent_10rem)] shadow-[0_24px_58px_-34px_rgba(20,61,99,0.72)] backdrop-blur-[18px]"
          @click="handleMobileTocClick"
          @keydown="handleMobileTocKeydown"
        >
          <ArticleToc
            :items="article.toc"
            :title="routeLang === 'ja' ? 'Contents' : '目录'"
            variant="mobile"
          />
        </div>
      </Transition>
    </div>

    <main
      id="main-content"
      class="flex min-h-svh w-full flex-col items-center bg-[radial-gradient(circle_at_16%_7%,rgba(186,230,253,0.45),transparent_24rem),radial-gradient(circle_at_88%_22%,rgba(204,251,241,0.3),transparent_20rem),linear-gradient(180deg,#f7fbfd_0%,#eef8fb_48%,#f8fbfd_100%)] px-[clamp(1rem,2.8vw,2.5rem)] pb-[clamp(1rem,2.8vw,2.5rem)] min-[1180px]:grid min-[1180px]:grid-cols-[minmax(0,70.25rem)_minmax(13rem,15rem)] min-[1180px]:items-start min-[1180px]:justify-center min-[1180px]:gap-[clamp(1.5rem,3vw,2.75rem)] min-[1180px]:px-[clamp(1.5rem,4vw,4rem)]"
      :class="
        article?.toc?.length
          ? 'pt-[calc(7.25rem+clamp(1rem,2.8vw,2.5rem))] min-[1180px]:pt-[calc(4rem+clamp(1rem,2.8vw,2.5rem))]'
          : 'pt-[calc(4rem+clamp(1rem,2.8vw,2.5rem))]'
      "
    >
      <article
        class="min-h-[calc(100svh-5rem)] w-[min(100%,70.25rem)] min-w-0 overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,253,255,0.9))] text-[#1e2a35] shadow-[0_28px_90px_-66px_rgba(15,23,42,0.65)]"
      >
        <div
          v-if="isPreview"
          class="border-b border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center text-sm font-medium text-amber-900"
        >
          {{ routeLang === 'ja' ? '一回限りの記事プレビュー' : '一次性文章预览' }}
        </div>
        <div
          class="relative overflow-hidden border-b border-slate-200/80 px-4 py-8 sm:px-6 md:px-8 md:py-10"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_12%,rgba(186,230,253,0.52),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,249,255,0.5))]"
          ></div>
          <div class="relative mx-auto max-w-4xl">
            <div v-if="!isPreview" class="mb-5 w-40 md:hidden"><LanguageSelect variant="menu" /></div>
            <RouterLink
              :to="{ name: 'milet', params: { lang: routeLang } }"
              class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#317f8d] transition hover:text-[#143d63]"
            >
              ← Echoes of milet
            </RouterLink>
            <h1 class="mt-5 font-serif text-4xl leading-tight text-[#143d63] md:text-5xl">
              {{ article?.title || fallbackTitle }}
            </h1>
            <p v-if="article?.summary" class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {{ article.summary }}
            </p>
            <div class="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
              <span v-if="article?.publishedAt">{{ formatDate(article.publishedAt) }}</span>
              <span v-if="article?.createdBy" class="inline-flex items-center gap-1">
                <span>{{ routeLang === 'ja' ? 'Author' : '创建人' }}</span>
                <span class="font-semibold text-[#143d63]">{{ article.createdBy }}</span>
              </span>
              <span
                v-if="article && article.lang !== routeLang"
                class="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[#317f8d]"
              >
                {{
                  routeLang === 'ja'
                    ? '日本語訳は未公開のため、中文を表示しています'
                    : '中文译文尚未发布，当前显示日文原文'
                }}
              </span>
              <RouterLink
                :to="{ name: 'miletArticles', params: { lang: routeLang } }"
                class="inline-flex min-h-11 items-center text-[#317f8d] underline underline-offset-4 hover:text-[#143d63]"
                >{{ routeLang === 'ja' ? 'すべての記事' : '全部文章' }}</RouterLink
              >
              <ArticleShareMenu
                v-if="article && !isPreview"
                :title="article.title || fallbackTitle"
                :summary="article.summary"
                :url="articleShareUrl"
                :lang="routeLang"
                :cover-image-url="articleCoverShareUrl"
              />
            </div>
          </div>
        </div>

        <div
          class="mx-auto w-[min(100%,var(--article-readable-max-width,56rem))] max-w-[var(--article-readable-max-width,56rem)] px-4 py-8 sm:px-6 md:px-8 md:py-10"
        >
          <EchoAsyncState
            v-if="loading"
            state="loading"
            :title="routeLang === 'ja' ? '記事を読み込んでいます' : '正在读取文章'"
          />
          <EchoAsyncState
            v-else-if="error"
            state="error"
            :title="routeLang === 'ja' ? '記事を表示できません' : '暂时无法显示文章'"
            :description="error"
            :action-label="routeLang === 'ja' ? '再試行' : '重试'"
            :disabled="loading"
            @action="fetchArticle"
          />
          <div
            v-else-if="article?.html"
            ref="articleContentRef"
            class="article-content"
            v-html="article.html"
            @click="handleArticleContentClick"
          ></div>
          <div
            v-else
            class="rounded-lg border border-dashed border-slate-200 bg-white/72 p-8 text-center text-sm text-slate-500"
          >
            No article content.
          </div>
        </div>
      </article>

      <aside
        v-if="article?.toc?.length"
        class="hidden min-w-0 self-start min-[1180px]:sticky min-[1180px]:top-32 min-[1180px]:block min-[1180px]:max-h-[calc(100svh-6.25rem)] min-[1180px]:w-full"
      >
        <ArticleToc :items="article.toc" :title="routeLang === 'ja' ? 'Contents' : '目录'" />
      </aside>
    </main>

    <div class="fixed bottom-4 right-4 z-50">
      <TWUpToTop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/AxiosUtil'
import Header from '@/components/TWHeader.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'
import TWUpToTop from '@/components/TWUpToTop.vue'
import ArticleShareMenu from '@/components/milet/article/ArticleShareMenu.vue'
import ArticleToc from '@/components/milet/article/ArticleToc.vue'
import { buildStaticAssetAbsoluteUrl, getSiteOrigin } from '@/config/api'
import { useAppState } from '@/composables/useAppState'
import { useArticleAlbumEmbeds } from '@/composables/useArticleAlbumEmbeds'
import { useArticleImageEnhancements } from '@/composables/useArticleImageEnhancements'
import type { PublicArticleDetail } from '@/composables/articleType'
import { usePageAnchorScroll } from '@/composables/usePageAnchorScroll'
import { usePageScroll } from '@/composables/page-scroll'
import { useSiteInteraction } from '@/composables/site-interaction'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'

import '../../assets/article-content.css'
import '../../assets/mixed-media.css'

const route = useRoute()
const { scrollToPageAnchor } = usePageAnchorScroll()
const pageScroll = usePageScroll()
const interaction = useSiteInteraction()
const state = useAppState()

const loading = ref(false)
const isPreview = computed(() => route.name === 'miletArticlePreview')
const previewId = computed(() => String(route.params.previewId || '').trim())
const previewToken = computed(() => String(route.query.token || '').trim())
const previewSession = ref('')
const articleKey = () =>
  isPreview.value
    ? `preview:${previewId.value}:${previewToken.value}`
    : `${route.params.lang}:${route.params.slug}`
const error = ref(
  state.miletArticleError?.key === articleKey() ? state.miletArticleError.payload : '',
)
const article = ref<PublicArticleDetail | null>(isPreview.value ? null : state.miletArticleData)
const articleContentRef = ref<HTMLElement | null>(null)
const mobileTocRoot = ref<HTMLElement | null>(null)
const mobileTocButton = ref<HTMLButtonElement | null>(null)
const mobileTocPanel = ref<HTMLElement | null>(null)
const mobileTocOpen = ref(false)
let articleRequestId = 0
let releaseMobileTocLock: (() => void) | null = null
const albumEmbeds = useArticleAlbumEmbeds()
const imageEnhancements = useArticleImageEnhancements()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const fallbackTitle = computed(() => (routeLang.value === 'ja' ? 'Article' : 'Article'))
const articleShareUrl = computed(() => {
  const slug = article.value?.slug || String(route.params.slug || '').trim()
  const base = getSiteOrigin().replace(/\/+$/, '')
  return `${base}/${routeLang.value}/milet/articles/${encodeURIComponent(slug)}`
})
const articleCoverShareUrl = computed(() => {
  const image = article.value?.coverImage
  const url = image?.urlWebp || image?.urlOriginal || image?.prelink || image?.link || ''
  if (!url) return ''
  return buildStaticAssetAbsoluteUrl(url, image?.storage || 'milet')
})

function articleEnhancementKey() {
  return article.value?.id ? String(article.value.id) : String(route.params.slug || 'current')
}

async function setupArticleEnhancements() {
  if (import.meta.env.SSR || !article.value?.html) return
  await nextTick()
  await albumEmbeds.mount(articleContentRef.value, routeLang.value, isPreview.value
    ? { previewId: previewId.value, previewSession: previewSession.value }
    : { articleSlug: article.value.slug || String(route.params.slug || '') })
  await imageEnhancements.enhance(articleContentRef.value, articleEnhancementKey())
}

function cleanupArticleEnhancements() {
  albumEmbeds.cleanup()
  imageEnhancements.cleanup()
}

async function fetchArticle() {
  const requestId = ++articleRequestId
  cleanupArticleEnhancements()
  const slug = String(route.params.slug || '').trim()
  if ((!isPreview.value && !slug) || (isPreview.value && (!previewId.value || !previewToken.value))) {
    error.value = 'Missing article slug.'
    return
  }
  loading.value = true
  error.value = ''
  state.miletArticleError = null
  let shouldSetupEnhancements = false
  try {
    const response = await axiosInstance.get<{
      success: boolean
      item?: PublicArticleDetail
      previewSession?: string
      message?: string
    }>(
      isPreview.value
        ? `/api/articles/preview/${encodeURIComponent(previewId.value)}?token=${encodeURIComponent(previewToken.value)}`
        : `/api/articles/${routeLang.value}/${slug}`,
    )
    if (requestId !== articleRequestId) return
    if (!response.success || !response.item) {
      throw new Error(response.message || 'Article not found.')
    }
    article.value = response.item
    previewSession.value = response.previewSession || ''
    if (!isPreview.value) state.miletArticleData = response.item
    shouldSetupEnhancements = true
    interaction.announce(routeLang.value === 'ja' ? '記事を読み込みました' : '文章已加载')
  } catch (err) {
    if (requestId !== articleRequestId) return
    error.value = err instanceof Error ? err.message : 'Article load failed.'
    state.miletArticleError = { key: articleKey(), payload: error.value }
    article.value = null
    if (!isPreview.value) state.miletArticleData = null
    interaction.announce(routeLang.value === 'ja' ? '記事の読み込みに失敗しました' : '文章加载失败')
  } finally {
    if (requestId === articleRequestId) loading.value = false
  }
  if (shouldSetupEnhancements) {
    await setupArticleEnhancements()
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`
}

function handleMobileTocClick(event: MouseEvent) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('a')) {
    closeMobileToc(false)
  }
}

function closeMobileToc(restoreFocus = true) {
  mobileTocOpen.value = false
  if (restoreFocus) mobileTocButton.value?.focus({ preventScroll: true })
}

function handleMobileTocKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  closeMobileToc()
}

function handleArticleContentClick(event: MouseEvent) {
  const eventTarget = event.target
  if (!(eventTarget instanceof Element)) return

  const anchor = eventTarget.closest<HTMLAnchorElement>('a[href^="#"]')
  const href = anchor?.getAttribute('href')

  if (!anchor || !href || href === '#' || !articleContentRef.value?.contains(anchor)) return

  event.preventDefault()
  scrollToPageAnchor(href)
}

function handleMobileTocOutsidePointer(event: PointerEvent) {
  if (!mobileTocOpen.value) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (mobileTocRoot.value?.contains(target)) return
  closeMobileToc(false)
}

onServerPrefetch(fetchArticle)

onMounted(() => {
  document.addEventListener('pointerdown', handleMobileTocOutsidePointer, true)
  if (
    isPreview.value ||
    !article.value ||
    article.value.slug !== route.params.slug ||
    article.value.requestedLang !== routeLang.value
  ) {
    fetchArticle()
  } else {
    setupArticleEnhancements()
  }
})

watch(
  () => [route.params.slug, route.params.previewId, route.params.lang, route.query.token],
  () => {
    closeMobileToc(false)
    if (!import.meta.env.SSR) fetchArticle()
  },
)

watch(mobileTocOpen, async (open) => {
  releaseMobileTocLock?.()
  releaseMobileTocLock = null
  if (!open) return
  releaseMobileTocLock = pageScroll.lockPageScroll('article-mobile-toc')
  await nextTick()
  mobileTocPanel.value?.querySelector<HTMLElement>('a[href],button')?.focus({ preventScroll: true })
})

onBeforeUnmount(() => {
  articleRequestId++
  document.removeEventListener('pointerdown', handleMobileTocOutsidePointer, true)
  releaseMobileTocLock?.()
  releaseMobileTocLock = null
  cleanupArticleEnhancements()
})
</script>
