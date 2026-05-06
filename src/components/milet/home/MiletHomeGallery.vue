<template>
  <section :id="sectionId || undefined" class="mt-16 scroll-mt-24">
    <MiletHomeSectionTitle
      :kicker="title.kicker"
      :title="title.title"
      :subtitle="title.subtitle"
    />
    <div class="mt-7 columns-1 gap-4 sm:columns-2">
      <component
        :is="item.href ? 'a' : RouterLink"
        v-for="item in gallery.items"
        :key="item.id"
        v-bind="linkProps(item)"
        class="group mb-4 block break-inside-avoid overflow-hidden rounded-lg border border-white/70 bg-white/70 shadow-[0_18px_54px_-42px_rgba(31,41,55,0.82)]"
      >
        <div :class="aspectClass(item.aspect)" class="relative overflow-hidden">
          <img
            :src="item.image"
            :alt="item.imageAlt"
            class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div
            class="absolute inset-0 flex items-end bg-[linear-gradient(180deg,rgba(17,24,39,0)_35%,rgba(17,24,39,0.78)_100%)] p-5 opacity-0 transition group-hover:opacity-100"
          >
            <div class="text-white">
              <div class="text-xs font-semibold">{{ item.dateLabel }}</div>
              <p class="mt-2 text-sm leading-6 text-white/88">{{ item.caption }}</p>
            </div>
          </div>
        </div>
      </component>
    </div>
    <div class="mt-5 text-center">
      <RouterLink
        :to="gallery.moreTo"
        class="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-white/70 bg-white/75 px-5 text-sm font-semibold text-[#317f8d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:w-auto"
      >
        {{ gallery.moreLabel }}
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MiletHomeSectionTitle from './MiletHomeSectionTitle.vue'
import type {
  GalleryAspect,
  MiletHomeGalleryViewItem,
  MiletHomeGalleryViewSection,
  MiletHomeSectionTitleView,
} from './types'

withDefaults(
  defineProps<{
    title: MiletHomeSectionTitleView
    gallery: MiletHomeGalleryViewSection
    sectionId?: string | null
  }>(),
  {
    sectionId: 'gallery',
  },
)

const aspectMap: Record<GalleryAspect, string> = {
  '4/5': 'aspect-[4/5]',
  '16/10': 'aspect-[16/10]',
  '3/4': 'aspect-[3/4]',
  '5/3': 'aspect-[5/3]',
  '1/1': 'aspect-square',
}

function aspectClass(aspect: GalleryAspect) {
  return aspectMap[aspect] || aspectMap['1/1']
}

function linkProps(item: MiletHomeGalleryViewItem) {
  if (item.href) {
    return {
      href: item.href,
      target: '_blank',
      rel: 'noreferrer',
    }
  }

  return {
    to: item.to || '#',
  }
}
</script>
