<template>
  <section>
    <div class="mx-auto max-w-3xl px-4 pb-4 pt-4 sm:px-0 sm:pb-6 sm:pt-6">
      <button
        type="button"
        v-echo-press
        class="group relative inline-flex min-h-12 cursor-pointer items-stretch overflow-hidden rounded-r-[1.375rem] rounded-tl-[0.875rem] rounded-bl-[0.45rem] border border-l-2 border-sky-200/80 border-l-sky-300/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.82))] text-sm font-semibold text-[#317f8d] shadow-[0_16px_38px_-30px_rgba(20,61,99,0.78)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-sky-300 hover:bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(224,242,254,0.78))] hover:shadow-[0_18px_40px_-28px_rgba(20,61,99,0.72)] active:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60 motion-reduce:transition-none"
        @click="returnToAlbumList"
      >
        <span
          class="grid w-11 shrink-0 place-items-center border-r border-sky-100/90 bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.62))]"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-active:-translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
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
        </span>
        <span class="flex items-center px-4 py-3 sm:px-5">{{ pageText.backToAlbums }}</span>
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
