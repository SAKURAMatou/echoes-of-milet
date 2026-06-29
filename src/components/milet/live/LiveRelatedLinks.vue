<template>
  <section
    v-if="articles.length || galleries.length"
    class="rounded-lg border border-[#d9b77c]/24 bg-[#061827]/78 p-5 shadow-[0_28px_90px_-64px_rgba(3,19,34,0.95)]"
  >
    <h2 class="font-['Montserrat','sans-serif'] text-sm font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
      Related
    </h2>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <div v-if="articles.length" class="grid gap-2">
        <h3 class="text-sm font-semibold text-[#f3eadf]">{{ lang === 'ja' ? 'Articles' : '关联文章' }}</h3>
        <RouterLink
          v-for="article in articles.slice(0, 2)"
          :key="article.id"
          :to="articleTo(article)"
          class="group grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm transition hover:border-[#9fd4ff]/45 hover:bg-white/[0.06]"
        >
          <img
            v-if="articleCoverUrl(article)"
            :src="articleCoverUrl(article)"
            :alt="article.title"
            class="h-14 w-20 rounded object-cover"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="grid h-14 w-20 place-items-center rounded bg-white/5 font-serif text-[#d9b77c]">
            Article
          </span>
          <span class="min-w-0">
            <span class="block text-xs text-[#91a9ba]">{{ formatLiveDate(article.publishedAt || article.updatedAt) }}</span>
            <span class="mt-1 block truncate text-[#f3eadf]">{{ article.title }}</span>
          </span>
          <span class="text-[#d9b77c] transition group-hover:translate-x-0.5">›</span>
        </RouterLink>
      </div>

      <div v-if="galleries.length" class="grid gap-2">
        <h3 class="text-sm font-semibold text-[#f3eadf]">{{ lang === 'ja' ? 'Galleries' : '相册' }}</h3>
        <RouterLink
          v-for="gallery in galleries.slice(0, 2)"
          :key="gallery.id"
          :to="galleryTo(gallery)"
          class="group grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm transition hover:border-[#9fd4ff]/45 hover:bg-white/[0.06]"
        >
          <img
            v-if="galleryCoverUrl(gallery)"
            :src="galleryCoverUrl(gallery)"
            :alt="gallery.title"
            class="h-14 w-20 rounded object-cover"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="grid h-14 w-20 place-items-center rounded bg-white/5 font-serif text-[#d9b77c]">
            Live
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[#f3eadf]">{{ gallery.title }}</span>
            <span v-if="galleryPhotoCount(gallery)" class="mt-1 block text-xs text-[#91a9ba]">
              {{ galleryPhotoCount(gallery) }} photos
            </span>
          </span>
          <span class="text-[#d9b77c] transition group-hover:translate-x-0.5">›</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import {
  formatLiveDate,
  resolveLiveImageUrl,
  type LiveLang,
  type LiveRelatedArticle,
  type LiveRelatedGallery,
} from '@/composables/liveArchive'

const props = defineProps<{
  articles: LiveRelatedArticle[]
  galleries: LiveRelatedGallery[]
  lang: LiveLang
  routeLang: string
}>()

function articleTo(article: LiveRelatedArticle): RouteLocationRaw {
  if (article.url) return article.url
  return {
    name: 'miletArticle',
    params: {
      lang: props.routeLang,
      slug: article.slug || article.id,
    },
  }
}

function galleryTo(gallery: LiveRelatedGallery): RouteLocationRaw {
  if (gallery.url) return gallery.url
  return {
    name: 'galleryDetail',
    params: {
      lang: props.routeLang,
      galleryId: gallery.galleryId || gallery.slug || gallery.id,
    },
  }
}

function articleCoverUrl(article: LiveRelatedArticle) {
  return resolveLiveImageUrl(article.coverImage || article.coverUrlAccess || article.coverUrl || article.coverImageUrl)
}

function galleryCoverUrl(gallery: LiveRelatedGallery) {
  return resolveLiveImageUrl(gallery.coverImage || gallery.coverUrlAccess || gallery.coverUrl)
}

function galleryPhotoCount(gallery: LiveRelatedGallery) {
  return Number(gallery.photoCount ?? gallery.imgCount ?? 0)
}
</script>
