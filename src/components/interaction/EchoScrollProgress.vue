<template>
  <div v-if="showProgress" class="echo-progress" aria-hidden="true">
    <span class="echo-progress__track"></span>
    <span class="echo-progress__value" :style="progressStyle"></span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { usePageScroll } from '@/composables/page-scroll'
import { resolveInteractionPreset } from '@/composables/site-interaction'

const route = useRoute()
const pageScroll = usePageScroll()
const mounted = ref(false)
const preset = computed(() => resolveInteractionPreset(route.meta.interactionPreset))
const showProgress = computed(
  () =>
    mounted.value &&
    route.meta.showEchoProgress !== false &&
    preset.value !== 'map' &&
    preset.value !== 'challenge' &&
    preset.value !== 'immersive' &&
    pageScroll.state.max > pageScroll.state.viewportHeight * 0.5,
)

onMounted(() => {
  mounted.value = true
})
const progressStyle = computed(() => ({
  transform: `scaleX(${Math.min(1, Math.max(0, pageScroll.state.progress))})`,
}))
</script>

<style scoped>
.echo-progress {
  pointer-events: none;
  position: fixed;
  inset-inline: 0;
  top: calc(4rem + env(safe-area-inset-top, 0px));
  z-index: 49;
  height: 2px;
}
.echo-progress__track,
.echo-progress__value { position: absolute; inset: 0; transform-origin: left center; }
.echo-progress__track { background: rgba(143, 197, 223, .14); }
.echo-progress__value {
  background: linear-gradient(90deg, var(--echo-color-sky), var(--echo-color-teal), var(--echo-color-gold));
  box-shadow: 0 0 10px rgba(49, 127, 141, .22);
}
@media (prefers-reduced-motion: reduce) { .echo-progress__value { transition: none; } }
</style>
