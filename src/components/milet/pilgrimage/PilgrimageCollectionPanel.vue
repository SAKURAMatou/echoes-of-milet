<template>
  <div
    class="pilgrimage-collection-panel absolute inset-0 z-[18] flex flex-col overflow-hidden border-t border-[#d4e4ed]/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,253,250,0.84))] p-4 text-[#26313a] backdrop-blur"
  >
    <div class="flex min-w-0 items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b68a8]">
          {{ text.eyebrow }}
        </p>
        <h2 class="mt-1 truncate font-serif text-2xl text-[#26313a] sm:text-3xl">
          {{ activeCollection?.title || text.emptyTitle }}
        </h2>
      </div>
      <span
        class="shrink-0 rounded-lg border border-[#f9a8d4]/45 bg-[#fdf2f8]/72 px-3 py-1.5 text-xs font-semibold text-[#8f3f68]"
      >
        {{ activeCollection ? activeCollection.spots.length : collections.length }}
        {{ activeCollection ? 'spots' : 'collections' }}
      </span>
    </div>

    <div
      v-if="loading"
      class="mt-5 rounded-lg border border-white/80 bg-white/70 p-4 text-sm text-[#60717a] shadow-[0_18px_45px_-36px_rgba(31,41,55,0.7)]"
      aria-busy="true"
    >
      {{ text.loading }}
    </div>

    <div
      v-else-if="collections.length === 0"
      class="mt-5 flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#cadbd7] bg-white/48 p-8 text-center text-sm leading-7 text-[#60717a]"
    >
      {{ text.empty }}
    </div>

    <template v-else>
      <div class="relative mt-4 min-h-0 flex-1 overflow-hidden">
        <div class="h-full overflow-y-auto pr-1">
          <div class="grid gap-2 sm:grid-cols-1 xl:grid-cols-2">
            <div
              v-for="(collection, index) in collections"
              :key="collection.id"
              class="pilgrimage-collection-card group flex min-h-28 w-full min-w-0 max-w-full flex-col rounded-lg border p-3 text-left transition"
              :class="
                activeCollection?.id === collection.id
                  ? 'shadow-[0_18px_42px_-34px_rgba(47,143,131,0.7)]'
                  : 'hover:bg-white/82'
              "
              :style="collectionCardStyle(index, activeCollection?.id === collection.id)"
            >
              <button
                type="button"
                class="w-full min-w-0 rounded-md text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
                @click="openCollection(collection)"
              >
                <span class="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
                  <img
                    v-if="collection.coverImageUrl"
                    :src="buildStaticAssetUrl(collection.coverImageUrl)"
                    :alt="collection.title"
                    class="h-20 w-20 rounded-md object-cover shadow-[0_10px_24px_-18px_rgba(31,41,55,0.8)]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    v-else
                    class="grid h-20 w-20 place-items-center rounded-md bg-[#edf7f5] font-serif text-2xl text-[#7b68a8]"
                    :style="collectionCoverFallbackStyle(index)"
                  >
                    m
                  </span>
                  <span class="min-w-0 self-center">
                    <span class="block truncate text-base font-bold text-[#34444b]">
                      {{ collection.title }}
                    </span>
                    <span class="mt-1 block line-clamp-2 text-sm leading-6 text-[#60717a]">
                      {{ collection.description || text.noDescription }}
                    </span>
                    <span
                      class="mt-2 block text-xs font-semibold"
                      :style="{ color: collectionTone(index).accent }"
                    >
                      {{ collection.spots.length }} spots
                    </span>
                  </span>
                </span>
              </button>
              <ExtraInformationList
                v-if="collection.extraInfo?.items?.length || collection.articles?.items?.length"
                class="mt-3 w-full min-w-0 max-w-full"
                :extra-info="collection.extraInfo"
                :legacy-articles="collection.articles"
                variant="release"
                :lang="lang"
                floating
              />
            </div>
          </div>
        </div>

        <Transition name="pilgrimage-collection-detail">
          <div
            v-if="activeCollection"
            class="absolute inset-0 z-[2] flex h-full flex-col overflow-hidden rounded-lg border border-[#cbe0ec]/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.94))] p-3 shadow-[0_-24px_70px_-44px_rgba(58,91,119,0.78)] backdrop-blur sm:p-4"
            :style="activeCollectionPanelStyle"
          >
            <div class="flex min-w-0 items-start justify-between gap-3">
              <div class="min-w-0">
                <button
                  type="button"
                  class="mb-2 rounded-lg border border-[#d8e7ef]/80 bg-white/68 px-3 py-1.5 text-xs font-bold text-[#60717a] transition hover:border-[#99e6d6] hover:text-[#1d6564] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
                  @click="closeCollection"
                >
                  {{ text.back }}
                </button>
              </div>
              <span
                class="shrink-0 rounded-lg border border-[#f9a8d4]/45 bg-[#fdf2f8]/72 px-3 py-1.5 text-xs font-semibold text-[#8f3f68]"
                :style="activeCollectionBadgeStyle"
              >
                {{ activeCollection.spots.length }} spots
              </span>
            </div>

            <ExtraInformationList
              v-if="
                activeCollection.extraInfo?.items?.length ||
                activeCollection.articles?.items?.length
              "
              class="mt-3 w-full min-w-0 max-w-full"
              :extra-info="activeCollection.extraInfo"
              :legacy-articles="activeCollection.articles"
              variant="release"
              :lang="lang"
              floating
            />

            <div class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <button
                v-for="(spot, index) in activeCollection.spots"
                :key="spot.id"
                type="button"
                class="pilgrimage-collection-spot group mb-3 grid w-full grid-cols-[2rem_4.5rem_minmax(0,1fr)] gap-3 rounded-lg border p-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 sm:grid-cols-[2.5rem_5.25rem_minmax(0,1fr)]"
                :class="
                  selectedSpotId === spot.id
                    ? 'border-[#f9a8d4] bg-[#fff7fb]/88 shadow-[0_18px_46px_-36px_rgba(196,95,145,0.72)]'
                    : 'border-[#d8e7ef]/78 bg-white/62 hover:border-[#99e6d6] hover:bg-white/86'
                "
                :style="{ '--spot-delay': `${index * 36}ms` }"
                @click="$emit('selectSpot', spot.id)"
              >
                <span
                  class="mt-1 grid h-7 w-7 place-items-center rounded-full border border-[#7dd3fc]/60 bg-[#f0f9ff] text-xs font-black text-[#356f98]"
                >
                  {{ index + 1 }}
                </span>
                <img
                  :src="buildStaticAssetUrl(spot.coverImageUrl)"
                  :alt="spot.title"
                  class="h-20 w-full rounded-md object-cover shadow-[0_12px_28px_-20px_rgba(31,41,55,0.84)]"
                  loading="lazy"
                  decoding="async"
                />
                <span class="min-w-0 py-1">
                  <span class="block truncate font-serif text-xl leading-tight text-[#26313a]">
                    {{ spot.title }}
                  </span>
                  <span class="mt-1 block truncate text-xs font-semibold text-[#7b68a8]">
                    {{ spot.cityName }} / {{ spot.districtName }}
                  </span>
                  <span class="mt-1 block truncate text-sm text-[#526670]">
                    {{ spot.workTitle || spot.category }}
                  </span>
                  <span
                    v-if="spot.collectionNote"
                    class="mt-2 block rounded-md bg-[#fffbeb]/78 px-2 py-1 text-xs leading-5 text-[#76591c]"
                  >
                    {{ spot.collectionNote }}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ExtraInformationList from '@/components/milet/extra-information/ExtraInformationList.vue'
