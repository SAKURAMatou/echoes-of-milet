<template>
  <section
    :id="sectionId"
    ref="sectionRef"
    class="release-section scroll-mt-32 md:scroll-mt-14"
    :data-release-phase="phase"
    :data-release-no-animation="noAnimation ? 'true' : undefined"
    :style="sectionStyle"
  >
    <header
      ref="chapterHeaderRef"
      class="release-chapter-header mb-4 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-transparent px-2 py-2"
      :class="
        stackEnabled
          ? 'sticky border-white/75 bg-white/92 shadow-[0_12px_30px_-24px_rgba(15,61,99,0.7)] backdrop-blur'
          : ''
      "
    >
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

    <div v-if="stackEnabled" class="release-spine-anchor">
      <ReleaseSpineDeck :works="visibleSpineWorks" :hidden-count="hiddenSpineCount" />
    </div>

    <div v-if="loading && works.length === 0" class="space-y-3">
      <div
        v-for="index in 3"
        :key="index"
        class="h-32 animate-pulse rounded-lg border border-sky-100/80 bg-white/58 motion-reduce:animate-none"
      ></div>
    </div>

    <WorkStack
      v-else
      :works="works"
      :view-mode="viewMode"
      :empty-text="pageText.pagination.noData"
      :terminal-work-id="stackEnabled ? terminalWorkId : null"
      :pinned-terminal-work-id="stackEnabled ? pinnedTerminalWorkId : null"
      :passed-work-ids="stackEnabled ? passedWorkIds : []"
      @expanded-change="expandedWorkId = $event"
    />

    <footer ref="paginationActionRef" class="release-pagination-action mt-4 min-h-16">
      <div
        v-if="effectiveError"
        class="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-700"
      >
        <span>{{ pageText.pagination.failed }}</span>
        <button
          type="button"
          class="min-h-11 rounded-md border border-rose-200 bg-white/82 px-4 py-2 text-xs font-semibold transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
          @click="loadNextPage"
        >
          {{ pageText.pagination.retry }}
        </button>
      </div>

      <div
        v-else-if="works.length > 0"
        class="flex min-h-16 flex-col items-center gap-3 py-2 font-montserrat tabular-nums md:grid md:grid-cols-[1fr_auto_1fr]"
      >
        <div class="text-sm text-[#143d63] md:text-right">
          {{ loadedCount }} / {{ totalCount }} {{ pageText.chapter.archived }}
        </div>
        <button
          v-if="loading || hasMore"
          type="button"
          class="min-h-11 cursor-pointer rounded-md border border-[#d8c38f]/80 bg-[#fffaf0]/92 px-8 py-2 text-sm font-semibold text-[#143d63] shadow-[0_14px_34px_-26px_rgba(85,70,36,0.8)] transition hover:-translate-y-0.5 hover:border-[#b89444] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading || paginationBusy"
          :aria-busy="loading || paginationBusy"
          @click="loadNextPage"
        >
          {{ loadButtonText }}
        </button>
        <div v-else class="flex min-h-11 items-center text-sm font-semibold text-[#317f8d]">
          {{ completeText }}
        </div>
        <div class="text-sm text-[#317f8d] md:text-left">
          {{ hasMore ? pageText.pagination.nextBatch : completeText }}
        </div>
      </div>

      <button
        v-if="nextSectionId && nextSectionLabel"
        type="button"
        class="mt-5 min-h-11 w-full rounded-lg border border-sky-100 bg-white/72 px-4 py-2 text-sm font-semibold text-[#317f8d] transition hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
        :aria-label="nextSectionLabel"
        @click="emit('enterNextSection', nextSectionId)"
      >
        {{ nextSectionLabel }}
      </button>

      <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'

import ReleaseSpineDeck from './ReleaseSpineDeck.vue'
import WorkStack from './WorkStack.vue'
import { RELEASE_PAGE_TEXT } from '@/composables/lang/ReleaseMetaData'
import { usePageScroll } from '@/composables/page-scroll'
import type { Work } from '@/composables/releaseType'
import type {
  CommitNextPageResult,
  PrepareNextPageResult,
  PreparedReleasePage,
} from '@/composables/useReleaseData'
import { useReleaseCardStack } from '@/composables/useReleaseCardStack'

const props = defineProps<{
  sectionId: string
  sectionKey: 'album' | 'ep' | 'live'
  title: string
  subtitle?: string
  works: Work[]
  total: number
  currentPage: number
  loading: boolean
  error: string | null
  hasMore: boolean
  viewMode: 'list' | 'shelf'
  stackEnabled: boolean
  nextSectionId?: string
  nextSectionLabel?: string
  prepareNextPage(options: {
    signal: AbortSignal
    transactionId: string
  }): Promise<PrepareNextPageResult>
  commitNextPage(
    batch: PreparedReleasePage,
    options: { beforeDataMutation: () => void },
  ): CommitNextPageResult
}>()

const emit = defineEmits<{
  (event: 'enterNextSection', anchorId: string): void
}>()

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const pageScroll = usePageScroll()
const sectionRef = ref<HTMLElement | null>(null)
const chapterHeaderRef = ref<HTMLElement | null>(null)
const paginationActionRef = ref<HTMLElement | null>(null)
const expandedWorkId = ref<string | null>(null)
const paginationBusy = ref(false)
const localError = ref<string | null>(null)
const liveMessage = ref('')
const terminalWorkId = computed(() => props.works[props.works.length - 1]?.id || null)

let paginationController: AbortController | null = null
let paginationSequence = 0

const pageText = computed(() => {
  const lang = global.$lang?.lang === 'jp' ? 'jp' : 'zh'
  return RELEASE_PAGE_TEXT[lang]
})

