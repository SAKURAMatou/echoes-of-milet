<template>
  <teleport to="body">
    <transition name="track-modal" appear>
      <div v-if="open && track" class="fixed inset-0 z-50">
        <div
          class="modal-backdrop absolute inset-0 bg-slate-950/78 backdrop-blur-[8px]"
          @click="closeAll"
        ></div>

        <div class="absolute inset-0 modal-scroll">
          <div class="flex min-h-full items-start justify-center p-3 md:items-center md:p-6">
            <div
              class="modal-panel relative flex h-[calc(100dvh-24px)] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-sky-100/80 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fbff_58%,#f1f6fb_100%)] shadow-[0_44px_120px_-42px_rgba(15,23,42,0.74)] ring-1 ring-white/80 md:h-[calc(100dvh-48px)]"
              role="dialog"
              aria-modal="true"
              :aria-label="title || modalText.detailLabel"
            >
              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_52%),radial-gradient(circle_at_top_right,rgba(244,114,182,0.16),transparent_46%)]"
              ></div>

              <div
                class="relative flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 md:px-6 md:py-4"
              >
                <div class="flex min-w-0 items-start gap-3">
                  <span
                    class="mt-1 grid size-8 shrink-0 place-items-center rounded-md border border-sky-200/80 bg-sky-50 text-sky-700"
                    aria-hidden="true"
                  >
                    <svg
                      class="size-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M9 18V5l10-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="16" cy="16" r="3" />
                      <path d="M9 9l10-2" />
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <div
                      class="truncate text-lg font-semibold tracking-[0.01em] text-slate-950 md:text-[24px]"
                    >
                      {{ title }}
                    </div>
                    <div
                      class="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-slate-500 md:text-xs"
                    >
                      <span>{{ modalText.detailLabel }}</span>
                      <span class="text-slate-300">/</span>
                      <span>{{ track.singer || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2.5">
                  <button
                    class="inline-flex items-center rounded-md border border-slate-200 bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 lg:hidden"
                    :disabled="listenLoading || !hasListenData"
                    @click="openListenDrawer"
                  >
                    {{ listenLoading ? modalText.loading : modalText.listenButton }}
                  </button>
                  <button
                    class="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:h-10 md:w-10"
                    @click="closeAll"
                    aria-label="Close"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      class="h-4 w-4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 4l8 8M12 4 4 12"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="relative min-h-0 flex-1">
                <div class="panel-scroll h-full overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                  <div
                    class="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(340px,390px)] lg:items-stretch"
                  >
                    <section
                      class="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden"
                    >
                      <div
                        class="rounded-lg border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)] backdrop-blur-sm"
                      >
                        <div class="flex flex-wrap items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div
                              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/80"
                            >
                              {{ modalText.detailLabel }}
                            </div>
                            <div
                              class="mt-1.5 text-xl font-semibold tracking-[0.01em] text-slate-950 md:text-[22px]"
                            >
                              {{ title }}
                            </div>
                            <div class="mt-1 truncate text-sm text-slate-500">
                              {{ track.singer || '-' }}
                            </div>
                          </div>

                          <div class="flex flex-wrap items-center gap-2">
                            <!-- <span
                            class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                          >
                            {{ currentLanguageLabel }}
                          </span> -->
                            <span
                              class="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700"
                            >
                              {{ currentListenItems.length }} {{ modalText.listenButton }}
                            </span>
                          </div>
                        </div>

                        <div class="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                          <div
                            class="rounded-md border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5"
                          >
                            <div
                              class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
                            >
                              {{ modalText.singer }}
                            </div>
                            <div
                              class="mt-1.5 text-[13px] font-medium leading-5 text-slate-700 md:text-sm"
                            >
                              {{ track.singer || '-' }}
                            </div>
                          </div>
                          <div
                            class="rounded-md border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5"
                          >
                            <div
                              class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
                            >
                              {{ modalText.lyricists }}
                            </div>
                            <div
                              class="mt-1.5 text-[13px] font-medium leading-5 text-slate-700 md:text-sm"
                            >
                              {{ track.lyricists || '-' }}
                            </div>
                          </div>
                          <div
                            class="rounded-md border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5"
                          >
                            <div
                              class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
                            >
                              {{ modalText.composers }}
                            </div>
                            <div
                              class="mt-1.5 text-[13px] font-medium leading-5 text-slate-700 md:text-sm"
                            >
                              {{ track.composers || '-' }}
                            </div>
                          </div>
                          <div
                            v-if="track.arrangers"
                            class="rounded-md border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5"
                          >
                            <div
                              class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
                            >
                              {{ modalText.arrangers }}
                            </div>
                            <div
                              class="mt-1.5 text-[13px] font-medium leading-5 text-slate-700 md:text-sm"
                            >
                              {{ track.arrangers }}
                            </div>
                          </div>
                          <div
                            class="rounded-md border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5"
                          >
                            <div
                              class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
                            >
                              {{ modalText.recordedAt }}
                            </div>
                            <div
                              class="mt-1.5 text-[13px] font-medium leading-5 text-slate-700 md:text-sm"
                            >
                              {{ track.recorded_at || '-' }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <ExtraInformationList
                        v-if="track.extraInfo?.items?.length || track.articles?.items?.length"
                        :extra-info="track.extraInfo"
                        :legacy-articles="track.articles"
                        variant="modal"
                        :lang="currentLang"
                      />

                      <div
                        class="rounded-lg border border-slate-200/80 bg-white/90 p-4 shadow-[0_28px_72px_-50px_rgba(15,23,42,0.5)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
                      >
                        <div class="mb-3 flex items-center justify-between gap-3">
                          <div class="text-sm font-semibold tracking-[0.12em] text-slate-700">
                            {{ modalText.lyric }}
                          </div>
                          <div
                            v-if="!hasListenData && !listenLoading"
                            class="text-xs font-medium text-slate-400"
                          >
                            {{ modalText.noData }}
                          </div>
                        </div>
                        <div
                          class="panel-scroll whitespace-pre-wrap text-[13px] leading-7 text-slate-700 md:text-[14px] md:leading-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:pb-4"
                        >
                          {{ track.lyric }}
                        </div>
                      </div>
                    </section>

                    <aside class="hidden lg:min-h-0 lg:h-full lg:block">
                      <div
                        class="rounded-lg border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,247,252,0.92))] p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.38)] lg:flex lg:h-full lg:min-h-0 lg:flex-col"
                      >
                        <div
                          class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                        >
                          {{ modalText.listenButton }}
                        </div>
                        <!-- <div class="mt-2 text-lg font-semibold text-slate-900">
                          {{ currentLanguageLabel }}
                        </div> -->
                        <div class="mt-2 text-sm text-slate-500">
                          {{
                            hasListenData
                              ? `${currentListenItems.length} links ready`
                              : modalText.noData
                          }}
                        </div>

                        <div
                          v-if="currentListenItems.length === 0"
                          class="mt-5 rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500"
                        >
                          {{ modalText.noData }}
                        </div>

                        <div
                          v-else
                          class="panel-scroll mt-5 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
                        >
                          <div
                            v-for="item in currentListenItems"
                            :key="`inline-${item.platformCode}-${item.url}`"
                            class="group relative overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-[0_24px_52px_-26px_rgba(14,165,233,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 lg:mx-auto lg:w-full lg:max-w-[340px]"
                            role="link"
                            tabindex="0"
                            @click="openTrackListenLink(item.url)"
                            @keydown.enter="openTrackListenLink(item.url)"
                            @keydown.space.prevent="openTrackListenLink(item.url)"
                          >
                            <div
                              class="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(135deg,rgba(186,230,253,0.28),rgba(255,255,255,0))] opacity-80"
                            ></div>
                            <div class="relative flex flex-col gap-3">
                              <div class="flex min-w-0 items-start gap-4">
                                <TrackListenPlatformIcon
                                  :platform-code="item.platformCode"
                                  class="translate-y-[-1px]"
                                />
                                <div class="min-w-0">
                                  <div class="flex flex-wrap items-center gap-2">
                                    <div
                                      class="truncate text-[15px] font-semibold tracking-[0.01em] text-slate-950"
                                    >
                                      {{ item.platformLabel || item.platformCode }}
                                    </div>
                                    <span
                                      class="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500"
                                    >
                                      {{ formatSourceTypeTag(item.sourceType) }}
                                    </span>
                                  </div>
                                  <div class="mt-1 truncate text-xs font-medium text-slate-500">
                                    {{ item.title || track.title }}
                                  </div>
                                  <div
                                    class="mt-1 truncate text-[11px] tracking-[0.08em] text-slate-400"
                                  >
                                    {{ item.artist || track.singer || item.album || item.url }}
                                  </div>
                                </div>
                              </div>
                              <a
                                :href="item.url"
                                target="_blank"
                                rel="noreferrer"
                                class="inline-flex w-full items-center justify-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold tracking-[0.01em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 active:translate-y-[1px]"
                                @click.stop
                              >
                                {{ modalText.listenAction }}
                                <svg
                                  viewBox="0 0 16 16"
                                  class="h-3.5 w-3.5"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M5 3.5h6.5V10M11.2 4.2 4.7 10.7"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>

                <transition name="listen-drawer">
                  <div
                    v-if="listenDrawerOpen"
                    class="absolute inset-y-0 right-0 z-20 w-full border-l border-white/10 bg-[linear-gradient(180deg,#0f172a_0%,#111827_55%,#0b1220_100%)] shadow-[-24px_0_80px_-42px_rgba(15,23,42,0.8)] sm:w-[430px] lg:hidden"
                  >
                    <div class="flex h-full flex-col">
                      <div class="border-b border-white/10 px-5 py-5">
                        <div
                          class="mb-4 rounded-lg border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                        >
                          <div
                            class="truncate text-base font-semibold tracking-[0.01em] text-white"
                          >
                            {{ title }}
                          </div>
                          <div class="mt-1 truncate text-sm text-white/65">
                            {{ track.singer || '-' }}
                          </div>
                        </div>
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="text-base font-semibold tracking-[0.01em] text-white">
                              {{ modalText.listenTitle }}
                            </div>
                            <div class="mt-1 text-xs font-medium tracking-[0.08em] text-white/55">
                              {{ currentLanguageLabel }}
                            </div>
                          </div>
                          <button
                            class="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                            @click="listenDrawerOpen = false"
                            aria-label="Close"
                          >
                            <svg
                              viewBox="0 0 16 16"
                              class="h-4 w-4"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M4 4l8 8M12 4 4 12"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div class="panel-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        <div
                          v-if="currentListenItems.length === 0"
                          class="rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-white/65"
                        >
                          {{ modalText.noData }}
                        </div>

                        <div v-else class="space-y-3">
                          <div
                            v-for="item in currentListenItems"
                            :key="`${item.platformCode}-${item.url}`"
                            class="group relative overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-[0_24px_52px_-26px_rgba(14,165,233,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            role="link"
                            tabindex="0"
                            @click="openTrackListenLink(item.url)"
                            @keydown.enter="openTrackListenLink(item.url)"
                            @keydown.space.prevent="openTrackListenLink(item.url)"
                          >
                            <div
                              class="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(135deg,rgba(186,230,253,0.28),rgba(255,255,255,0))] opacity-80"
                            ></div>
                            <div class="relative flex flex-col gap-3">
                              <div class="flex min-w-0 items-start gap-4">
                                <TrackListenPlatformIcon
                                  :platform-code="item.platformCode"
                                  class="translate-y-[-1px]"
                                />
                                <div class="min-w-0">
                                  <div class="flex flex-wrap items-center gap-2">
                                    <div
                                      class="truncate text-[15px] font-semibold tracking-[0.01em] text-slate-950"
                                    >
                                      {{ item.platformLabel || item.platformCode }}
                                    </div>
                                    <span
                                      class="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500"
                                    >
                                      {{ formatSourceTypeTag(item.sourceType) }}
                                    </span>
                                  </div>
                                  <div class="mt-1 truncate text-xs font-medium text-slate-500">
                                    {{ item.title || track.title }}
                                  </div>
                                  <div
                                    class="mt-1 truncate text-[11px] tracking-[0.08em] text-slate-400"
                                  >
                                    {{ item.artist || track.singer || item.album || item.url }}
                                  </div>
                                </div>
                              </div>
                              <a
                                :href="item.url"
                                target="_blank"
                                rel="noreferrer"
                                class="inline-flex w-full items-center justify-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold tracking-[0.01em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 active:translate-y-[1px]"
                                @click.stop
                              >
                                {{ modalText.listenAction }}
                                <svg
                                  viewBox="0 0 16 16"
                                  class="h-3.5 w-3.5"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M5 3.5h6.5V10M11.2 4.2 4.7 10.7"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'
import type { Track, TrackListenData } from '@/composables/releaseType'
import { usePageScroll } from '@/composables/page-scroll'
import ExtraInformationList from '@/components/milet/extra-information/ExtraInformationList.vue'
import TrackListenPlatformIcon from './TrackListenPlatformIcon.vue'

const TRACK_MODAL_TEXT = {
  zh: {
    detailLabel: '歌曲详情',
    listenButton: '试听',
    loading: '加载中...',
    listenTitle: '试听入口',
    listenAction: '打开试听',
    noData: '暂无试听数据',
    singer: '演唱',
    lyricists: '作词',
    composers: '作曲',
    arrangers: '编曲',
    recordedAt: '首发日期',
    lyric: '歌词',
    zhLabel: '当前语言：中文',
    jpLabel: '当前语言：日文',
  },
  jp: {
    detailLabel: '楽曲詳細',
    listenButton: '試聴',
    loading: '読み込み中...',
    listenTitle: '試聴リンク',
    listenAction: '開く',
    noData: '試聴データはありません',
    singer: '歌唱',
    lyricists: '作詞',
    composers: '作曲',
    arrangers: '編曲',
    recordedAt: '公開日',
    lyric: '歌詞',
    zhLabel: '現在の言語：中国語',
    jpLabel: '現在の言語：日本語',
  },
} as const

const props = defineProps<{ open: boolean; track: Track | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const pageScroll = usePageScroll()
let releasePageLock: (() => void) | null = null

const emptyListenData = (): TrackListenData => ({ jp: [], zh: [] })

const listenLoading = ref(false)
const listenDrawerOpen = ref(false)
const listenData = ref<TrackListenData>(emptyListenData())

const currentLang = computed(() => (global.$lang?.lang === 'jp' ? 'jp' : 'zh'))
const modalText = computed(() => TRACK_MODAL_TEXT[currentLang.value])
const title = computed(() => props.track?.title ?? '')
const currentListenItems = computed(() =>
  currentLang.value === 'jp' ? listenData.value.jp || [] : listenData.value.zh || [],
)
const hasListenData = computed(() => {
  return (listenData.value.jp?.length || 0) + (listenData.value.zh?.length || 0) > 0
})
const currentLanguageLabel = computed(() =>
  currentLang.value === 'jp' ? modalText.value.jpLabel : modalText.value.zhLabel,
)

function formatSourceTypeTag(sourceType: string) {
  const isManual =
    String(sourceType || '')
      .trim()
      .toLowerCase() === 'manual'

  if (currentLang.value === 'jp') {
    return isManual ? '手動' : '自動'
  }

  return isManual ? '手动' : '自动'
}

watch(
  () => [props.open, props.track?.showId, props.track?.listenData] as const,
  ([open]) => {
    listenLoading.value = false
    listenData.value = props.track?.listenData || emptyListenData()

    if (!open) {
      listenDrawerOpen.value = false
    }
  },
  { immediate: true },
)

watch(
  () => props.open,
  (open) => {
    releasePageLock?.()
    releasePageLock = open ? pageScroll.lockPageScroll('track-modal') : null
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  releasePageLock?.()
  releasePageLock = null
})

function openListenDrawer() {
  if (!hasListenData.value) {
    window.alert(modalText.value.noData)
    return
  }
  listenDrawerOpen.value = true
}

function openTrackListenLink(url: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function closeAll() {
  listenDrawerOpen.value = false
  emit('close')
}
</script>

<style scoped>
.modal-scroll {
  overflow-y: auto;
}

.modal-scroll,
.panel-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.modal-panel button:not(:disabled),
.modal-panel a[href],
.modal-panel [role='link'] {
  cursor: pointer;
}

.modal-panel button:disabled {
  cursor: not-allowed;
}

.track-modal-enter-active,
.track-modal-leave-active {
  transition: opacity 260ms ease;
}

.track-modal-enter-active .modal-backdrop,
.track-modal-leave-active .modal-backdrop {
  transition:
    opacity 260ms ease,
    backdrop-filter 260ms ease;
}

.track-modal-enter-active .modal-panel {
  transition:
    opacity 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 280ms ease;
}

.track-modal-leave-active .modal-panel {
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    filter 180ms ease;
}

.track-modal-enter-from,
.track-modal-leave-to {
  opacity: 0;
}

.track-modal-enter-from .modal-backdrop,
.track-modal-leave-to .modal-backdrop {
  opacity: 0;
  backdrop-filter: blur(0);
}

.track-modal-enter-from .modal-panel {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(18px) scale(0.97);
}

.track-modal-leave-to .modal-panel {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(10px) scale(0.98);
}

.listen-drawer-enter-active,
.listen-drawer-leave-active {
  transition:
    transform 220ms ease,
    opacity 220ms ease;
}

.listen-drawer-enter-from,
.listen-drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
