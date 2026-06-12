<template>
  <div class="article-reading-page">
    <Header :showHanbor="false" />
    <LanguageSelect class="max-md:hidden" />

    <div v-if="article?.toc?.length" class="article-mobile-toc">
      <button
        type="button"
        class="article-mobile-toc__button"
        aria-controls="article-mobile-toc-panel"
        :aria-expanded="mobileTocOpen"
        @click="mobileTocOpen = !mobileTocOpen"
      >
        <span>{{ routeLang === 'ja' ? 'Contents' : '目录' }}</span>
        <svg
          class="article-mobile-toc__icon"
          :class="{ 'article-mobile-toc__icon--open': mobileTocOpen }"
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
          class="article-mobile-toc__panel"
          @click="handleMobileTocClick"
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
      class="article-detail-shell"
      :class="{ 'article-detail-shell--with-mobile-toc': article?.toc?.length }"
    >
      <article
        class="article-page min-h-[calc(100svh-5rem)] overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,253,255,0.9))] text-[#1e2a35]"
      >
        <div
          class="relative overflow-hidden border-b border-slate-200/80 px-4 py-8 sm:px-6 md:px-8 md:py-10"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_12%,rgba(186,230,253,0.52),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,249,255,0.5))]"
          ></div>
          <div class="relative mx-auto max-w-4xl">
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
              <span
                v-if="article?.fallbackLang"
                class="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[#317f8d]"
              >
                fallback: {{ article.fallbackLang }}
              </span>
            </div>
          </div>
        </div>

        <div class="article-body-layout mx-auto px-4 py-8 sm:px-6 md:px-8 md:py-10">
          <div
            v-if="loading"
            class="rounded-lg border border-dashed border-slate-200 bg-white/72 p-8 text-center text-sm text-slate-500"
          >
            loading...
          </div>
          <div
            v-else-if="error"
            class="rounded-lg border border-dashed border-rose-200 bg-rose-50/70 p-8 text-center text-sm text-rose-700"
          >
            {{ error }}
          </div>
          <div v-else-if="article?.html" class="article-content" v-html="article.html"></div>
          <div
            v-else
            class="rounded-lg border border-dashed border-slate-200 bg-white/72 p-8 text-center text-sm text-slate-500"
          >
            No article content.
          </div>
        </div>
      </article>

      <aside v-if="article?.toc?.length" class="article-side-toc">
        <ArticleToc :items="article.toc" :title="routeLang === 'ja' ? 'Contents' : '目录'" />
      </aside>
    </main>

    <div class="fixed bottom-4 right-4 z-50">
      <TWUpToTop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/AxiosUtil'
import Header from '@/components/TWHeader.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'
import TWUpToTop from '@/components/TWUpToTop.vue'
import ArticleToc from '@/components/milet/article/ArticleToc.vue'
import { useAppState } from '@/composables/useAppState'
import type { PublicArticleDetail } from '@/composables/articleType'

import '../../assets/article-content.css'
import '../../assets/mixed-media.css'

const route = useRoute()
const state = useAppState()
const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties

const loading = ref(false)
const error = ref('')
const article = ref<PublicArticleDetail | null>(state.miletArticleData)
const mobileTocOpen = ref(false)
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const fallbackTitle = computed(() => (routeLang.value === 'ja' ? 'Article' : 'Article'))

async function fetchArticle() {
  const slug = String(route.params.slug || '').trim()
  if (!slug) {
    error.value = 'Missing article slug.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const response = await axiosInstance.get<{
      success: boolean
      item?: PublicArticleDetail
      message?: string
    }>(`/api/articles/${routeLang.value}/${slug}`)
    if (!response.success || !response.item) {
      throw new Error(response.message || 'Article not found.')
    }
    article.value = response.item
    state.miletArticleData = response.item
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Article load failed.'
    article.value = null
    state.miletArticleData = null
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function handleMobileTocClick(event: MouseEvent) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('a')) {
    mobileTocOpen.value = false
  }
}

onServerPrefetch(fetchArticle)

onMounted(() => {
  const currentLang = global.$lang?.lang === 'jp' ? 'ja' : 'zh'
  if (
    !article.value ||
    article.value.slug !== route.params.slug ||
    article.value.requestedLang !== currentLang
  ) {
    fetchArticle()
  }
  if (article.value?.title) document.title = `${article.value.title} | Echoes of milet`
})

