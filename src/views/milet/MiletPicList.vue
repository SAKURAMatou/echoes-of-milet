<template>
  <!-- <h1 class="text-yellow-900">milet的图集</h1> -->
  <div class="relative w-full px-4 py-6">
    <div
      class="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-xl shadow-md relative"
      id="tips"
    >
      <div class="flex items-center mb-3">
        <svg
          class="w-6 h-6 flex-shrink-0 mr-2 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9 12h2V8H9v4zm0 4h2v-2H9v2zm1-14a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
        <h2 class="text-lg font-bold flex-1">
          {{ $getConfigLang('miletPic')['tip'] }}
        </h2>
      </div>
    </div>

    <div class="image-gallery grid grid-cols-1 md:grid-cols-2 gap-6 mb-4" id="gallery">
      <!--  :data-pswp-width="1600"
      :data-pswp-height="900"    target="_blank"-->
      <div
        v-for="(img, index) in imgList"
        :key="img.link"
        class="rounded-xl p-6 max-w-lg image-wrapper"
      >
        <a
          :href="img.link"
          :data-pswp-src="img.link"
          class="image-item pswp-gallery__item"
          :data-pswp-width="img.w"
          :data-pswp-height="img.h"
          rel="noopener"
          target="_blank"
        >
          <LazyImage
            :src="img.prelink && img.prelink != '' ? img.prelink : img.link"
            :alt="'Image ' + index"
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
import LazyImage from '@/components/LazyImage.vue'

const imgList = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
let lightbox = null

// const instance = getCurrentInstance()
// const lazyload = instance?.appContext.config.globalProperties.$Lazyload

onMounted(async () => {
  document.title = 'milet photo album'
  loadPage()
})
const loading = ref(false)
/**
 * 加载数据
 */
const loadPage = async () => {
  loading.value = true
  const resData = await axiosInstance.post(
    import.meta.env.VITE_URL_API_MILET_PICLIST + currentPage.value,
    JSON.stringify({ tag: null }),
  )
  // const resData = res.data

  if (resData.code === 200) {
    imgList.value = resData.data
    totalPages.value = resData.maxPage
    imgList.value.forEach((img) => {
      img.link =
        import.meta.env.VITE_BASE_API_URI + import.meta.env.VITE_URL_STATIC_MILET_I + img.link
      if (img.prelink && img.prelink != '') {
        img.prelink =
          import.meta.env.VITE_BASE_API_URI + import.meta.env.VITE_URL_STATIC_MILET_I + img.prelink
      }
    })
  }
  await nextTick()
  // 确保页面滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setupLazyAndLightbox()
  // const lazyload = getCurrentInstance()?.appContext.config.globalProperties.$Lazyload
  // console.log(lazyload, lazyload?.lazyLoadHandler)
  // lazyload?.lazyLoadHandler?.()
}

/**
 * lightbox加载
 */
const setupLazyAndLightbox = () => {
  if (lightbox) {
    lightbox.destroy()
    lightbox = null
  }

  // 等待所有图片懒加载完成后再初始化 lightbox
  const imgs = document.querySelectorAll('.image-wrapper img')
  let loadedCount = 0
  const total = imgList.value.length

  const tryInit = () => {
    loadedCount++
    if (loadedCount >= total) {
      // 确保 DOM 已经渲染并且图片都加载完成
      lightbox = new PhotoSwipeLightbox({
        gallery: '#gallery',
        children: '.image-wrapper a',
        pswpModule: () => import('photoswipe'),
        preloadFirstSlide: true,
        showHideAnimationType: 'zoom',
      })
      lightbox.init()
      loading.value = false
      // $Lazyload.lazyLoadHandler()
    }
  }

  // 监听每个图片的加载事件
  imgs.forEach((img) => {
    if (img.complete) {
      tryInit()
    } else {
      img.addEventListener('load', tryInit, { once: true })
    }
  })
}

onUnmounted(() => {
  if (lightbox) {
    lightbox.destroy()
    lightbox = null
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
