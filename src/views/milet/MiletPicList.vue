<template>
  <!-- <h1 class="text-yellow-900">milet的图集</h1> -->

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
    <!-- <p class="leading-relaxed">
          欢迎来到
          <span class="font-semibold text-yellow-600">dl 的小站</span
          >，一个普通的在日码农。这里记录生活片段、追星旅程与学习过程，希望你在这里也能找到共鸣。
        </p> -->
  </div>

  <div class="image-gallery grid grid-cols-1 md:grid-cols-2 gap-6" id="gallery">
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
</template>
<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'

const imgList = ref([
  {
    src: '/milet-img/data/img-list-test1.jpg',
    w: 1440,
    h: 1537,
  },
  {
    src: '/milet-img/data/img-list-test10.jpg',
    w: 2100,
    h: 2100,
  },
  {
    src: '/milet-img/data/img-list-test11.jpg',
    w: 900,
    h: 662,
  },
  {
    src: '/milet-img/data/img-list-test12.jpg',
    w: 1477,
    h: 1108,
  },
  {
    src: '/milet-img/data/img-list-test13.jpg',
    w: 1170,
    h: 1187,
  },
  {
    src: '/milet-img/data/img-list-test14.jpg',
    w: 1053,
    h: 1413,
  },
  {
    src: '/milet-img/data/img-list-test15.jpg',
    w: 1477,
    h: 1108,
  },
  {
    src: '/milet-img/data/img-list-test16.jpg',
    w: 1108,
    h: 1477,
  },
  {
    src: '/milet-img/data/img-list-test17.jpg',
    w: 2048,
    h: 1536,
  },
  {
    src: '/milet-img/data/img-list-test18.jpg',
    w: 2048,
    h: 1536,
  },
  {
    src: '/milet-img/data/img-list-test19.jpg',
    w: 1200,
    h: 800,
  },
  {
    src: '/milet-img/data/img-list-test2.jpg',
    w: 750,
    h: 801,
  },
  {
    src: '/milet-img/data/img-list-test20.jpg',
    w: 1005,
    h: 2048,
  },
  {
    src: '/milet-img/data/img-list-test21.jpg',
    w: 1125,
    h: 1721,
  },
  {
    src: '/milet-img/data/img-list-test22.jpg',
    w: 600,
    h: 600,
  },
  {
    src: '/milet-img/data/img-list-test23.jpg',
    w: 1102,
    h: 1335,
  },
  {
    src: '/milet-img/data/img-list-test24.jpg',
    w: 2048,
    h: 1932,
  },
  {
    src: '/milet-img/data/img-list-test25.jpg',
    w: 1536,
    h: 2048,
  },
  {
    src: '/milet-img/data/img-list-test26.jpg',
    w: 1080,
    h: 1349,
  },
  {
    src: '/milet-img/data/img-list-test27.jpg',
    w: 1280,
    h: 909,
  },
  {
    src: '/milet-img/data/img-list-test28.jpg',
    w: 955,
    h: 1280,
  },
  {
    src: '/milet-img/data/img-list-test29.jpg',
    w: 1266,
    h: 947,
  },
  {
    src: '/milet-img/data/img-list-test3.jpg',
    w: 750,
    h: 801,
  },
  {
    src: '/milet-img/data/img-list-test30.png',
    w: 1100,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test31.png',
    w: 691,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test32.png',
    w: 621,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test33.png',
    w: 1067,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test34.jpg',
    w: 2100,
    h: 2100,
  },
  {
    src: '/milet-img/data/img-list-test35.jpg',
    w: 1200,
    h: 2133,
  },
  {
    src: '/milet-img/data/img-list-test36.jpg',
    w: 1290,
    h: 2293,
  },
  {
    src: '/milet-img/data/img-list-test37.jpg',
    w: 1080,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test38.jpg',
    w: 1080,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test39.jpg',
    w: 1080,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test4.jpg',
    w: 750,
    h: 1333,
  },
  {
    src: '/milet-img/data/img-list-test40.png',
    w: 2558,
    h: 1436,
  },
  {
    src: '/milet-img/data/img-list-test41.png',
    w: 2556,
    h: 1437,
  },
  {
    src: '/milet-img/data/img-list-test42.png',
    w: 2558,
    h: 1438,
  },
  {
    src: '/milet-img/data/img-list-test43.png',
    w: 2557,
    h: 1440,
  },
  {
    src: '/milet-img/data/img-list-test44.png',
    w: 2558,
    h: 1434,
  },
  {
    src: '/milet-img/data/img-list-test45.png',
    w: 2557,
    h: 1439,
  },
  {
    src: '/milet-img/data/img-list-test46.png',
    w: 2558,
    h: 1438,
  },
  {
    src: '/milet-img/data/img-list-test47.png',
    w: 2557,
    h: 1437,
  },
  {
    src: '/milet-img/data/img-list-test48.png',
    w: 2557,
    h: 1439,
  },
  {
    src: '/milet-img/data/img-list-test49.png',
    w: 2556,
    h: 1439,
  },
  {
    src: '/milet-img/data/img-list-test50.png',
    w: 2558,
    h: 1092,
  },
  {
    src: '/milet-img/data/img-list-test51.png',
    w: 2558,
    h: 1065,
  },
  {
    src: '/milet-img/data/img-list-test52.png',
    w: 2557,
    h: 1091,
  },
  {
    src: '/milet-img/data/img-list-test53.png',
    w: 2556,
    h: 1093,
  },
  {
    src: '/milet-img/data/img-list-test54.png',
    w: 2553,
    h: 1092,
  },
  {
    src: '/milet-img/data/img-list-test55.png',
    w: 2556,
    h: 1446,
  },
  {
    src: '/milet-img/data/img-list-test56.png',
    w: 2560,
    h: 1600,
  },
  {
    src: '/milet-img/data/img-list-test57.png',
    w: 2558,
    h: 1434,
  },
  {
    src: '/milet-img/data/img-list-test58.png',
    w: 1920,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test59.png',
    w: 1920,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test6.jpg',
    w: 1477,
    h: 1108,
  },
  {
    src: '/milet-img/data/img-list-test60.png',
    w: 1920,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test61.png',
    w: 1920,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test62.png',
    w: 1920,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test63.png',
    w: 1920,
    h: 1080,
  },
  {
    src: '/milet-img/data/img-list-test64.jpg',
    w: 1440,
    h: 1440,
  },
  {
    src: '/milet-img/data/img-list-test65.jpg',
    w: 1416,
    h: 1770,
  },
  {
    src: '/milet-img/data/img-list-test66.jpg',
    w: 1246,
    h: 1557,
  },
  {
    src: '/milet-img/data/img-list-test7.jpg',
    w: 1536,
    h: 2048,
  },
  {
    src: '/milet-img/data/img-list-test8.jpg',
    w: 1058,
    h: 1411,
  },
  {
    src: '/milet-img/data/img-list-test9.jpg',
    w: 2100,
    h: 2100,
  },
])

onMounted(() => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery',
    children: 'a',
    pswpModule: () => import('photoswipe'),
    preloadFirstSlide: true, // ✅ 确保首次加载前先取到尺寸
    showHideAnimationType: 'zoom', // 更平滑的过渡动画（可选）
  })

  lightbox.init()
})

onUnmounted(() => {})
</script>

<style scoped></style>
