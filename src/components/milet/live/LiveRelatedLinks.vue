<template>
  <section
    v-if="groups.length"
    class="rounded-lg border border-[#d9b77c]/24 bg-[#061827]/78 p-5 shadow-[0_28px_90px_-64px_rgba(3,19,34,0.95)]"
  >
    <h2 class="font-['Montserrat','sans-serif'] text-sm font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
      Related
    </h2>

    <div class="mt-5 grid gap-5" :class="groupGridClass">
      <div v-for="group in groups" :key="group.type" class="min-w-0">
        <h3 class="text-sm font-semibold text-[#f3eadf]">{{ group.label }}</h3>

        <div class="mt-2 grid gap-2">
          <component
            :is="linkTag(item)"
            v-for="item in group.items"
            :key="`${item.type}:${item.id}`"
            v-bind="linkBindings(item)"
            class="group/card grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-2.5 text-sm transition hover:border-[#9fd4ff]/45 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fd4ff]/45"
          >
            <img
              v-if="item.coverImage"
              :src="item.coverImage"
              :alt="item.title"
              class="h-16 w-20 rounded object-cover"
              loading="lazy"
              decoding="async"
            />
            <span
              v-else
              class="grid h-16 w-20 place-items-center rounded bg-white/5 font-serif text-[#d9b77c]"
            >
              {{ fallbackCoverLabel(item.type) }}
            </span>

            <span class="min-w-0">
              <span class="block truncate font-medium text-[#f3eadf]">{{ item.title }}</span>
              <span class="mt-1 line-clamp-2 block text-xs leading-5 text-[#91a9ba]">
                {{ resourceDescription(item) }}
              </span>
              <span class="mt-1 block truncate text-[10px] text-[#718a9d]" :title="item.url">
                {{ item.url }}
              </span>
            </span>

            <span class="text-[#d9b77c] transition group-hover/card:translate-x-0.5" aria-hidden="true">
              {{ item.linkScope === 'external' ? '↗' : '›' }}
            </span>
          </component>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type {
  ExtraInformationGroup,
  ExtraInformationItem,
  ExtraInformationResourceType,
} from '@/composables/extraInformation'
import {
  resolveLiveImageUrl,
  type LiveLang,
  type LiveRelatedArticle,
  type LiveRelatedGallery,
} from '@/composables/liveArchive'

const props = withDefaults(
  defineProps<{
    extraInfo?: ExtraInformationGroup | null
    legacyArticles?: LiveRelatedArticle[]
    legacyGalleries?: LiveRelatedGallery[]
    lang: LiveLang
    routeLang: string
    layout?: 'auto' | 'rail'
  }>(),
  {
    extraInfo: null,
    legacyArticles: () => [],
    legacyGalleries: () => [],
    layout: 'auto',
  },
)

const normalizedRouteLang = computed(() => (props.routeLang === 'jp' ? 'ja' : props.routeLang))
const isJapanese = computed(() => props.lang === 'ja')

const items = computed<ExtraInformationItem[]>(() => {
  if (props.extraInfo?.items?.length) return props.extraInfo.items

  const articles = props.legacyArticles.map((article) => ({
    type: 'article' as const,
    id: String(article.id),
    title: article.title,
    summary: article.summary || '',
    coverImage: resolveLiveImageUrl(
      article.coverImage || article.coverImageUrl || article.coverUrlAccess || article.coverUrl,
    ),
    url:
      article.url ||
      `/${normalizedRouteLang.value}/milet/articles/${article.slug || article.id}`,
    linkScope: 'internal' as const,
  }))
  const galleries = props.legacyGalleries.map((gallery) => ({
    type: 'gallery' as const,
    id: String(gallery.id),
    title: gallery.title,
    summary: gallery.description || '',
    coverImage: resolveLiveImageUrl(
      gallery.coverImage || gallery.coverUrlAccess || gallery.coverUrl,
    ),
    url:
      gallery.url ||
      `/${normalizedRouteLang.value}/milet/galleryDetail/${gallery.galleryId || gallery.slug || gallery.id}`,
    linkScope: 'internal' as const,
  }))
  return [...articles, ...galleries]
})

const groups = computed(() => {
  const definitions: Array<{ type: ExtraInformationResourceType; label: string }> = [
    { type: 'article', label: isJapanese.value ? 'Articles' : '关联文章' },
    { type: 'external_link', label: isJapanese.value ? 'Links' : '相关链接' },
    { type: 'gallery', label: isJapanese.value ? 'Galleries' : '相册' },
  ]

  return definitions
    .map((definition) => ({
      ...definition,
      items: items.value.filter((item) => item.type === definition.type),
    }))
    .filter((group) => group.items.length)
})

const groupGridClass = computed(() => {
  if (props.layout === 'rail' || groups.value.length < 2) return ''
  return groups.value.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
})

function linkTag(item: ExtraInformationItem) {
  return item.linkScope === 'internal' ? RouterLink : 'a'
}

function linkBindings(item: ExtraInformationItem) {
  if (item.linkScope === 'internal') {
    return { to: item.url, target: '_blank', rel: 'noopener noreferrer' }
  }
  return { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
}

function fallbackCoverLabel(type: ExtraInformationResourceType) {
  if (type === 'article') return 'Article'
  if (type === 'gallery') return 'Live'
  return 'Link'
}

function resourceDescription(item: ExtraInformationItem) {
  if (item.summary) return item.summary
  if (item.type !== 'external_link') {
    return isJapanese.value ? '関連コンテンツを見る' : '查看相关内容'
  }
  try {
    return new URL(item.url).hostname
  } catch {
    return item.url
  }
}
</script>
