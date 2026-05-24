<template>
  <aside
    id="pilgrimage-detail"
    class="pilgrimage-detail-panel isolate fixed inset-x-0 bottom-0 z-[1000] max-h-[76svh] scroll-mt-[5.5rem] overflow-y-auto rounded-t-2xl border-t border-[#d0e2ec]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,250,253,0.96))] px-4 pb-1 pt-3 shadow-[0_-24px_70px_-42px_rgba(58,91,119,0.72)] transition-transform duration-300 sm:px-6 md:scroll-mt-[6.5rem] lg:static lg:z-auto lg:flex lg:h-full lg:max-h-full lg:min-h-0 lg:translate-y-0 lg:flex-col lg:overflow-hidden lg:rounded-none lg:border-t-0 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(242,249,252,0.82))] lg:px-5 lg:pb-1 lg:pt-5 lg:shadow-none"
    :class="
      panelVisible
        ? 'translate-y-0'
        : 'hidden pointer-events-none translate-y-[calc(100%+1rem)] lg:block lg:pointer-events-auto'
    "
  >
    <div
      class="mb-3.5 flex items-baseline justify-between gap-3 border-b border-dashed border-[#c4b5fd]/45 px-0.5 pb-2.5 text-[0.82rem] font-bold tracking-[0.03em] text-[#6b5a95] max-md:hidden"
    >
      <span>{{ detailNoteText }}</span>
      <span
        class="shrink-0 font-serif text-base font-semibold italic tracking-[0.02em] text-[#c98791]/80"
      >
        with milet
      </span>
    </div>

    <div
      v-if="selectedSpotDetail"
      class="pilgrimage-detail-content flex min-h-full flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
    >
      <div
        class="sticky top-0 z-30 -mx-4 mb-3 flex h-12 items-center gap-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] px-4 pr-14 pt-1 sm:-mx-6 sm:px-6 sm:pr-16 lg:hidden"
      >
        <span class="min-w-0 flex-1 truncate text-xs font-bold tracking-[0.03em] text-[#6b5a95]">
          {{ detailNoteText }}
        </span>
        <span class="shrink-0 font-serif text-base italic text-[#c98791]">with milet</span>
        <button
          type="button"
          class="absolute right-4 top-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e7e4] bg-white/92 text-lg leading-none text-[#60717a] shadow-[0_12px_30px_-22px_rgba(31,41,55,0.9)] sm:right-6"
          aria-label="Close spot detail"
          @click="$emit('close')"
        >
          x
        </button>
      </div>

      <div
        class="pilgrimage-detail-card relative shrink-0 overflow-hidden rounded-lg border border-[#d3e5ef]/90 shadow-[0_22px_60px_-42px_rgba(58,91,119,0.72)]"
      >
        <img
          :src="buildStaticAssetUrl(selectedSpotDetail.coverImageUrl)"
          :alt="selectedSpotDetail.title"
          class="h-48 w-full object-cover"
        />
        <div class="p-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#789096]">
              {{ selectedSpotDetail.category }}
            </p>
            <h2 class="mt-1 break-words font-serif text-3xl leading-tight text-[#26313a]">
              {{ selectedSpotDetail.title }}
            </h2>
          </div>

          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#82939a]">
                {{ pageText.works }}
              </p>
              <p class="mt-1 break-words text-sm text-[#34444b]">
                {{ selectedSpotDetail.workTitle }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <a
                :href="navigationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-lg border border-[#8bbddd] bg-[#eaf6fb] px-3 py-2 text-center text-sm font-semibold text-[#356f98] shadow-[0_10px_22px_-18px_rgba(58,91,119,0.58)] transition hover:border-[#6da4ca] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
              >
                {{ pageText.navigation }}
              </a>
              <a
                v-if="spotLinkUrl"
                :href="spotLinkUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-lg border border-[#99e6d6] bg-[#f0fdfa]/82 px-3 py-2 text-center text-sm font-semibold text-[#1d6564] transition hover:border-[#5eead4] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
              >
                {{ pageText.spotLink }}
              </a>
            </div>
          </div>

          <dl class="mt-3 space-y-3 text-sm">
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.14em] text-[#82939a]">
                {{ pageText.address }}
              </dt>
              <dd class="mt-1 leading-6 text-[#526670]">{{ selectedSpotDetail.address }}</dd>
            </div>
          </dl>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="tag in selectedSpotDetail.tags"
              :key="tag"
              class="pilgrimage-detail-tag rounded-lg border border-[#d5e6ef] bg-[#f5fbfe] px-2.5 py-1 text-xs text-[#60717a]"
            >
              {{ tag }}
            </span>
          </div>

          <FormattedPlainText
            class="mt-4 text-sm leading-7 text-[#526670]"
            :text="selectedSpotDetail.description"
          />
        </div>
      </div>

      <section class="mt-5 shrink-0">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[#64777f]">
            {{ pageText.photoLabel }}
          </h3>
          <span class="text-xs text-[#8a9ca2]">{{ selectedSpotDetail.photos.length }}</span>
        </div>

        <div class="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(128px,1fr))]">
          <a
            v-for="photo in selectedSpotDetail.photos"
            :key="photo.id"
            :href="buildStaticAssetUrl(photo.fullUrl)"
            :data-fancybox="galleryName"
            :data-caption="photo.caption"
            :data-width="photo.width"
            :data-height="photo.height"
            :data-download-src="buildStaticAssetUrl(photo.downloadUrl || photo.fullUrl)"
            class="pilgrimage-photo block overflow-hidden rounded-lg border border-[#d3e5ef]/90 bg-white/76 p-1 shadow-[0_16px_42px_-34px_rgba(58,91,119,0.72)] transition hover:-translate-y-0.5 hover:border-[#a8cde2]"
          >
            <LazyImage
              :src="buildStaticAssetUrl(photo.thumbUrl || photo.fullUrl)"
              :alt="photo.alt"
              :downloadSrc="buildStaticAssetUrl(photo.downloadUrl || photo.fullUrl)"
            />
          </a>
        </div>
      </section>
    </div>

    <div
      v-else-if="spotDetailLoading"
      class="pilgrimage-detail-content flex min-h-full flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
    >
      <div
        class="sticky top-0 z-30 -mx-4 mb-3 flex h-12 items-center gap-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] px-4 pr-14 pt-1 sm:-mx-6 sm:px-6 sm:pr-16 lg:hidden"
      >
        <span class="min-w-0 flex-1 truncate text-xs font-bold tracking-[0.03em] text-[#6b5a95]">
          {{ detailNoteText }}
        </span>
        <span class="shrink-0 font-serif text-base italic text-[#c98791]">with milet</span>
        <button
          type="button"
          class="absolute right-4 top-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e7e4] bg-white/92 text-lg leading-none text-[#60717a] shadow-[0_12px_30px_-22px_rgba(31,41,55,0.9)] sm:right-6"
          aria-label="Close spot detail"
          @click="$emit('close')"
        >
          x
        </button>
      </div>

      <div
        class="shrink-0 overflow-hidden rounded-lg border border-[#d3e5ef]/90 bg-white/68 p-4 shadow-[0_22px_60px_-42px_rgba(58,91,119,0.72)]"
        aria-busy="true"
      >
        <div class="pilgrimage-detail-skeleton h-48 rounded-lg bg-[#e2ece9]" />
        <div class="mt-4 space-y-3">
          <div class="pilgrimage-detail-skeleton h-3 w-24 rounded-full bg-[#d7e5e1]" />
          <div class="pilgrimage-detail-skeleton h-8 w-3/4 rounded-full bg-[#e2ece9]" />
          <div class="pilgrimage-detail-skeleton h-4 w-full rounded-full bg-[#e8f1ee]" />
          <div class="pilgrimage-detail-skeleton h-4 w-5/6 rounded-full bg-[#e8f1ee]" />
        </div>
        <p class="mt-5 text-center text-sm font-semibold text-[#60717a]">
          {{ pageText.loading }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="pilgrimage-detail-content flex min-h-[480px] items-center justify-center rounded-lg border border-dashed border-[#cadbd7] bg-white/48 p-8 text-center text-sm leading-7 text-[#60717a] lg:min-h-0 lg:flex-1"
    >
      {{ spotsLoading ? pageText.loading : pageText.emptySpot }}
    </div>

    <div class="pilgrimage-detail-illustration mt-4 hidden shrink-0 lg:block" aria-hidden="true">
      <img
        src="/pilgrimage/decorations/detail-watercolor-postcard.webp"
        alt=""
        class="h-full w-full object-cover object-[62%_45%]"
        loading="lazy"
        decoding="async"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FormattedPlainText from '@/components/FormattedPlainText.vue'
import LazyImage from '@/components/LazyImage.vue'
import type {
  PilgrimageLang,
  PilgrimagePageText,
  PilgrimageSpotDetail,
} from '@/composables/miletPilgrimage'
import { buildStaticAssetUrl } from '@/config/api'

const props = defineProps<{
  pageText: PilgrimagePageText
  selectedSpotDetail: PilgrimageSpotDetail | null
  navigationUrl: string
  galleryName: string
  spotsLoading: boolean
  spotDetailLoading: boolean
  lang: PilgrimageLang
}>()

defineEmits<{
  close: []
}>()

function safeSpotHref(value?: string | null) {
  const href = (value || '').trim()
  if (!href) return ''
  const lowerHref = href.toLowerCase()
  if (
    lowerHref.startsWith('javascript:') ||
    lowerHref.startsWith('data:') ||
    lowerHref.startsWith('vbscript:')
  ) {
    return ''
  }
  if (href.startsWith('/')) return href
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:' ? href : ''
  } catch {
    return ''
  }
}

const spotLinkUrl = computed(() => safeSpotHref(props.selectedSpotDetail?.linkUrl))
const panelVisible = computed(() => Boolean(props.selectedSpotDetail || props.spotDetailLoading))
const detailNoteText = computed(() =>
  props.lang === 'jp' ? 'すべての場所は、記憶されるべき。' : '每一个地点都应该被记住',
)
</script>

<style scoped>
.pilgrimage-detail-panel {
  background-image:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(248, 252, 251, 0.88)),
    radial-gradient(circle at 100% 0%, rgba(196, 181, 253, 0.16), transparent 34%),
    radial-gradient(circle at 0% 14%, rgba(249, 168, 212, 0.12), transparent 30%),
    repeating-linear-gradient(
      0deg,
      rgba(107, 90, 149, 0.03) 0,
      rgba(107, 90, 149, 0.03) 1px,
      transparent 1px,
      transparent 24px
    );
}

.pilgrimage-detail-panel > * {
  position: relative;
  z-index: 1;
}

.pilgrimage-detail-panel::before {
  position: sticky;
  top: 0;
  z-index: 1;
  display: block;
  width: min(72px, 22%);
  height: 3px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: rgba(196, 181, 253, 0.44);
  content: '';
}

.pilgrimage-detail-panel::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.9)),
    url('/pilgrimage/decorations/detail-watercolor-postcard.webp') center bottom / cover no-repeat;
  content: '';
  opacity: 0.3;
  pointer-events: none;
}

