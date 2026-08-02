<template>
  <button
    v-if="isClientReady"
    v-show="isShow"
    type="button"
    :style="{ opacity: opacityValue, '--echo-progress': progressValue }"
    class="echo-up-to-top echo-focus cursor-pointer"
    :aria-label="label"
    @click="scrollToTop"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="22px"
      width="22px"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { usePageScroll } from '@/composables/page-scroll'

const pageScroll = usePageScroll()
const route = useRoute()
const isShow = computed(() => pageScroll.state.top > 100)
const opacityValue = computed(() => {
  if (pageScroll.state.max <= 0) return 0
  return Math.min(pageScroll.state.top / (pageScroll.state.max * 0.5), 1)
})
const isClientReady = ref(false)
const progressValue = computed(() => `${Math.min(1, Math.max(0, pageScroll.state.progress))}turn`)
const label = computed(() => (String(route.params.lang) === 'ja' ? 'ページ上部へ戻る' : '返回页面顶部'))

function scrollToTop() {
  pageScroll.scrollToTop({ behavior: 'smooth' })
}

onMounted(() => {
  isClientReady.value = true
})
</script>

<style scoped>
.echo-up-to-top {
  position: relative;
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .82);
  border-radius: 9999px;
  color: var(--echo-color-ink);
  background:
    radial-gradient(circle at center, rgba(255,255,255,.96) 0 54%, transparent 55%),
    conic-gradient(var(--echo-color-teal) var(--echo-progress), rgba(143,197,223,.2) 0);
  box-shadow: 0 14px 36px -22px rgba(26,44,80,.65), inset 0 1px 0 rgba(255,255,255,.9);
  transition: border-color var(--echo-duration-micro), background-color var(--echo-duration-micro), opacity var(--echo-duration-micro);
}
.echo-up-to-top:hover { border-color: rgba(49,127,141,.48); }
</style>
