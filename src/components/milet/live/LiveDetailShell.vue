<template>
  <div class="min-h-svh bg-[#031322] text-[#f3eadf]">
    <header
      class="sticky top-0 z-40 border-b border-[#d9b77c]/18 bg-[#031322]/88 px-4 py-3 backdrop-blur-xl sm:px-7"
    >
      <div class="mx-auto grid max-w-7xl gap-2">
        <div class="flex items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <RouterLink
              :to="{ name: 'milet', params: { lang: routeLang } }"
              class="shrink-0 font-serif text-xl leading-none text-[#f5eadc] transition hover:text-[#d9b77c]"
            >
              Echoes of milet
            </RouterLink>
            <RouterLink
              :to="{ name: 'miletLiveArchive', params: { lang: routeLang } }"
              class="hidden items-center gap-2 text-xs font-semibold text-[#b8c8d5] transition hover:text-[#f5eadc] sm:inline-flex"
            >
              <span aria-hidden="true">←</span>
              <span>{{ routeLang === 'ja' ? 'Back to Live Archive' : '返回 Live Archive' }}</span>
            </RouterLink>
          </div>

          <div class="flex shrink-0 items-center gap-3 font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.16em] text-[#d9b77c]">
            <RouterLink :to="zhRoute" class="transition hover:text-white">ZH</RouterLink>
            <span class="text-[#d9b77c]/45">/</span>
            <RouterLink :to="jaRoute" class="transition hover:text-white">JA</RouterLink>
          </div>
        </div>

        <RouterLink
          :to="{ name: 'miletLiveArchive', params: { lang: routeLang } }"
          class="inline-flex w-fit items-center gap-2 text-xs font-semibold text-[#b8c8d5] transition hover:text-[#f5eadc] sm:hidden"
        >
            <span aria-hidden="true">←</span>
            <span>{{ routeLang === 'ja' ? 'Back to Live Archive' : '返回 Live Archive' }}</span>
        </RouterLink>
      </div>
    </header>

    <main
      class="relative min-h-[calc(100svh-3.5rem)] overflow-hidden bg-[radial-gradient(circle_at_50%_5%,rgba(87,140,176,0.35),transparent_34rem),radial-gradient(circle_at_8%_38%,rgba(217,183,124,0.18),transparent_22rem),linear-gradient(180deg,#031322_0%,#061827_46%,#03111e_100%)]"
    >
      <div
        class="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px]"
        aria-hidden="true"
      ></div>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))

const zhRoute = computed(() => ({
  name: route.name || 'miletLiveArchive',
  params: {
    ...route.params,
    lang: 'zh',
  },
  query: route.query,
}))

const jaRoute = computed(() => ({
  name: route.name || 'miletLiveArchive',
  params: {
    ...route.params,
    lang: 'ja',
  },
  query: route.query,
}))
</script>
