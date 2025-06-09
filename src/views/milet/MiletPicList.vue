<template>
  <h1 class="text-yellow-900">milet的图集</h1>

  <div class="image-gallery grid grid-cols-1 md:grid-cols-2 gap-6" id="gallery">
    <!--  :data-pswp-width="1600"
      :data-pswp-height="900" -->
    <div v-for="(img, index) in imgList" :key="index" class="rounded-xl p-6 max-w-lg">
      <a :href="img" class="image-item pswp-gallery__item" target="_blank" rel="noopener">
        <img
          v-lazy="img"
          loading="lazy"
          :alt="'Image ' + index"
          class="preview-image object-contain rounded-lg"
        />
      </a>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'

const imgList = ref([
  '/milet-img/data/img-list-test1.jpg',
  '/milet-img/data/img-list-test2.jpg',
  '/milet-img/data/img-list-test3.jpg',
  '/milet-img/data/img-list-test4.jpg',
  '/milet-img/data/img-list-test5.jpg',
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
</script>

<style scoped></style>
