<template>
  <!-- <h1 class="text-yellow-900">milet的图集</h1> -->
  <div class="relative w-full px-4 py-6">
    <div
      class="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-xl shadow-md relative"
      id="tips"
    >
      <div class="flex items-center mb-3">
        <svg class="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12h2V8H9v4zm0 4h2v-2H9v2zm1-14a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
        <h2 class="text-lg font-bold">
          提示：本站图片部分来自网络、MV；尽可能避免fc图片外泄，可能会有漏网之鱼
        </h2>
      </div>
    </div>

    <div class="image-gallery grid grid-cols-1 md:grid-cols-2 gap-6 mb-4" id="gallery">
      <!--  :data-pswp-width="1600"
      :data-pswp-height="900" -->
      <div v-for="(img, index) in imgList" :key="index" class="rounded-xl p-6 max-w-lg">
        <a
          :href="img.src"
          class="image-item pswp-gallery__item"
          :data-pswp-width="img.w"
          :data-pswp-height="img.h"
          target="_blank"
          rel="noopener"
        >
          <img
            v-lazy="img.src"
            loading="lazy"
            :alt="'Image ' + index"
            class="preview-image object-contain rounded-lg"
          />
        </a>
      </div>
    </div>
    <!-- 分页组件 -->
    <div class="absolute bottom-6 right-0 left-0 w-full mx-auto pt-2">
      <div class="max-md:hidden">
        <pagination_long :totalPages="1" :currentPage="1" />
      </div>
      <div class="md:hidden">
        <pagination_short />
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'
import pagination_long from '@/components/Pagination1.vue'
import pagination_short from '@/components/Pagination2.vue'

const imgList = ref([])

onMounted(async () => {
  try {
    const res = await fetch('/data/miletPicList.json')
    imgList.value = await res.json()
    const lightbox = new PhotoSwipeLightbox({
      gallery: '#gallery',
      children: 'a',
      pswpModule: () => import('photoswipe'),
      preloadFirstSlide: true, // ✅ 确保首次加载前先取到尺寸
      showHideAnimationType: 'zoom', // 更平滑的过渡动画（可选）
    })

    lightbox.init()
  } catch (e) {
    console.error('图片数据加载失败', e)
  }
})

onUnmounted(() => {})
</script>

<style scoped></style>
