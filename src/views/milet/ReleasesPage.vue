<template>
  <div class="mx-4">
    <ReleaseSection
      title="专辑"
      subtitle="Albums"
      :works="albums"
      next-id="ep"
      next-title="EP / 单曲"
      anchor-id="chapter-albums"
    />
    <ReleaseSection
      title="EP / 单曲"
      subtitle="EPs & Singles"
      :works="epsSingles"
      next-id="live"
      next-title="演唱会 BD / DVD"
      anchor-id="chapter-ep-single"
    />
    <ReleaseSection
      title="演唱会 BD / DVD"
      subtitle="Live BD/DVD"
      :works="lives"
      anchor-id="chapter-live"
    />
  </div>
  <!-- 右侧浮动章节胶囊（替代顶部 Tab）pc,手机屏幕对应的菜单按钮 -->
  <FloatingChapterNav :chapters="chapters" @jump="scrollToAnchor" @open-map="drawerOpen = true" />
  <!-- 堆叠地图抽屉：快速跳转到章节（非常个性化） -->
  <StackMapDrawer
    :open="drawerOpen"
    :chapters="chapters"
    @close="drawerOpen = false"
    @jump="
      (anchorId) => {
        drawerOpen = false
        scrollToAnchor(anchorId)
      }
    "
  />
</template>
<!-- src/pages/ReleasesPage.vue -->
<script setup lang="ts">
import ReleaseSection from '@/components/milet/music/ReleaseSection.vue'

import FloatingChapterNav from '@/components/milet/music/FloatingChapterNav.vue'
import StackMapDrawer from '@/components/milet/music/StackMapDrawer.vue'

import { albums } from '@/mock/albums'
import { epsSingles } from '@/mock/epsSingles'
import { lives } from '@/mock/lives'
import { ref } from 'vue'

const drawerOpen = ref(false)

function scrollToAnchor(anchorId: string) {
  const el = document.getElementById(anchorId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const chapters = [
  {
    key: 'ALBUMS' as const,
    title: 'Album',
    subtitle: `${albums.length} releases`,
    works: albums,
    anchorId: 'chapter-albums',
    covers: [],
  },
  {
    key: 'EP_SINGLE' as const,
    title: 'EP / Single',
    subtitle: `${epsSingles.length} releases`,
    works: epsSingles,
    anchorId: 'chapter-ep-single',
    covers: [],
  },
  {
    key: 'LIVE' as const,
    title: 'Live BD / DVD',
    subtitle: `${lives.length} releases`,
    works: lives,
    anchorId: 'chapter-live',
    covers: [],
  },
]
</script>