const {
  phase,
  passedWorkIds,
  visibleSpineWorks,
  hiddenSpineCount,
  pinnedTerminalWorkId,
  foldOffset,
  chapterTop,
  spineReservedHeight,
  noAnimation,
  pauseStateCommits,
  resumeStateCommits,
  clearPinnedTerminal,
  setNoAnimation,
  resync,
  rebuild,
} = useReleaseCardStack({
  sectionRef,
  chapterHeaderRef,
  paginationActionRef,
  works: toRef(props, 'works'),
  terminalWorkId,
  enabled: toRef(props, 'stackEnabled'),
  loading: toRef(props, 'loading'),
  expandedWorkId,
})

const loadedCount = computed(() => props.works.length)
const totalCount = computed(() => props.total || props.works.length)
const effectiveError = computed(() => props.error || localError.value)
const sectionStyle = computed(() => ({
  '--release-chapter-top': `${chapterTop.value}px`,
  '--release-fold-line': `${foldOffset.value}px`,
  '--release-spine-reserved-height': `${spineReservedHeight.value}px`,
}))

const loadButtonText = computed(() => {
  if (props.loading || paginationBusy.value) return pageText.value.pagination.loading
  if (!props.hasMore) return completeText.value
  return {
    album: pageText.value.pagination.loadMoreAlbum,
    ep: pageText.value.pagination.loadMoreEp,
    live: pageText.value.pagination.loadMoreLive,
  }[props.sectionKey]
})

const completeText = computed(
  () =>
    ({
      album: pageText.value.pagination.allAlbum,
      ep: pageText.value.pagination.allEp,
      live: pageText.value.pagination.allLive,
    })[props.sectionKey],
)

function createTransactionId() {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${++paginationSequence}`
  return `${props.sectionKey}-${suffix}`
}

function waitForFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

async function loadNextPage() {
  if (paginationBusy.value || props.loading || !props.hasMore) return

  paginationController?.abort()
  paginationController = new AbortController()
  const controller = paginationController
  const transactionId = createTransactionId()
  const anchorOffset =
    (paginationActionRef.value?.getBoundingClientRect().top || 0) - pageScroll.state.viewportTop
  let anchorCompensationAllowed = true

  const cancelCompensation = () => {
    anchorCompensationAllowed = false
  }
  const cancelOnKey = (event: KeyboardEvent) => {
    if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
      cancelCompensation()
    }
  }

  window.addEventListener('wheel', cancelCompensation, { passive: true })
  window.addEventListener('touchmove', cancelCompensation, { passive: true })
  window.addEventListener('pointerdown', cancelCompensation, { passive: true })
  window.addEventListener('keydown', cancelOnKey)
  paginationBusy.value = true
  localError.value = null
  pauseStateCommits()

  try {
    const prepared = await props.prepareNextPage({ signal: controller.signal, transactionId })
    if (prepared.status === 'aborted' || controller.signal.aborted) return
    if (prepared.status === 'error') {
      localError.value = 'prepare-error'
      return
    }

    const committed = props.commitNextPage(prepared.batch, {
      beforeDataMutation: () => {
        clearPinnedTerminal()
        setNoAnimation(true)
      },
    })
    if (committed.status === 'rejected') {
      if (committed.reason === 'invalid-empty') localError.value = 'invalid-empty'
      return
    }
    if (committed.status === 'metadata-only') {
      liveMessage.value = completeText.value
      return
    }

    await nextTick()
    await waitForFrame()
    pageScroll.invalidateMetrics()
    if (anchorCompensationAllowed && paginationActionRef.value) {
      const currentOffset =
        paginationActionRef.value.getBoundingClientRect().top - pageScroll.state.viewportTop
      pageScroll.scrollToPosition(pageScroll.state.top + currentOffset - anchorOffset, {
        behavior: 'auto',
      })
    }
    await rebuild()
    liveMessage.value = `${committed.addedCount}`
  } finally {
    window.removeEventListener('wheel', cancelCompensation)
    window.removeEventListener('touchmove', cancelCompensation)
    window.removeEventListener('pointerdown', cancelCompensation)
    window.removeEventListener('keydown', cancelOnKey)
    resumeStateCommits()
    resync()
    setNoAnimation(false)
    paginationBusy.value = false
    if (paginationController === controller) paginationController = null
  }
}

watch(
  () => [props.stackEnabled, props.viewMode],
  ([enabled, viewMode]) => {
    if (!enabled || viewMode === 'shelf') paginationController?.abort()
  },
)

onBeforeUnmount(() => paginationController?.abort())
</script>

<style scoped>
.release-section {
  position: relative;
  isolation: isolate;
  padding-bottom: 2rem;
  --release-z-content: 0;
  --release-z-terminal: 10;
  --release-z-spine: 20;
  --release-z-chapter: 30;
}

.release-chapter-header {
  top: var(--release-chapter-top);
  z-index: var(--release-z-chapter);
}

.release-spine-anchor {
  position: sticky;
  top: var(--release-fold-line);
  z-index: var(--release-z-spine);
  height: 0;
}

:deep([data-release-terminal][data-terminal-pinned='true']) {
  position: sticky;
  top: calc(var(--release-fold-line) + var(--release-spine-reserved-height));
  z-index: var(--release-z-terminal);
}

[data-release-no-animation='true'] :deep(*) {
  scroll-behavior: auto !important;
  transition-duration: 0ms !important;
  animation-duration: 0ms !important;
}

@media (prefers-reduced-motion: reduce) {
  .release-section :deep(*) {
    scroll-behavior: auto !important;
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
</style>
