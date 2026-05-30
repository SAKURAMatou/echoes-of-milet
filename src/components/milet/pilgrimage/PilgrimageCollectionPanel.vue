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
          {{ selectedCollection?.title || text.emptyTitle }}
        </h2>
      </div>
      <span
        class="shrink-0 rounded-lg border border-[#f9a8d4]/45 bg-[#fdf2f8]/72 px-3 py-1.5 text-xs font-semibold text-[#8f3f68]"
      >
        {{ selectedCollection?.spots.length || 0 }} spots
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
      <div class="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2">
        <button
          v-for="collection in collections"
          :key="collection.id"
          type="button"
          class="group grid w-56 shrink-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-lg border p-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
          :class="
            collection.id === selectedCollection?.id
              ? 'border-[#99e6d6] bg-white/88 shadow-[0_18px_42px_-34px_rgba(47,143,131,0.7)]'
              : 'border-[#d8e7ef]/80 bg-white/54 hover:border-[#c4b5fd]/70 hover:bg-white/82'
          "
          @click="$emit('selectCollection', collection.id)"
        >
          <img
            v-if="collection.coverImageUrl"
            :src="buildStaticAssetUrl(collection.coverImageUrl)"
            :alt="collection.title"
            class="h-16 w-[4.5rem] rounded-md object-cover shadow-[0_10px_24px_-18px_rgba(31,41,55,0.8)]"
            loading="lazy"
            decoding="async"
          />
          <span
            v-else
            class="grid h-16 w-[4.5rem] place-items-center rounded-md bg-[#edf7f5] font-serif text-xl text-[#7b68a8]"
          >
            m
          </span>
          <span class="min-w-0 self-center">
            <span class="block truncate text-sm font-bold text-[#34444b]">
              {{ collection.title }}
            </span>
            <span class="mt-1 block line-clamp-2 text-xs leading-5 text-[#60717a]">
              {{ collection.description || text.noDescription }}
            </span>
          </span>
        </button>
      </div>

      <p
        v-if="selectedCollection?.description"
        class="mt-2 rounded-lg border border-[#d8e7ef]/70 bg-white/52 px-3 py-2 text-sm leading-6 text-[#526670]"
      >
        {{ selectedCollection.description }}
      </p>

      <div class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <button
          v-for="(spot, index) in selectedCollection?.spots || []"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type {
  PilgrimageCollection,
  PilgrimageLang,
} from '@/composables/miletPilgrimage'
import { buildStaticAssetUrl } from '@/config/api'

const props = defineProps<{
  collections: PilgrimageCollection[]
  selectedCollection: PilgrimageCollection | null
  selectedSpotId: string
  loading: boolean
  lang: PilgrimageLang
}>()

defineEmits<{
  selectCollection: [collectionId: string]
  selectSpot: [spotId: string]
}>()

const text = computed(() =>
  props.lang === 'jp'
    ? {
        eyebrow: 'Collection',
        loading: '読み込み中...',
        empty: '公開中の巡礼コレクションはまだありません。',
        emptyTitle: '巡礼コレクション',
        noDescription: 'spot をテーマごとにまとめたリストです。',
      }
    : {
        eyebrow: 'Collection',
        loading: '加载中...',
        empty: '还没有公开的巡礼合集。',
        emptyTitle: '巡礼合集',
        noDescription: '按主题整理的 spot 列表。',
      },
)
</script>

<style scoped>
.pilgrimage-collection-spot {
  animation: pilgrimage-collection-spot-enter 360ms ease both;
  animation-delay: var(--spot-delay, 0ms);
}

@keyframes pilgrimage-collection-spot-enter {
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
