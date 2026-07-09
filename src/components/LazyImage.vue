<template>
  <div class="group relative overflow-hidden inline-block">
    <img v-lazy="src" :alt="alt" class="preview-image object-contain rounded-lg" />
    <div
      class="absolute inset-x-0 bottom-0 rounded-lg sm:translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out bg-black/50 transform"
      aria-hidden="false"
    >
      <!-- translate-y-full group-hover: translate-y-0 transition-transform duration-300 ease-out -->
      <button
        :href="downloadSrc"
        download
        @click="downloadEvent"
        class="flex cursor-pointer items-center justify-center w-full h-12 text-white text-sm font-medium select-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { withDownloadParam } from '@/composables/downloadUrl'

const props = defineProps({
  src: String,
  alt: {
    type: String,
    default: '',
  },
  downloadSrc: String,
})

function downloadEvent(e) {
  // console.log('test download:', e)
  e.stopPropagation() //阻止外层的点击事件，
  e.preventDefault() //阻止外层a标签的跳转

  const a = document.createElement('a')
  a.href = withDownloadParam(props.downloadSrc || '')
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>
