<template>
  <MiletHomeCard id="introduction" v-if="!loading && miletDataL" :cardDataL="miletDataL.card" />
  <Divider1 />

  <div id="gallery" class="relative w-full px-4 my-10">
    <RouterLink :to="{ name: 'miletPicAlbum' }" target="_blank">
      <button
        class="w-full bg-gradient-to-r from-pink-200 via-yellow-100 to-blue-100 text-blue-800 font-semibold py-3 rounded-xl shadow-md border border-yellow-300 transition duration-300 cursor-pointer"
      >
        馃摳 {{ $getConfigLang('miletHomeView')['title1'] }}
      </button>
      <div class="absolute top-[-10px] left-3 w-4 h-4 bg-red-300 rotate-45 shadow-sm"></div>
    </RouterLink>
  </div>

  <Divider1 />

  <MiletHomeTimeLine
    id="timeline"
    v-if="!loading && miletDataL"
    :timelineDataL="miletDataL.timeline"
  />
  <Divider1 />

  <div class="mx-auto max-w-3xl">
    <MiletSite v-if="!loading && miletDataL" :miletSiteData="miletDataL.site" />
  </div>
</template>
<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onServerPrefetch, ref } from 'vue'

import axiosInstance from '@/AxiosUtil'
import Divider1 from '@/components/Divider1.vue'
import MiletHomeCard from '@/components/milet/MiletHomeCard.vue'
import MiletHomeTimeLine from '@/components/milet/MiletHomeTimeLine.vue'
import MiletSite from '@/components/milet/MiletSite.vue'
import { useAppState } from '@/composables/useAppState'
import { apiRoutes } from '@/config/api'

const internalInstance = getCurrentInstance()
const global = internalInstance?.appContext.config.globalProperties
const appState = useAppState()
const miletDatas = ref<Record<string, any> | null>(appState.miletHomeData)
const loading = ref(!miletDatas.value)

async function loadMiletHomeData() {
  if (miletDatas.value) {
    loading.value = false
    return
  }

  try {
    const resJson = await axiosInstance.post(apiRoutes.miletHome)

    if (resJson.code === 200) {
      miletDatas.value = resJson.data
      appState.miletHomeData = resJson.data
    }
  } catch (error) {
    console.error('data fetch error', error)
  } finally {
    loading.value = false
  }
}

onServerPrefetch(loadMiletHomeData)

onMounted(async () => {
  document.title = 'echoes of milet'

  if (!miletDatas.value) {
    await loadMiletHomeData()
  }
})

const miletDataL = computed(() => {
  if (!miletDatas.value) {
    return null
  }

  return miletDatas.value[global?.$lang.lang || appState.lang] || null
})
</script>
