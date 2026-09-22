<template>
  <section
    class="mx-auto min-h-[calc(100svh-5rem)] w-full max-w-5xl overflow-hidden rounded-lg bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] text-[#1e2a35]"
  >
    <header
      class="relative isolate overflow-hidden border-b border-sky-100 bg-[radial-gradient(circle_at_78%_5%,rgba(186,230,253,0.6),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,249,255,0.5))] px-4 py-9 sm:px-8 sm:py-12"
    >
      <img
        src="/background/article-hero-bg.png"
        alt=""
        aria-hidden="true"
        fetchpriority="high"
        class="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-right opacity-60 sm:opacity-85"
      />
      <div
        class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.94),rgba(240,249,255,0.72)_55%,rgba(240,249,255,0.08))]"
        aria-hidden="true"
      ></div>
      <p class="font-montserrat text-xs font-semibold uppercase tracking-[0.18em] text-[#317f8d]">
        CURRENT: Articles
      </p>
      <h1
        class="milet-page-title-font mt-5 text-5xl leading-none text-[#143d63] sm:text-6xl md:text-7xl"
      >
        Article Archive
      </h1>
      <p class="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600">{{ text.lead }}</p>
      <div class="mt-8 flex items-center gap-4 text-xs tracking-widest text-[#317f8d]">
        <span>{{ text.label }}</span>
        <span
          class="h-px flex-1 bg-[linear-gradient(90deg,rgba(184,148,68,0.65),transparent)]"
          aria-hidden="true"
        ></span>
        <span v-if="!loading && !error" class="tabular-nums"
          >{{ items.length }} {{ lang === 'ja' ? '記事' : '篇文章' }}</span
        >
      </div>
    </header>
    <div class="px-4 py-6 sm:px-8 sm:py-8">
      <EchoAsyncState v-if="loading" state="loading" :title="text.loading" />
      <EchoAsyncState
        v-else-if="error"
        class="[&_button]:shrink-0 [&_button]:whitespace-nowrap"
        state="error"
        :title="text.error"
        :description="error"
        :action-label="text.retry"
        @action="load"
      />
      <EchoAsyncState
        v-else-if="!items.length"
        state="empty"
        :title="text.empty"
        :description="text.emptyDescription"
      />
      <ol v-else class="space-y-4">
        <li v-for="(item, index) in items" :key="item.id">
          <RouterLink
            :to="{ name: 'miletArticle', params: { lang, slug: item.slug } }"
            class="group grid min-w-0 gap-4 rounded-lg border border-white/90 bg-white/75 p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.4)] transition hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:gap-6 sm:p-7"
          >
            <div
              class="flex items-center gap-3 text-xs text-[#317f8d] sm:flex-col sm:items-start sm:gap-4"
            >
              <span class="font-serif text-2xl text-[#b89444]">{{
                String(index + 1).padStart(2, '0')
              }}</span>
              <time v-if="item.publishedAt" :datetime="item.publishedAt">{{
                item.publishedAt.slice(0, 10).replace(/-/g, '.')
              }}</time>
            </div>
            <div class="min-w-0">
              <h2
                class="break-words font-serif text-xl leading-relaxed text-[#143d63] transition group-hover:text-[#317f8d] sm:text-2xl"
              >
                {{ item.title }}
              </h2>
              <p
                v-if="item.summary"
                class="mt-3 line-clamp-3 break-words text-sm leading-7 text-slate-600"
              >
                {{ item.summary }}
              </p>
              <p v-if="item.lang !== lang" class="mt-3 text-xs text-slate-500">
                {{ item.lang === 'ja' ? '日本語' : '中文' }} · {{ text.original }}
              </p>
            </div>
            <span class="self-end text-xs font-semibold text-[#317f8d] sm:self-center"
              >{{ text.read }} <span aria-hidden="true">↗</span></span
            >
          </RouterLink>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'
import { usePublicArticles } from '@/composables/usePublicArticles'

const { items, error, loading, lang, load } = usePublicArticles()
const text = computed(() =>
  lang.value === 'ja'
    ? {
        lead: '音楽とライブ、心に残る瞬間。milet と歩んだ日々を、言葉でたどる。',
        label: '記事アーカイブ',
        loading: '記事を読み込んでいます',
        error: '記事を読み込めませんでした',
        retry: '再試行',
        empty: '記事はまだありません',
        emptyDescription: '新しい記録が公開されるまで、しばらくお待ちください。',
        original: '原文で読む',
        read: '記事を読む',
      }
    : {
        lead: '关于音乐、现场与那些留在心里的瞬间。在文字之间，重温与 milet 一同走过的日子。',
        label: '文章档案',
        loading: '正在读取文章',
        error: '暂时无法读取文章',
        retry: '重试',
        empty: '还没有公开文章',
        emptyDescription: '新的记录正在路上，期待与你在这里相遇。',
        original: '阅读原文',
        read: '阅读全文',
      },
)
</script>
