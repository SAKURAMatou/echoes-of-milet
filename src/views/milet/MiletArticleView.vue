<template>
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
      <template v-else-if="article?.html">
        <div class="article-content" v-html="article.html"></div>
        <aside v-if="article.toc?.length" class="article-side-toc">
          <ArticleToc :items="article.toc" :title="routeLang === 'ja' ? 'Contents' : '目录'" />
        </aside>
      </template>
      <div
        v-else
        class="rounded-lg border border-dashed border-slate-200 bg-white/72 p-8 text-center text-sm text-slate-500"
      >
        No article content.
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/AxiosUtil'
import ArticleToc from '@/components/milet/article/ArticleToc.vue'
import { useAppState } from '@/composables/useAppState'
import type { PublicArticleDetail } from '@/composables/articleType'

import '../../assets/article-content.css'
import '../../assets/milet-article.css'

const route = useRoute()
const state = useAppState()
const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties

const loading = ref(false)
const error = ref('')
const article = ref<PublicArticleDetail | null>(state.miletArticleData)
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
    if (!import.meta.env.SSR) fetchArticle()
  },
)
</script>

<!-- <style scoped>
.article-content {
  color: #243447;
  font-size: 1rem;
  line-height: 1.9;
}

.article-body-layout {
  display: grid;
  grid-template-columns: minmax(0, 56rem);
  justify-content: center;
  max-width: 92rem;
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

.article-toc {
  position: sticky;
  top: 5.5rem;
  max-height: calc(100vh - 7rem);
  overflow: auto;
  border-left: 1px solid rgba(125, 160, 176, 0.26);
  padding-left: 1rem;
}

.article-toc__title {
  margin-bottom: 0.75rem;
  color: #317f8d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.article-toc__link {
  display: block;
  border-left: 2px solid transparent;
  padding: 0.32rem 0.4rem;
  color: #5b6c78;
  font-size: 0.82rem;
  line-height: 1.45;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease;
}

.article-toc__link:hover {
  border-left-color: #317f8d;
  background: rgba(236, 248, 251, 0.78);
  color: #143d63;
}

.article-toc__link--h2 {
  padding-left: 0.9rem;
}

.article-toc__link--h3 {
  padding-left: 1.35rem;
}

.article-toc__link--h4 {
  padding-left: 1.8rem;
  font-size: 0.78rem;
}

@media (min-width: 1180px) {
  .article-body-layout {
    grid-template-columns: minmax(0, 56rem) 14rem;
    gap: 3rem;
    align-items: start;
  }

  .article-side-toc {
    display: block;
    min-width: 0;
  }
}
</style> -->
