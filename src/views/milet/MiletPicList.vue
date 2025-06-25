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
      <div
        v-for="(img, index) in imgList"
        :key="index"
        class="rounded-xl p-6 max-w-lg image-wrapper"
      >
        <a
          :href="img.link"
          class="image-item pswp-gallery__item"
          :data-pswp-width="img.w"
          :data-pswp-height="img.h"
          target="_blank"
          rel="noopener"
        >
          <!-- v-lazy="img.src" -->
          <!-- loading="lazy" -->
          <img
            v-lazy="img.link"
            loading="lazy"
            :alt="'Image ' + index"
            class="preview-image object-contain rounded-lg"
          />
        </a>
      </div>
    </div>
    <!-- 分页组件 -->
    <div class="absolute bottom-6 right-0 left-0 w-full mx-auto pt-2">
      <div class="max-md:hidden" v-if="!loading">
        <pagination_long
          :totalPages="totalPages"
          :currentPage="currentPage"
          @pageChange="pageChange"
        />
      </div>
      <div class="md:hidden" v-if="!loading">
        <pagination_short
          :totalPages="totalPages"
          :currentPage="currentPage"
          @pageChange="pageChange"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'
import pagination_long from '@/components/Pagination1.vue'
import pagination_short from '@/components/Pagination2.vue'
import axiosInstance from '@/AxiosUtil'

const imgList = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
let lightbox = null

const { appContext } = getCurrentInstance() // 拿到组件上下文实例
const $Lazyload = appContext.config.globalProperties?.$Lazyload
console.log(appContext, $Lazyload)
onMounted(async () => {
  loadPage()
})
const loading = ref(false)
/**
 * 加载数据
 */
const loadPage = async () => {
  loading.value = true
  const res = await axiosInstance.post(
    import.meta.env.VITE_URL_API_MILET_PICLIST + currentPage.value,
  )
  const resData = res.data

  if (resData.code === 200) {
    imgList.value = resData.data
    totalPages.value = resData.maxPage
    imgList.value.map(
      (img) =>
        (img.link =
          import.meta.env.VITE_BASE_API_URI + import.meta.env.VITE_URL_STATIC_MILET_I + img.link),
    )
  }
  await nextTick()
  setupLazyAndLightbox()
  loading.value = false
}

/**
 * lightbox加载
 */
const setupLazyAndLightbox = () => {
  if (lightbox) {
    lightbox.destroy()
    lightbox = null
  }
  //等待懒加载渲染完整之后再初始化lightbox
  let loadedCount = 0
  const total = imgList.value.length

  const tryInit = () => {
    loadedCount++
    if (loadedCount >= total) {
      lightbox = new PhotoSwipeLightbox({
        gallery: '#gallery',
        children: '.image-wrapper a',
        pswpModule: () => import('photoswipe'),
        preloadFirstSlide: true,
        showHideAnimationType: 'zoom',
      })
      lightbox.init()
    }
  }

  $Lazyload.$once?.('loaded', tryInit)
  document.querySelectorAll('.image-wrapper img').forEach((img) => {
    console.log('.image-wrapper img')
    if (img.complete) {
      tryInit()
    }
  })
}

onUnmounted(() => {
  if (lightbox) {
    lightbox.destroy()
  }
})

const pageChange = (page) => {
  if (page != currentPage.value) {
    currentPage.value = page
    loadPage()
  }
}
</script>

<style scoped></style>