watch(
  () => [route.params.slug, route.params.lang],
  () => {
    mobileTocOpen.value = false
    if (!import.meta.env.SSR) fetchArticle()
  },
)
</script>

<style scoped>
.article-content {
  color: #243447;
  font-size: 1rem;
  line-height: 1.9;
}

.article-reading-page {
  min-height: 100svh;
}

.article-mobile-toc {
  position: fixed;
  top: 3.45rem;
  right: 0;
  left: 0;
  z-index: 40;
  display: block;
  padding: 0.5rem 1rem 0;
  pointer-events: none;
}

.article-mobile-toc__button {
  display: flex;
  width: min(100%, 28rem);
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-inline: auto;
  border: 1px solid rgba(171, 209, 223, 0.72);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(239, 249, 255, 0.86)),
    radial-gradient(circle at 92% 0, rgba(186, 230, 253, 0.36), transparent 9rem);
  box-shadow: 0 16px 42px -32px rgba(20, 61, 99, 0.72);
  color: #143d63;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(16px);
  pointer-events: auto;
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.article-mobile-toc__button:active {
  transform: translateY(1px);
}

.article-mobile-toc__icon {
  width: 1rem;
  height: 1rem;
  color: #317f8d;
  transition: transform 0.18s ease;
}

.article-mobile-toc__icon--open {
  transform: rotate(180deg);
}

.article-mobile-toc__panel {
  width: min(100%, 28rem);
  margin: 0.5rem auto 0;
  border: 1px solid rgba(171, 209, 223, 0.72);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 250, 255, 0.9)),
    radial-gradient(circle at 100% 0, rgba(186, 230, 253, 0.28), transparent 10rem);
  box-shadow: 0 24px 58px -34px rgba(20, 61, 99, 0.72);
  backdrop-filter: blur(18px);
  pointer-events: auto;
}

.article-mobile-toc-panel-enter-active,
.article-mobile-toc-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.article-mobile-toc-panel-enter-from,
.article-mobile-toc-panel-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.article-detail-shell {
  --article-shell-top-offset: 4rem;

  display: flex;
  min-height: 100svh;
  width: 100%;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--article-shell-top-offset) + clamp(1rem, 2.8vw, 2.5rem)) clamp(1rem, 2.8vw, 2.5rem)
    clamp(1rem, 2.8vw, 2.5rem);
  background:
    radial-gradient(circle at 16% 7%, rgba(186, 230, 253, 0.45), transparent 24rem),
    radial-gradient(circle at 88% 22%, rgba(204, 251, 241, 0.3), transparent 20rem),
    linear-gradient(180deg, #f7fbfd 0%, #eef8fb 48%, #f8fbfd 100%);
}

.article-detail-shell--with-mobile-toc {
  --article-shell-top-offset: 7.25rem;
}

.article-page {
  min-width: 0;
  width: min(100%, 70.25rem);
  box-shadow: 0 28px 90px -66px rgba(15, 23, 42, 0.65);
}

.article-body-layout {
  width: min(100%, var(--article-readable-max-width, 56rem));
  max-width: var(--article-readable-max-width, 56rem);
}

.article-side-toc {
  display: none;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  color: #143d63;
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.25;
  margin: 2.2rem 0 0.9rem;
}

.article-content :deep(p) {
  margin: 1rem 0;
}

.article-content :deep(a) {
  color: #317f8d;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.article-content :deep([id]) {
  scroll-margin-top: 6rem;
}

.article-content :deep(img) {
  border-radius: 0.5rem;
  box-shadow: 0 24px 70px -48px rgba(15, 23, 42, 0.7);
  max-width: 100%;
}

.article-content :deep(blockquote) {
  border-left: 3px solid rgba(49, 127, 141, 0.45);
  color: #475569;
  margin: 1.5rem 0;
  padding-left: 1rem;
}

@media (min-width: 1180px) {
  .article-mobile-toc {
    display: none;
  }

  .article-detail-shell {
    --article-shell-top-offset: 4rem;

    display: grid;
    grid-template-columns: minmax(0, 70.25rem) minmax(13rem, 15rem);
    justify-content: center;
    align-items: start;
    gap: clamp(1.5rem, 3vw, 2.75rem);
    padding-inline: clamp(1.5rem, 4vw, 4rem);
  }

  .article-side-toc {
    display: block;
    min-width: 0;
    align-self: start;
    width: 100%;
  }
}
</style>
