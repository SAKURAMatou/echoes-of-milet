<template>
  <!-- <h1 class="text-3xl font-bold text-center mb-4">milet</h1> -->

  <MiletHomeCard v-if="!loading && miletDataL" :cardDataL="miletDataL.card" />
  <!-- <div class="w-32 h-2 mx-auto my-8 bg-yellow-200 rounded-full rotate-[-2deg] shadow-md"></div> -->

  <!-- <div
    class="w-full h-4 bg-gradient-to-r from-blue-100 to-purple-100 shadow-inner my-10 rounded-full"
  ></div> -->
  <Divider1 />

  <div class="relative w-full px-4 my-10">
    <RouterLink :to="{ name: 'miletPicAlbum' }" target="_blank">
      <button
        class="w-full bg-gradient-to-r from-pink-200 via-yellow-100 to-blue-100 text-blue-800 font-semibold py-3 rounded-xl shadow-md border border-yellow-300 transition duration-300 cursor-pointer"
      >
        📸 {{ $getConfigLang('miletHomeView')['title1'] }}
      </button>
      <div class="absolute top-[-10px] left-3 w-4 h-4 bg-red-300 rotate-45 shadow-sm"></div>
      <!-- 手帐胶带角标 -->
    </RouterLink>
  </div>

  <Divider1 />
  <!-- timeline -->
  <MiletHomeTimeLine v-if="!loading && miletDataL" :timelineDataL="miletDataL.timeline" />
  <Divider1 />
  <!-- milet官方网站连接 -->
  <div class="mx-auto max-w-3xl">
    <MiletSite v-if="!loading && miletDataL" :miletSiteData="miletDataL.site" />
  </div>
</template>
<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import Divider1 from '@/components/Divider1.vue'
import MiletSite from '@/components/milet/MiletSite.vue'
import MiletHomeCard from '@/components/milet/MiletHomeCard.vue'
import MiletHomeTimeLine from '@/components/milet/MiletHomeTimeLine.vue'
import axiosInstance from '@/AxiosUtil'

const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

const miletDatas = ref({})
const loading = ref(true)

//子组件的渲染
onMounted(async () => {
  try {
    const res = await axiosInstance.post(import.meta.env.VITE_URL_API_MILET_HOME)

    const resJson = res.data
    if (resJson.code === 200) {
      miletDatas.value = resJson.data
    }
  } catch (e) {
    console.error('data fatch error', e)
  } finally {
    loading.value = false
  }
})

//根据语言选择对应的数据
const miletDataL = computed(() => {
  return miletDatas.value[global.$lang.lang]
})
</script>
