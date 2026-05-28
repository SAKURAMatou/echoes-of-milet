<template>
  <section :id="sectionId" class="scroll-mt-32 md:scroll-mt-14">
    <header class="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="text-xs font-medium uppercase tracking-[0.18em] text-[#317f8d]/80">
          {{ pageText.page.sectionKicker }}
        </div>
        <h2 class="mt-1 font-serif text-3xl leading-none text-[#143d63] md:text-4xl">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="mt-2 text-sm leading-6 text-slate-500">{{ subtitle }}</p>
      </div>
      <div class="text-right font-montserrat text-xs tabular-nums text-slate-500">
        <div class="text-2xl leading-none text-[#143d63]">
          {{ loadedCount }}
        </div>
        <div>{{ totalCount }} {{ pageText.chapter.releases }}</div>
      </div>
    </header>

    <div v-if="loading && works.length === 0" class="space-y-3">
      <div
        v-for="index in 3"
        :key="index"
        class="h-32 animate-pulse rounded-lg border border-sky-100/80 bg-white/58"
      ></div>
    </div>

    <WorkStack
      v-else
      :works="works"
      :view-mode="viewMode"
      :empty-text="pageText.pagination.noData"
    />

    <footer class="mt-4">
      <div
        v-if="error"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-700"
      >
        <span>{{ pageText.pagination.failed }}</span>
        <button
          type="button"
          class="rounded-md border border-rose-200 bg-white/82 px-3 py-1.5 text-xs font-semibold transition hover:bg-rose-100"
          @click="emit('retry')"
        >
          {{ pageText.pagination.retry }}
        </button>
      </div>

      <div
        v-else-if="works.length > 0"
        class="flex flex-col items-center gap-3 py-2 font-montserrat tabular-nums md:grid md:grid-cols-[1fr_auto_1fr]"
      >
        <div class="text-sm text-[#143d63] md:text-right">
          {{ loadedCount }} / {{ totalCount }} {{ pageText.chapter.archived }}
        </div>
        <button
          type="button"
          class="min-h-10 rounded-md border cursor-pointer border-[#d8c38f]/80 bg-[#fffaf0]/92 px-8 text-sm font-semibold text-[#143d63] shadow-[0_14px_34px_-26px_rgba(85,70,36,0.8)] transition hover:-translate-y-0.5 hover:border-[#b89444] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          v-if="loading || hasMore"
          @click="emit('loadMore')"
        >
          {{ loadButtonText }}
        </button>
        <div class="text-sm text-[#317f8d] md:text-left">
          {{ hasMore ? pageText.pagination.nextBatch : completeText }}
        </div>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import WorkStack from './WorkStack.vue'
import { RELEASE_PAGE_TEXT } from '@/composables/lang/ReleaseMetaData'
import type { Work } from '@/composables/releaseType'

const props = defineProps<{
  sectionId: string
  sectionKey: 'album' | 'ep' | 'live'
  title: string
  subtitle?: string
  works: Work[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  viewMode: 'list' | 'shelf'
}>()

const emit = defineEmits<{
  (event: 'loadMore'): void
  (event: 'retry'): void
}>()

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const pageText = computed(() => {
  const lang = global.$lang?.lang === 'jp' ? 'jp' : 'zh'
  return RELEASE_PAGE_TEXT[lang]
})

const loadedCount = computed(() => props.works.length)
const totalCount = computed(() => props.total || props.works.length)

const loadButtonText = computed(() => {
  if (props.loading) return pageText.value.pagination.loading
  if (!props.hasMore) return completeText.value

  return {
    album: pageText.value.pagination.loadMoreAlbum,
    ep: pageText.value.pagination.loadMoreEp,
    live: pageText.value.pagination.loadMoreLive,
  }[props.sectionKey]
})

const completeText = computed(() => {
  return {
    album: pageText.value.pagination.allAlbum,
    ep: pageText.value.pagination.allEp,
    live: pageText.value.pagination.allLive,
  }[props.sectionKey]
})
</script>
