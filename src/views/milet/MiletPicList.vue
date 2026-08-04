<template>
  <section>
    <div class="px-4 pt-4 sm:px-6 sm:pt-6">
      <button
        type="button"
        v-echo-press
        class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-sky-200/90 bg-white/80 px-4 text-sm font-semibold text-[#317f8d] shadow-[0_14px_34px_-26px_rgba(20,61,99,0.72)] backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70 motion-reduce:transform-none motion-reduce:transition-none"
        @click="returnToAlbumList"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span>{{ pageText.backToAlbums }}</span>
      </button>
    </div>

    <MiletAlbumViewer :gallery-id="galleryId" :lang="routeLang" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MiletAlbumViewer from '@/components/milet/gallery/MiletAlbumViewer.vue'
import { MILET_PIC_TEXT } from '@/composables/lang/miletPic'

const route = useRoute()
const router = useRouter()
const galleryId = computed(() => String(route.params.galleryId || ''))
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const pageText = computed(() => MILET_PIC_TEXT[routeLang.value === 'ja' ? 'jp' : 'zh'])

function returnToAlbumList() {
  const previousLocation = router.options.history.state.back
  if (typeof previousLocation === 'string') {
    const previousRoute = router.resolve(previousLocation)
    if (previousRoute.name === 'miletPicAlbum' && String(previousRoute.params.lang) === routeLang.value) {
      router.back()
      return
    }
  }

  router.push({ name: 'miletPicAlbum', params: { lang: routeLang.value } })
}

onMounted(() => {
  document.title = 'milet photo album'
})
</script>