import type { PilgrimageCollection, PilgrimageLang } from '@/composables/miletPilgrimage'
import { buildStaticAssetUrl } from '@/config/api'

const props = defineProps<{
  collections: PilgrimageCollection[]
  selectedCollection: PilgrimageCollection | null
  selectedSpotId: string
  loading: boolean
  lang: PilgrimageLang
}>()

const emit = defineEmits<{
  selectCollection: [collectionId: string]
  selectSpot: [spotId: string]
}>()

const openedCollectionId = ref('')
const activeCollection = computed(
  () => props.collections.find((collection) => collection.id === openedCollectionId.value) || null,
)
const activeCollectionIndex = computed(() =>
  Math.max(
    0,
    props.collections.findIndex((collection) => collection.id === openedCollectionId.value),
  ),
)
const collectionPalette = [
  {
    accent: '#2f8f83',
    border: 'rgba(153, 230, 214, 0.72)',
    bg: 'rgba(240, 253, 250, 0.62)',
    activeBg: 'rgba(255, 255, 255, 0.9)',
    soft: '#edf7f5',
  },
  {
    accent: '#7b68a8',
    border: 'rgba(196, 181, 253, 0.72)',
    bg: 'rgba(245, 243, 255, 0.62)',
    activeBg: 'rgba(255, 255, 255, 0.9)',
    soft: '#f3f0ff',
  },
  {
    accent: '#8f3f68',
    border: 'rgba(249, 168, 212, 0.68)',
    bg: 'rgba(253, 242, 248, 0.62)',
    activeBg: 'rgba(255, 255, 255, 0.9)',
    soft: '#fdf2f8',
  },
  {
    accent: '#9a7740',
    border: 'rgba(252, 211, 77, 0.68)',
    bg: 'rgba(255, 251, 235, 0.68)',
    activeBg: 'rgba(255, 255, 255, 0.9)',
    soft: '#fffbeb',
  },
]
const activeCollectionPanelStyle = computed(() => {
  const tone = collectionTone(activeCollectionIndex.value)
  return {
    borderColor: tone.border,
    background: `linear-gradient(135deg, rgba(255,255,255,0.98), ${tone.bg})`,
  }
})
const activeCollectionBadgeStyle = computed(() => {
  const tone = collectionTone(activeCollectionIndex.value)
  return {
    borderColor: tone.border,
    backgroundColor: tone.soft,
    color: tone.accent,
  }
})

