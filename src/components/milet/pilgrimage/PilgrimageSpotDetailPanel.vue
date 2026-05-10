<template>
  <aside
    id="pilgrimage-detail"
    class="absolute inset-x-0 bottom-0 z-[1000] max-h-[72%] overflow-y-auto rounded-t-2xl border-t border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,250,248,0.96))] px-4 pb-5 pt-3 shadow-[0_-24px_70px_-42px_rgba(31,41,55,0.86)] transition-transform duration-300 sm:px-6 lg:static lg:z-auto lg:max-h-full lg:min-h-0 lg:translate-y-0 lg:overflow-y-auto lg:rounded-none lg:border-t-0 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(245,250,248,0.82))] lg:px-5 lg:py-5 lg:shadow-none"
    :class="
      selectedSpotDetail
        ? 'translate-y-0'
        : 'pointer-events-none translate-y-[calc(100%+1rem)] lg:pointer-events-auto'
    "
  >
    <div v-if="selectedSpotDetail" class="flex h-full flex-col">
      <div
        class="sticky top-0 z-30 -mx-4 mb-3 flex h-10 items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] px-4 pt-1 sm:-mx-6 sm:px-6 lg:hidden"
      >
        <span class="mx-auto h-1.5 w-12 rounded-full bg-[#c8d7d4]" aria-hidden="true" />
        <button
          type="button"
          class="absolute right-4 top-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e7e4] bg-white/92 text-lg leading-none text-[#60717a] shadow-[0_12px_30px_-22px_rgba(31,41,55,0.9)] sm:right-6"
          aria-label="Close spot detail"
          @click="$emit('close')"
        >
          x
        </button>
      </div>

      <div class="overflow-hidden rounded-lg border border-white/80 bg-white/78 shadow-[0_22px_60px_-42px_rgba(31,41,55,0.8)]">
        <img
          :src="selectedSpotDetail.coverImageUrl"
          :alt="selectedSpotDetail.title"
          class="h-48 w-full object-cover"
        />
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#789096]">
                {{ selectedSpotDetail.category }}
              </p>
              <h2 class="mt-1 break-words font-serif text-3xl leading-tight text-[#26313a]">
                {{ selectedSpotDetail.title }}
              </h2>
            </div>
            <a
              :href="navigationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 rounded-lg border border-[#6fb8ad] bg-[#e8f8f4] px-3 py-2 text-sm font-semibold text-[#1f6a66] transition hover:border-[#4f9f99] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
            >
              {{ pageText.navigation }}
            </a>
          </div>

          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.14em] text-[#82939a]">
                {{ pageText.works }}
              </dt>
              <dd class="mt-1 text-[#34444b]">{{ selectedSpotDetail.workTitle }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.14em] text-[#82939a]">
                {{ pageText.address }}
              </dt>
              <dd class="mt-1 leading-6 text-[#526670]">{{ selectedSpotDetail.address }}</dd>
            </div>
          </dl>

          <p class="mt-4 text-sm leading-7 text-[#526670]">
            {{ selectedSpotDetail.description }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="tag in selectedSpotDetail.tags"
              :key="tag"
              class="rounded-lg border border-[#dbe7e4] bg-[#f7fbfa] px-2.5 py-1 text-xs text-[#60717a]"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <section class="mt-5 min-h-0 flex-1">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[#64777f]">
            {{ pageText.photoLabel }}
          </h3>
          <span class="text-xs text-[#8a9ca2]">{{ selectedSpotDetail.photos.length }}</span>
        </div>

        <div class="photo-grid grid gap-3">
          <a
            v-for="photo in selectedSpotDetail.photos"
            :key="photo.id"
            :href="photo.fullUrl"
            :data-fancybox="galleryName"
            :data-caption="photo.caption"
            :data-width="photo.width"
            :data-height="photo.height"
            :data-download-src="photo.downloadUrl || photo.fullUrl"
            class="pilgrimage-photo block overflow-hidden rounded-lg border border-white/80 bg-white/78 p-1 shadow-[0_16px_42px_-34px_rgba(31,41,55,0.78)] transition hover:-translate-y-0.5 hover:border-[#9bd0c8]"
          >
            <LazyImage
              :src="photo.thumbUrl || photo.fullUrl"
              :alt="photo.alt"
              :downloadSrc="photo.downloadUrl || photo.fullUrl"
            />
          </a>
        </div>
      </section>
    </div>

    <div
      v-else
      class="flex min-h-[480px] items-center justify-center rounded-lg border border-dashed border-[#cadbd7] bg-white/48 p-8 text-center text-sm leading-7 text-[#60717a]"
    >
      {{ spotsLoading ? pageText.loading : pageText.emptySpot }}
    </div>
  </aside>
</template>

<script setup lang="ts">
import LazyImage from '@/components/LazyImage.vue'
import type { PilgrimagePageText, PilgrimageSpotDetail } from '@/composables/miletPilgrimage'

defineProps<{
  pageText: PilgrimagePageText
  selectedSpotDetail: PilgrimageSpotDetail | null
  navigationUrl: string
  galleryName: string
  spotsLoading: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.photo-grid {
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
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

@media (max-width: 1023px) {
  .photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
