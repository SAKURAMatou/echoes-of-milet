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
      v-if="epsSingles.length > 0"
      title="EP / 单曲"
      subtitle="EPs & Singles"
      :works="epsSingles"
      next-id="live"
      next-title="演唱会 BD / DVD"
      anchor-id="chapter-ep-single"
    />
    <ReleaseSection
      v-if="epsSingles.length > 0"
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

import { ref, computed } from 'vue'
import { useReleaseData } from '@/composables/useReleaseData'

// 使用 useReleaseData composable 按需加载数据
// 类型参数：1 = ALBUM, 2 = EP/SINGLE, 3 = LIVE
const albumsData = useReleaseData({ type: 1, elementId: 'chapter-albums' })
const epsSinglesData = useReleaseData({ type: 2, elementId: 'chapter-ep-single' })
const livesData = useReleaseData({ type: 3, elementId: 'chapter-live' })

// 计算属性：当数据加载完成时使用后端数据，否则显示空数组或fallback
const albums = computed(() => albumsData.data.value)
const epsSingles = computed(() => epsSinglesData.data.value)
const lives = computed(() => livesData.data.value)

const drawerOpen = ref(false)

function scrollToAnchor(anchorId: string) {
  const el = document.getElementById(anchorId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const chapters = computed(() => [
  {
    key: 'ALBUMS' as const,
    title: 'Album',
    subtitle: `${albums.value.length} releases`,
    works: albums.value,
    anchorId: 'chapter-albums',
    covers: [],
  },
  {
    key: 'EP_SINGLE' as const,
    title: 'EP / Single',
    subtitle: `${epsSingles.value.length} releases`,
    works: epsSingles.value,
    anchorId: 'chapter-ep-single',
    covers: [],
  },
  {
    key: 'LIVE' as const,
    title: 'Live BD / DVD',
    subtitle: `${lives.value.length} releases`,
    works: lives.value,
    anchorId: 'chapter-live',
    covers: [],
  },
])
</script>
