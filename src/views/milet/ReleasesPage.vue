<template>
  <article
    class="release-page overflow-visible rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,253,255,0.78))] text-[#1e2a35]"
  >
    <div
      class="sticky top-16 z-30 grid grid-cols-3 gap-1.5 border-b border-slate-200/80 bg-white/80 p-2 backdrop-blur-[14px] md:hidden"
    >
      <button
        type="button"
        class="min-h-[2.6rem] rounded-md border border-slate-300/80 bg-white/75 px-1.5 py-1 text-[0.86rem] font-bold leading-tight text-[#143d63] transition hover:bg-sky-50"
        @click="drawerOpen = true"
      >
        {{ pageText.stackMap.desc }}
      </button>
      <button
        type="button"
        class="min-h-[2.6rem] rounded-md border px-1.5 py-1 text-[0.86rem] font-bold leading-tight transition hover:bg-sky-50"
        :class="
          viewMode === 'list'
            ? 'border-[#317f8d] bg-[#317f8d] text-white hover:bg-[#317f8d]'
            : 'border-slate-300/80 bg-white/75 text-[#143d63]'
        "
        :aria-label="pageText.page.listViewAria"
        @click="viewMode = 'list'"
      >
        {{ pageText.page.listView }}
      </button>
      <button
        type="button"
        class="min-h-[2.6rem] rounded-md border px-1.5 py-1 text-[0.86rem] font-bold leading-tight transition hover:bg-sky-50"
        :class="
          viewMode === 'shelf'
            ? 'border-[#317f8d] bg-[#317f8d] text-white hover:bg-[#317f8d]'
            : 'border-slate-300/80 bg-white/75 text-[#143d63]'
        "
        :aria-label="pageText.page.shelfViewAria"
        @click="viewMode = 'shelf'"
      >
        {{ pageText.page.shelfView }}
      </button>
    </div>

    <section class="release-hero relative overflow-hidden px-4 py-7 sm:px-6 md:px-8 md:py-8">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(186,230,253,0.58),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,249,255,0.54))]"
      ></div>
      <div class="release-hero-photo pointer-events-none absolute inset-y-0 right-0 w-[42%]"></div>
      <div class="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_282px] lg:items-start">
        <div>
          <p class="text-xs font-medium tracking-[0.16em] text-[#317f8d]">
            {{ pageText.page.current }}
          </p>
          <h1 class="milet-page-title-font mt-5 text-6xl leading-none text-[#143d63] md:text-7xl">
            {{ pageText.page.title }}
          </h1>
          <p class="mt-5 max-w-xl text-sm leading-7 text-slate-600">
            {{ pageText.page.lead }}
            <br />
            {{ pageText.page.sublead }}
          </p>

        </div>

        <aside
          class="relative w-[min(100%,282px)] justify-self-end text-[#173e63] max-lg:justify-self-start max-lg:w-full max-md:hidden"
        >
          <div class="mb-5 flex justify-end">
            <div class="inline-flex overflow-hidden rounded-md border border-slate-200/80 bg-white/78 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.7)]">
              <button
                type="button"
                class="min-h-10 px-4 text-sm font-semibold transition"
                :class="viewMode === 'list' ? 'bg-[#317f8d] text-white' : 'text-slate-500 hover:bg-sky-50'"
                :aria-label="pageText.page.listViewAria"
                @click="viewMode = 'list'"
              >
                {{ pageText.page.listView }}
              </button>
              <button
                type="button"
                class="min-h-10 border-l border-slate-200/80 px-4 text-sm font-semibold transition"
                :class="viewMode === 'shelf' ? 'bg-[#317f8d] text-white' : 'text-slate-500 hover:bg-sky-50'"
                :aria-label="pageText.page.shelfViewAria"
                @click="viewMode = 'shelf'"
              >
                {{ pageText.page.shelfView }}
              </button>
            </div>
          </div>

          <div class="release-archive-map__title relative ml-[2.35rem] flex items-center gap-[0.85rem] max-lg:ml-0">
            <div>
              <div class="text-sm font-serif text-[#143d63]">
                {{ pageText.page.archiveTitle }}
              </div>
            </div>
          </div>

          <nav
            class="release-archive-map__nav relative mt-5 grid gap-[1.02rem]"
            :aria-label="pageText.page.archiveTitle"
          >
            <a
              v-for="chapter in chapters"
              :key="chapter.key"
              :href="`#${chapter.anchorId}`"
              class="relative grid w-full grid-cols-[1.45rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.35rem] py-0.5 pl-px text-left transition hover:translate-x-0.5 hover:text-[#317f8d]"
            >
              <span
                class="relative z-[1] flex h-[0.78rem] w-[0.78rem] justify-self-center rounded-full border border-[#317f8d] bg-white/85"
              >
                <span class="m-auto block h-[0.34rem] w-[0.34rem] rounded-full bg-[#317f8d]"></span>
              </span>
              <span>
                <span class="block text-base font-semibold text-[#143d63]">{{ chapter.title }}</span>
                <span class="text-xs text-slate-500">{{ chapter.subtitle }}</span>
              </span>
              <span class="font-montserrat text-[0.86rem] tabular-nums text-slate-600/80">
                {{ chapter.countLabel }}
              </span>
            </a>
          </nav>
        </aside>
      </div>
    </section>

    <div class="space-y-10 px-4 pb-8 pt-5 sm:px-6 md:px-8">
      <ReleaseSection
        section-id="chapter-albums"
        section-key="album"
        :title="pageText.title.album"
        :subtitle="pageText.subtitle.album"
        :works="albums"
        :total="albumsData.total.value"
        :loading="albumsData.loading.value"
        :error="albumsData.error.value"
        :has-more="albumsData.hasMore.value"
        :view-mode="viewMode"
        @load-more="albumsData.loadMore"
        @retry="albumsData.retry"
      />

      <ReleaseSection
        section-id="chapter-ep-single"
        section-key="ep"
        :title="pageText.title.ep"
        :subtitle="pageText.subtitle.ep"
        :works="epsSingles"
        :total="epsSinglesData.total.value"
        :loading="epsSinglesData.loading.value"
        :error="epsSinglesData.error.value"
        :has-more="epsSinglesData.hasMore.value"
        :view-mode="viewMode"
        @load-more="epsSinglesData.loadMore"
        @retry="epsSinglesData.retry"
      />

      <ReleaseSection
        section-id="chapter-live"
        section-key="live"
        :title="pageText.title.live"
        :subtitle="pageText.subtitle.live"
        :works="lives"
        :total="livesData.total.value"
        :loading="livesData.loading.value"
        :error="livesData.error.value"
        :has-more="livesData.hasMore.value"
        :view-mode="viewMode"
        @load-more="livesData.loadMore"
        @retry="livesData.retry"
      />
    </div>
  </article>

  <Teleport to="body">
    <StackMapDrawer
      :open="drawerOpen"
      :chapters="chapters"
      @close="drawerOpen = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import ReleaseSection from '@/components/milet/music/ReleaseSection.vue'
