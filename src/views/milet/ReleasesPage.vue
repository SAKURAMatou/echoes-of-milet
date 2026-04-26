<template>
  <div class="mx-4">
    <div id="chapter-albums">
      <ReleaseSection
        :title="pageText.title.album"
        subtitle="Albums"
        :works="albums"
        next-id="ep"
        :next-title="pageText.title.ep"
      />
      <div v-if="albumsData.hasMore.value" class="flex justify-center py-4">
        <div class="w-full max-w-3xl px-4">
          <button
            @click="albumsData.loadMore"
            :disabled="albumsData.loading.value"
            class="w-full py-3 bg-slate-900 text-white rounded-2xl shadow-md hover:opacity-95 disabled:opacity-50"
          >
            {{ albumsData.loading.value ? 'Loading...' : 'Load More Albums' }}
          </button>
        </div>
      </div>
    </div>
    <div id="chapter-ep-single">
      <ReleaseSection
        v-if="epsSingles.length > 0"
        :title="pageText.title.ep"
        subtitle="EPs & Singles"
        :works="epsSingles"
        next-id="live"
        :next-title="pageText.title.live"
      />
      <div v-if="epsSinglesData.hasMore.value" class="flex justify-center py-4">
        <div class="w-full max-w-3xl px-4">
          <button
            @click="epsSinglesData.loadMore"
            :disabled="epsSinglesData.loading.value"
            class="w-full py-3 bg-slate-900 text-white rounded-2xl shadow-md hover:opacity-95 disabled:opacity-50"
          >
            {{ epsSinglesData.loading.value ? 'Loading...' : 'Load More EP / Singles' }}
          </button>
        </div>
      </div>
    </div>
    <div id="chapter-live">
      <ReleaseSection
        v-if="lives.length > 0"
        :title="pageText.title.live"
        subtitle="Live BD/DVD"
        :works="lives"
      />
      <div v-if="livesData.hasMore.value" class="flex justify-center py-4">
        <div class="w-full max-w-3xl px-4">
          <button
            @click="livesData.loadMore"
            :disabled="livesData.loading.value"
            class="w-full py-3 bg-slate-900 text-white rounded-2xl shadow-md hover:opacity-95 disabled:opacity-50"
          >
            {{ livesData.loading.value ? 'Loading...' : 'Load More Live BD/DVD' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- 右侧浮动章节胶囊（替代顶部 Tab）pc,手机屏幕对应的菜单按钮 -->

  <div>
    <div class="fixed right-3 md:right-6 top-[90px] md:top-[110px] z-[300]">
      <div class="flex flex-col items-end gap-2">
        <button
          class="md:hidden rounded-full border bg-white/80 backdrop-blur px-3 py-2 shadow-sm hover:bg-white text-sm"
          @click="drawerOpen = true"
        >
          {{ pageText.stackMap.desc }}
        </button>
      </div>
    </div>
  </div>
  <!-- 堆叠地图抽屉：快速跳转到章节 -->
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

import StackMapDrawer from '@/components/milet/music/StackMapDrawer.vue'

import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useReleaseData } from '@/composables/useReleaseData'

import { RELEASE_PAGE_TEXT } from '@/composables/lang/ReleaseMetaData'

const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

const pageText = computed(() => {
  const lang = global.$lang?.lang ? global.$lang.lang : 'zh'
  return RELEASE_PAGE_TEXT[lang]
})
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

onMounted(() => {
  document.title = 'milet releases'
})
</script>
