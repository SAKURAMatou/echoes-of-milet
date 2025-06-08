<template>
  <!--  border border-yellow-400 rounded-full shadow bg-yellow-200 -->
  <div class="px-4 py-1 font-semibold text-lg">🧷 milet官方网站</div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-5 pb-10">
    <a
      v-for="(site, index) in miletSiteData"
      :key="index"
      :href="site.link"
      :title="site.title"
      target="_blank"
      class="group block max-w-[600px] mx-auto rounded-lg shadow-lg overflow-hidden border border-blue-200 hover:shadow-xl transition-shadow duration-300 bg-white"
    >
      <div class="aspect-[1.91/1] overflow-hidden">
        <img
          :src="site.oginImage"
          alt="milet logo"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div class="px-4 py-3">
        <h3 class="text-blue-800 font-semibold text-lg">{{ site.description }}</h3>
        <!-- <p class="text-gray-600 text-sm mt-1">记录开发、技术灵感与日常思考</p> -->
      </div>
    </a>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const miletSiteData = ref([
  {
    title: '官方网站',
    description: 'milet的官方网站，包含最新资讯、音乐作品、演唱会信息等。',
    link: 'https://milet.jp/',
    oginImage: '/milet-img/milet-site-og-img.jpg',
  },
  {
    title: '官方fc',
    description: 'milet的官方的fanclub，每月只要440日元就能查看会员专享。',
    link: 'https://fc.milet.jp/',
    oginImage: '/milet-img/milet-fc-og-img.png',
  },
])
</script>
