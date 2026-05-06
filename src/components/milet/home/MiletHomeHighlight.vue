<template>
  <section id="highlight" class="mt-16 scroll-mt-24">
    <MiletHomeSectionTitle
      :kicker="title.kicker"
      :title="title.title"
      :subtitle="title.subtitle"
    />
    <div class="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
      <component
        :is="componentTag(item)"
        v-for="item in items"
        :key="item.id"
        v-bind="linkProps(item)"
        :class="cardClass(item)"
        @click="handleClick($event, item)"
      >
        <template v-if="item.variant === 'imageHero'">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.imageAlt"
            class="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-[1.03]"
          />
          <div
            class="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.2)_0%,rgba(17,24,39,0.84)_100%)]"
          ></div>
          <div class="relative flex h-full min-h-[330px] flex-col justify-end p-6">
            <span class="text-xs font-semibold uppercase text-[#9bd8d2]">{{ item.badge }}</span>
            <h2 class="mt-3 font-serif text-4xl leading-tight">{{ item.title }}</h2>
            <p class="mt-4 max-w-[360px] text-sm leading-7 text-white/80">
              {{ item.description }}
            </p>
            <span class="mt-6 inline-flex text-sm font-semibold text-[#d8f4ef]">
              {{ item.actionLabel }}
            </span>
          </div>
        </template>

        <template v-else>
          <div>
            <span class="text-xs font-semibold uppercase text-[#886d21]">{{ item.badge }}</span>
            <h2 class="mt-4 font-serif text-4xl leading-tight text-[#2e3338]">{{ item.title }}</h2>
            <p class="mt-5 text-sm leading-7 text-[#5a5d59]">
              {{ item.description }}
            </p>
          </div>
          <div
            class="mt-8 border-t border-[#e3cd89] pt-5 text-sm font-semibold text-[#7a5f13] transition group-hover:text-[#23313d]"
          >
            {{ item.actionLabel }}
          </div>
        </template>
      </component>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MiletHomeSectionTitle from './MiletHomeSectionTitle.vue'
import type { MiletHomeHighlightViewItem, MiletHomeSectionTitleView } from './types'

defineProps<{
  title: MiletHomeSectionTitleView
  items: MiletHomeHighlightViewItem[]
}>()

const emit = defineEmits<{
  (event: 'selectMusic', item: MiletHomeHighlightViewItem): void
}>()

const imageHeroClass =
  'group relative min-h-[330px] overflow-hidden rounded-lg border border-white/70 bg-[#1f2933] text-left text-white shadow-[0_26px_70px_-46px_rgba(15,23,42,0.95)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_82px_-44px_rgba(15,23,42,0.98)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70'
const softCardClass =
  'group flex min-h-[330px] flex-col justify-between rounded-lg border border-[#ead7a6]/70 bg-[#fff8e4]/80 p-6 text-left shadow-[0_18px_58px_-42px_rgba(85,70,36,0.85)] transition duration-300 hover:-translate-y-1 hover:border-[#d9bb66] hover:bg-[#fff5d4] hover:shadow-[0_26px_68px_-42px_rgba(85,70,36,0.92)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100'

function isMusicItem(item: MiletHomeHighlightViewItem) {
  return item.kind === 'music' || item.kind === 'release'
}

function cardClass(item: MiletHomeHighlightViewItem) {
  return [
    item.variant === 'imageHero' ? imageHeroClass : softCardClass,
    isMusicItem(item) ? 'cursor-pointer' : '',
  ]
}

function componentTag(item: MiletHomeHighlightViewItem) {
  if (isMusicItem(item)) return 'button'
  return item.href ? 'a' : RouterLink
}

function linkProps(item: MiletHomeHighlightViewItem) {
  if (isMusicItem(item)) {
    return {
      type: 'button',
    }
  }

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

function handleClick(event: MouseEvent, item: MiletHomeHighlightViewItem) {
  if (!isMusicItem(item)) return
  event.preventDefault()
  emit('selectMusic', item)
}
</script>
