<template>
  <section id="links" class="mt-16 scroll-mt-24">
    <div class="flex flex-wrap gap-x-4 gap-y-2 items-baseline">
      <div class="section-kicker">official</div>
      <h2 class="font-serif text-3xl text-[#26313a]">{{ official.title }}</h2>
      <!-- <p class="max-w-[360px] text-sm leading-6 text-[#60707a] sm:text-right">
        {{ official.body }}
      </p> -->
    </div>

    <div class="mt-7 space-y-8">
      <section
        class="overflow-hidden rounded-lg border border-white/70 bg-white/58 p-4 shadow-[0_18px_54px_-44px_rgba(31,41,55,0.8)] sm:p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="text-sm font-semibold uppercase text-[#8c4855]">official sns</div>
          <div
            class="h-px flex-1 bg-[linear-gradient(90deg,rgba(140,72,85,0.28),transparent)]"
          ></div>
        </div>
        <div class="mt-5 grid gap-5 md:grid-cols-2">
          <div
            class="min-w-0 overflow-hidden rounded-lg border border-white/70 bg-white/62 p-3 sm:p-4"
          >
            <a
              :href="official.instagramProfileUrl"
              target="_blank"
              rel="noreferrer"
              class="mb-3 flex min-w-0 flex-wrap items-center gap-3 text-base font-semibold text-[#26313a]"
            >
              <img :src="instagramIcon" alt="" class="h-8 w-8 object-contain" />
              Instagram
              <span class="text-xs font-normal text-[#60707a]">@milet_music</span>
            </a>
            <div
              ref="instagramContainer"
              class="official-embed min-h-[280px] max-w-full overflow-hidden rounded-lg"
            ></div>
          </div>

          <div
            class="min-w-0 overflow-hidden rounded-lg border border-white/70 bg-white/62 p-3 sm:p-4"
          >
            <a
              :href="official.twitterProfileUrl"
              target="_blank"
              rel="noreferrer"
              class="mb-3 flex min-w-0 flex-wrap items-center gap-3 text-base font-semibold text-[#26313a]"
            >
              <img :src="twitterIcon" alt="" class="h-8 w-8 object-contain" />
              X / Twitter
              <span class="text-xs font-normal text-[#60707a]">@milet_music</span>
            </a>
            <div
              ref="twitterContainer"
              class="official-embed min-h-[280px] max-w-full overflow-hidden rounded-lg"
            ></div>
          </div>
        </div>
      </section>

      <section
        class="overflow-hidden rounded-lg border border-white/70 bg-white/58 p-4 shadow-[0_18px_54px_-44px_rgba(31,41,55,0.8)] sm:p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="text-sm font-semibold uppercase text-[#317f8d]">official website</div>
          <div
            class="h-px flex-1 bg-[linear-gradient(90deg,rgba(49,127,141,0.28),transparent)]"
          ></div>
        </div>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <a
            v-for="site in official.sites"
            :key="site.id"
            :href="site.href"
            target="_blank"
            rel="noreferrer"
            class="group overflow-hidden rounded-lg border border-white/70 bg-white/68 shadow-[0_18px_54px_-44px_rgba(31,41,55,0.82)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
          >
            <div class="aspect-[1.91/1] overflow-hidden bg-[#eef8fa]">
              <img
                :src="site.image"
                :alt="site.imageAlt"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div class="px-4 py-4">
              <div class="text-sm font-semibold uppercase text-[#317f8d]">{{ site.type }}</div>
              <h3 class="mt-1 text-base font-semibold text-[#26313a]">{{ site.label }}</h3>
              <p class="mt-2 text-sm leading-6 text-[#60707a]">{{ site.description }}</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import instagramIcon from '@/assets/nav-instagram-4.png'
import twitterIcon from '@/assets/nav-twitter-4.png'
import { loadInstagramEmbed, loadTwitterEmbed } from '@/composables/useOfficialEmbeds'
import type { MiletHomeOfficialViewSection } from './types'

const props = defineProps<{
  official: MiletHomeOfficialViewSection
}>()

const instagramContainer = ref<HTMLElement | null>(null)
const twitterContainer = ref<HTMLElement | null>(null)

async function initializeEmbeds() {
  await Promise.all([
    loadInstagramEmbed(instagramContainer.value, props.official.insPost),
    loadTwitterEmbed(twitterContainer.value, props.official.twitterPost),
  ])
}

onMounted(() => {
  initializeEmbeds()
})

watch(
  () => [props.official.insPost, props.official.twitterPost],
  () => {
    initializeEmbeds()
  },
)
</script>

<style scoped>
.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.official-embed :deep(.instagram-media),
.official-embed :deep(.twitter-tweet),
.official-embed :deep(iframe) {
  max-width: 100% !important;
  min-width: 0 !important;
  width: 100% !important;
}
</style>
