<template>
  <h1 class="text-3xl font-bold text-center mb-4">milet</h1>

  <MiletHomeCard />
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
        📸 图集 Album
      </button>
      <div class="absolute top-[-10px] left-3 w-4 h-4 bg-red-300 rotate-45 shadow-sm"></div>
      <!-- 手帐胶带角标 -->
    </RouterLink>
  </div>

  <Divider1 />
  <!-- timeline -->
  <MiletHomeTimeLine />
  <Divider1 />
  <!-- milet官方网站连接 -->
  <div class="mx-auto max-w-3xl space-y-10">
    <MiletSite />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import Divider1 from '@/components/Divider1.vue'
import MiletSite from '@/components/milet/MiletSite.vue'
import MiletHomeCard from '@/components/milet/MiletHomeCard.vue'
import MiletHomeTimeLine from '@/components/milet/MiletHomeTimeLine.vue'
</script>