function collectionTone(index: number) {
  return collectionPalette[index % collectionPalette.length] || collectionPalette[0]
}

function collectionCardStyle(index: number, active: boolean) {
  const tone = collectionTone(index)
  return {
    '--collection-delay': `${index * 42}ms`,
    borderColor: tone.border,
    backgroundColor: active ? tone.activeBg : tone.bg,
  }
}

function collectionCoverFallbackStyle(index: number) {
  const tone = collectionTone(index)
  return {
    backgroundColor: tone.soft,
    color: tone.accent,
  }
}

function openCollection(collection: PilgrimageCollection) {
  openedCollectionId.value = collection.id
  emit('selectCollection', collection.id)
}

function closeCollection() {
  openedCollectionId.value = ''
}

watch(
  () => props.collections.map((collection) => collection.id).join('|'),
  () => {
    if (
      openedCollectionId.value &&
      !props.collections.some((collection) => collection.id === openedCollectionId.value)
    ) {
      openedCollectionId.value = ''
    }
  },
)

const text = computed(() =>
  props.lang === 'jp'
    ? {
        eyebrow: 'Collection',
        loading: '読み込み中...',
        empty: '公開中の巡礼コレクションはまだありません。',
        emptyTitle: '巡礼コレクション',
        noDescription: 'spot をテーマごとにまとめたリストです。',
        back: 'コレクション一覧へ',
      }
    : {
        eyebrow: 'Collection',
        loading: '加载中...',
        empty: '还没有公开的巡礼合集。',
        emptyTitle: '巡礼合集',
        noDescription: '按主题整理的 spot 列表。',
        back: '返回合集列表',
      },
)
</script>

<style scoped>
.pilgrimage-collection-card,
.pilgrimage-collection-spot {
  animation: pilgrimage-collection-item-enter 360ms ease both;
}

.pilgrimage-collection-card {
  animation-delay: var(--collection-delay, 0ms);
}

.pilgrimage-collection-spot {
  animation-delay: var(--spot-delay, 0ms);
}

.pilgrimage-collection-detail-enter-active,
.pilgrimage-collection-detail-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.pilgrimage-collection-detail-enter-from,
.pilgrimage-collection-detail-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@keyframes pilgrimage-collection-item-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