@media (min-width: 1024px) {
  .pilgrimage-detail-panel::after {
    display: none;
  }
}

.pilgrimage-detail-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(196, 181, 253, 0.44) transparent;
}

.pilgrimage-detail-illustration {
  position: relative;
  height: clamp(120px, 15vh, 180px);
  overflow: hidden;
  border: 1px solid rgba(211, 229, 239, 0.76);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow:
    0 20px 52px -42px rgba(58, 91, 119, 0.64),
    inset 0 0 0 1px rgba(255, 255, 255, 0.58);
}

.pilgrimage-detail-illustration img {
  display: block;
  opacity: 0.74;
  filter: saturate(0.78) contrast(0.92) brightness(1.04);
}

.pilgrimage-detail-illustration::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 251, 235, 0.32)),
    radial-gradient(circle at 16% 18%, rgba(249, 168, 212, 0.12), transparent 34%);
  content: '';
  pointer-events: none;
}

.pilgrimage-detail-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(246, 251, 253, 0.82)), #fff;
}

.pilgrimage-detail-card::after {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 58px;
  height: 34px;
  border: 2px solid rgba(249, 168, 212, 0.28);
  border-radius: 5px;
  content: '';
  pointer-events: none;
}

.pilgrimage-detail-skeleton {
  animation: pilgrimage-detail-skeleton 1.05s ease-in-out infinite alternate;
}

.pilgrimage-detail-tag:nth-child(4n + 1) {
  border-color: rgba(249, 168, 212, 0.58);
  background: rgba(253, 242, 248, 0.82);
  color: #8f3f68;
}

.pilgrimage-detail-tag:nth-child(4n + 2) {
  border-color: rgba(94, 234, 212, 0.58);
  background: rgba(240, 253, 250, 0.82);
  color: #1d6564;
}

.pilgrimage-detail-tag:nth-child(4n + 3) {
  border-color: rgba(252, 211, 77, 0.58);
  background: rgba(255, 251, 235, 0.84);
  color: #76591c;
}

.pilgrimage-detail-tag:nth-child(4n) {
  border-color: rgba(196, 181, 253, 0.62);
  background: rgba(245, 243, 255, 0.84);
  color: #614990;
}

.pilgrimage-photo :deep(.preview-image) {
  height: 112px;
  width: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.pilgrimage-photo :deep(.group) {
  display: block;
  width: 100%;
}

@keyframes pilgrimage-detail-skeleton {
  from {
    opacity: 0.46;
  }

  to {
    opacity: 0.88;
  }
}
</style>
