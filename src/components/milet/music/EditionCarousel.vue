<template>
  <div class="relation h-full">
    <div
      v-if="editions[idx]?.coverUrl"
      class="absolute inset-0 bg-cover bg-center opacity-6 transition-opacity duration-300"
      :style="{ backgroundImage: `url('${initImgUrl(editions[idx]?.coverUrl)}')` }"
    ></div>

    <div class="z-10 flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      <div
        class="z-10 flex shrink-0 items-center border-b border-slate-100 px-3 py-2"
        :class="hasMultipleEditions ? 'justify-between' : 'justify-center'"
      >
        <button
          v-if="hasMultipleEditions"
          class="h-8 w-8 rounded-lg text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
          :disabled="idx === 0"
          aria-label="prev"
          @click="prev"
        >
          &lt;
        </button>

        <div class="text-sm text-slate-700">
          <span class="font-medium">{{ editions[idx]?.editionName }}</span>
          <span v-if="hasMultipleEditions" class="ml-2 text-slate-400"
            >({{ idx + 1 }}/{{ max }})</span
          >
        </div>

        <button
          v-if="hasMultipleEditions"
          class="h-8 w-8 rounded-lg text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
          :disabled="idx === max - 1"
          aria-label="next"
          @click="next"
        >
          &gt;
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <div
          class="relative flex h-full transition-transform duration-300 ease-out"
          :class="dragging ? 'transition-none' : ''"
          :style="{ transform: translateX }"
        >
          <div
            v-for="ed in editions"
            :key="ed.id"
            class="flex min-h-0 w-full shrink-0 flex-col px-3 py-3"
          >
            <div v-if="isStreamingEdition(ed)" class="shrink-0">
              <span
                class="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
              >
                {{ pageText.streamingEdition }}
              </span>
            </div>
            <div v-else class="flex shrink-0 gap-4 text-xs text-slate-500">
              <div>{{ ed.discs.length }} {{ pageText.discLabel }}</div>
            </div>

            <div
              class="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto [touch-action:pan-y]"
              :class="{ 'select-none': interactionActive }"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerEnd"
              @pointercancel="handlePointerEnd"
            >
              <div v-for="disc in ed.discs" :key="disc.id">
                <div v-if="!isVirtualDisc(disc)" class="flex items-center justify-between gap-3">
                  <div class="text-sm font-medium text-slate-700">
                    {{ pageText.discLabel }} {{ getDiscNumber(disc) }}
                    <span v-if="disc.title" class="text-slate-400">- {{ disc.title }}</span>
                  </div>
                  <div class="text-sm text-slate-400">({{ disc.tracks.length }} tracks)</div>
                </div>

                <div
                  class="divide-y divide-slate-100 rounded-lg border border-slate-100"
                  :class="!isVirtualDisc(disc) ? 'mt-2' : ''"
                >
                  <div
                    v-for="t in disc.tracks"
                    :key="t.showId"
                    class="flex w-full items-stretch justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div
                      class="scrollbar-none flex min-w-0 flex-1 items-center overflow-x-auto overscroll-x-contain px-1 py-2 [touch-action:pan-y]"
                      data-inline-scroll
                    >
                      <span class="mr-2 shrink-0 text-slate-500">
                        {{ String(t.no).padStart(2, '0') }}
                      </span>
                      <span class="whitespace-nowrap">{{ t.title }}</span>
                    </div>

                    <button
                      class="mx-1 flex shrink-0 items-center justify-center rounded-xl px-3 text-xs text-slate-400 transition-colors hover:bg-slate-200 max-md:bg-slate-200"
                      @click="emit('select-track', t)"
                    >
                      {{
                        t.durationSec
                          ? `${Math.floor(t.durationSec / 60)}:${String(t.durationSec % 60).padStart(2, '0')}`
                          : pageText.detailLabel
                      }}
                      <span class="ml-1 text-xs text-slate-400">&gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from 'vue'
import { initImgUrl } from '@/composables/ImgUrlUtil'
import { WORK_TEXT } from '@/composables/lang/ReleaseMetaData'
import type { Disc, ReleaseEdition, Track } from '@/composables/releaseType'
import { useSwipe } from '@/composables/useSwipe'

const props = defineProps<{ editions: ReleaseEdition[] }>()
const emit = defineEmits<{ (e: 'select-track', t: Track): void }>()
const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const pageText = computed(() => {
  const lang = global.$lang?.lang ? global.$lang.lang : 'zh'
  return WORK_TEXT[lang].workCard
})

const idx = ref(0)
const max = computed(() => props.editions.length)
const hasMultipleEditions = computed(() => max.value > 1)

const translateX = computed(() => {
  const drag = dragging.value ? dx.value : 0
  return `translateX(calc(${-idx.value * 100}% + ${drag}px))`
})

function prev() {
  if (idx.value > 0) idx.value--
}

function next() {
  if (idx.value < max.value - 1) idx.value++
}

function isVirtualDisc(disc: Disc) {
  return disc.isVirtual === true
}

function isStreamingEdition(edition: ReleaseEdition) {
  return edition.discs.length === 1 && edition.discs[0]?.isVirtual === true
}

function getDiscNumber(disc: Disc) {
  return disc.discNo ?? disc.no ?? 1
}

const {
  dx,
  dragging,
  interactionActive,
  handlePointerDown,
  handlePointerMove,
  handlePointerEnd,
  reset,
} = useSwipe({
  onSwipeLeft: next,
  onSwipeRight: prev,
})

watch(
  () => props.editions,
  () => {
    idx.value = 0
    reset()
  },
)
</script>