import StackMapDrawer from '@/components/milet/music/StackMapDrawer.vue'
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { useReleaseData } from '@/composables/useReleaseData'
import { RELEASE_PAGE_TEXT } from '@/composables/lang/ReleaseMetaData'
import { initImgUrl } from '@/composables/ImgUrlUtil'

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties

const currentLang = computed(() => (global.$lang?.lang === 'jp' ? 'jp' : 'zh'))
const pageText = computed(() => RELEASE_PAGE_TEXT[currentLang.value])

const albumsData = useReleaseData({ type: 1, elementId: 'chapter-albums' })
const epsSinglesData = useReleaseData({ type: 2, elementId: 'chapter-ep-single' })
const livesData = useReleaseData({ type: 3, elementId: 'chapter-live' })

const albums = computed(() => albumsData.data.value)
const epsSingles = computed(() => epsSinglesData.data.value)
const lives = computed(() => livesData.data.value)
const drawerOpen = ref(false)
const viewMode = ref<'list' | 'shelf'>('list')

function chapterCovers(works: typeof albums.value) {
  return works.slice(0, 4).map((work) => ({
    id: work.id,
    title: work.title,
    coverUrl: work.coverUrl ? initImgUrl(work.coverUrl) : '',
  }))
}

function countLabel(loaded: number, total: number) {
  if (total <= 0) {
    return loaded > 0 ? `${loaded}` : '--'
  }

  return `${loaded} / ${total}`
}

function chapterSubtitle(loaded: number, total: number) {
  const count = countLabel(loaded, total)
  return count === '--'
    ? pageText.value.chapter.all
    : `${count} ${pageText.value.chapter.releases}`
}

const chapters = computed(() => [
  {
    key: 'ALBUMS',
    title: pageText.value.title.album,
    subtitle: chapterSubtitle(albums.value.length, albumsData.total.value),
    loaded: albums.value.length,
    total: albumsData.total.value || albums.value.length,
    countLabel: countLabel(albums.value.length, albumsData.total.value),
    works: albums.value,
    anchorId: 'chapter-albums',
    covers: chapterCovers(albums.value),
  },
  {
    key: 'EP_SINGLE',
    title: pageText.value.title.ep,
    subtitle: chapterSubtitle(epsSingles.value.length, epsSinglesData.total.value),
    loaded: epsSingles.value.length,
    total: epsSinglesData.total.value || epsSingles.value.length,
    countLabel: countLabel(epsSingles.value.length, epsSinglesData.total.value),
    works: epsSingles.value,
    anchorId: 'chapter-ep-single',
    covers: chapterCovers(epsSingles.value),
  },
  {
    key: 'LIVE',
    title: pageText.value.title.live,
    subtitle: chapterSubtitle(lives.value.length, livesData.total.value),
    loaded: lives.value.length,
    total: livesData.total.value || lives.value.length,
    countLabel: countLabel(lives.value.length, livesData.total.value),
    works: lives.value,
    anchorId: 'chapter-live',
    covers: chapterCovers(lives.value),
  },
])

onMounted(() => {
  document.title = pageText.value.metaTitle
})
</script>

<style scoped>
.release-hero-photo {
  inset: 0;
  width: auto;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(239, 248, 255, 0.02)),
    url('/background/release-hero-bg.png') center right / cover no-repeat;
  opacity: 0.92;
}

.release-archive-map__title::after {
  content: '';
  flex: 1;
  height: 1px;
  min-width: 5.25rem;
  background: linear-gradient(90deg, rgba(184, 148, 68, 0.82), rgba(184, 148, 68, 0.16));
}

.release-archive-map__nav::before {
  content: '';
  position: absolute;
  bottom: 0.7rem;
  left: 0.725rem;
  top: 0.7rem;
  width: 1px;
  background: rgba(100, 116, 139, 0.34);
}
</style>
