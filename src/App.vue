<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import { usePageScroll } from '@/composables/page-scroll'

const pageScroll = usePageScroll()

onMounted(() => {
  pageScroll.notifyAppMounted()
})
</script>
