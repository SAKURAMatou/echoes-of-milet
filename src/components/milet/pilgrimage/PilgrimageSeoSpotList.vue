<template>
  <details
    v-if="spots.length > 0"
    class="pilgrimage-seo-spot-list mx-3 mb-4 mt-3 rounded-lg border border-white/70 bg-white/70 px-4 py-3 text-[#34444b] shadow-[0_18px_54px_-44px_rgba(31,41,55,0.72)] backdrop-blur sm:mx-5 lg:mx-7"
  >
    <summary
      class="cursor-pointer text-sm font-semibold text-[#315761] outline-none transition hover:text-[#1f6a66] focus-visible:ring-4 focus-visible:ring-teal-100"
    >
      {{ copy.summary }}
      <span class="ml-2 text-xs font-normal text-[#789096]">
        {{ areaName }} / {{ spots.length }}
      </span>
    </summary>

    <p class="mt-3 text-sm leading-7 text-[#60717a]">
      {{ copy.intro }}
    </p>

    <ol class="mt-4 grid gap-3 md:grid-cols-2">
      <li
        v-for="(spot, index) in spots"
        :id="spotAnchorId(spot.id)"
        :key="spot.id"
        class="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-[#dbe7e4] bg-[#f7fbfa]/82 p-2.5"
      >
        <img
          v-if="spot.coverImageUrl"
          :src="buildStaticAssetUrl(spot.coverImageUrl)"
          :alt="spot.title"
          class="h-16 w-16 rounded-md object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          v-else
          class="grid h-16 w-16 place-items-center rounded-md bg-[#e8f8f4] text-xs font-semibold text-[#6fb8ad]"
          aria-hidden="true"
        >
          {{ index + 1 }}
        </div>

        <div class="min-w-0">
          <h2 class="truncate font-serif text-lg leading-tight text-[#26313a]">
            {{ spot.title }}
          </h2>
          <p class="mt-1 text-xs leading-5 text-[#60717a]">
            <span v-if="spot.workTitle">{{ copy.workLabel }}: {{ spot.workTitle }}</span>
            <span v-if="spot.category"> / {{ spot.category }}</span>
          </p>
          <p v-if="spotSummary(spot)" class="mt-1 line-clamp-2 text-xs leading-5 text-[#789096]">
            {{ spotSummary(spot) }}
          </p>
          <p class="mt-1 text-[11px] leading-5 text-[#8a9ca2]">
            {{ coordinateText(spot) }}
          </p>
        </div>
      </li>
    </ol>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type {
  PilgrimageCity,
  PilgrimageDistrict,
  PilgrimageLang,
  PilgrimageSpotSummary,
} from '@/composables/miletPilgrimage'
import { buildStaticAssetUrl } from '@/config/api'

const props = defineProps<{
  spots: PilgrimageSpotSummary[]
  selectedCity: PilgrimageCity | null
  selectedDistrict: PilgrimageDistrict | null
  lang: PilgrimageLang
}>()

const copy = computed(() =>
  props.lang === 'jp'
    ? {
        summary: 'milet 聖地巡礼 spot 一覧',
        intro:
          '現在選択しているエリアの milet 聖地巡礼 spot です。地図上のマーカーと同じ地点、作品、カテゴリ、座標を確認できます。',
        workLabel: '作品',
        coordinateLabel: '座標',
      }
    : {
        summary: 'milet 圣地巡礼 spot 列表',
        intro:
          '这里列出当前区域内的 milet 圣地巡礼 spot，和地图上的标记保持一致，方便查看作品、分类、封面与坐标信息。',
        workLabel: '作品',
        coordinateLabel: '坐标',
      },
)

const areaName = computed(() => {
  const city = props.selectedCity?.name || ''
  const district = props.selectedDistrict?.name || ''
  return [city, district].filter(Boolean).join(' / ') || copy.value.summary
})

function spotAnchorId(id: string) {
  return `pilgrimage-spot-${id}`
}

function spotSummary(spot: PilgrimageSpotSummary) {
  return spot.tags?.length ? spot.tags.join(' / ') : ''
}

function coordinateText(spot: PilgrimageSpotSummary) {
  const lat = Number(spot.displayLat)
  const lng = Number(spot.displayLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `${copy.value.coordinateLabel}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
</script>
