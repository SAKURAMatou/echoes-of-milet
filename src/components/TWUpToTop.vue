<template>
  <button
    v-if="isClientReady"
    v-show="isShow"
    type="button"
    :style="{ opacity: opacityValue }"
    class="rounded-lg bg-blue-500 text-white shadow-lg transition-opacity duration-300 cursor-pointer"
    aria-label="Back to top"
    @click="scrollToTop"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="48px"
      width="48px"
      viewBox="0 -960 960 960"
      fill="#FFFFFF"
      aria-hidden="true"
    >
      <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { usePageScroll } from '@/composables/page-scroll'

const pageScroll = usePageScroll()
const isShow = computed(() => pageScroll.state.top > 100)
const opacityValue = computed(() => {
  if (pageScroll.state.max <= 0) return 0
  return Math.min(pageScroll.state.top / (pageScroll.state.max * 0.5), 1)
})
const isClientReady = ref(false)

function scrollToTop() {
  pageScroll.scrollToTop({ behavior: 'smooth' })
}

onMounted(() => {
  isClientReady.value = true
})
</script>
