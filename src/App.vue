<template>
  <a class="echo-skip-link" href="#main-content">Skip to content</a>
  <router-view />
  <SiteEchoLayer />
  <EchoScrollProgress />
  <EchoStatusAnnouncer />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import { usePageScroll } from '@/composables/page-scroll'
import { useSiteInteraction } from '@/composables/site-interaction'
import EchoScrollProgress from '@/components/interaction/EchoScrollProgress.vue'
import EchoStatusAnnouncer from '@/components/interaction/EchoStatusAnnouncer.vue'
import SiteEchoLayer from '@/components/interaction/SiteEchoLayer.vue'

const pageScroll = usePageScroll()
const interaction = useSiteInteraction()
let disconnectInteraction: (() => void) | null = null

onMounted(() => {
  disconnectInteraction = interaction.connect()
  pageScroll.notifyAppMounted()
})

onBeforeUnmount(() => disconnectInteraction?.())
</script>
