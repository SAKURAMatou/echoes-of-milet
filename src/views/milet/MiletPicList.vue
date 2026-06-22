<template>
  <MiletAlbumViewer :gallery-id="galleryId" :lang="routeLang" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MiletAlbumViewer from '@/components/milet/gallery/MiletAlbumViewer.vue'

const route = useRoute()
const galleryId = computed(() => String(route.params.galleryId || ''))
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))

onMounted(() => {
  document.title = 'milet photo album'
})
</script>
