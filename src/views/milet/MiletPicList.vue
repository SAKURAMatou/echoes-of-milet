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

    <div class="image-gallery gallery grid grid-cols-1 md:grid-cols-2 gap-6 mb-4" id="gallery">
      <!--  :data-pswp-width="1600"
      :data-pswp-height="900"    target="_blank"-->
      <div
        v-for="(img, index) in imgList"
        :key="img.link"
        class="rounded-xl p-6 max-w-lg image-wrapper"
      >
        <!-- :data-pswp-width="img.w"
          :data-pswp-height="img.h" rel="noopener" -->
        <a
          data-fancybox="gallery"
          :href="img.link"
          :data-width="img.w"
          :data-height="img.h"
          class="image-item pswp-gallery__item"
          :data-caption="'Caption #' + index"
          :data-download-src="img.link"
        >
          <LazyImage
            :src="img.prelink && img.prelink != '' ? img.prelink : img.link"
            :alt="'Image ' + index"
            :downloadSrc="img.link"
          />
        </a>
      </div>
    </div>
    <!-- 分页组件 -->
    <div class="absolute bottom-6 right-0 left-0 w-full mx-auto pt-2">
      <div class="max-md:hidden">
        <pagination_long
          :totalPages="totalPages"
          :currentPage="currentPage"
          @pageChange="pageChange"
        />
      </div>
      <div class="md:hidden">
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

import pagination_long from '@/components/Pagination1.vue'
import pagination_short from '@/components/Pagination2.vue'
import axiosInstance from '@/AxiosUtil'
import LazyImage from '@/components/LazyImage.vue'
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const imgList = ref([])
const currentPage = ref(1)
const totalPages = ref(1)

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
}

/**
 * lightbox加载
 */
const setupLazyAndLightbox = () => {
  //先解除旧绑定
  Fancybox.destroy()
  //再绑定新数据
  Fancybox.bind("[data-fancybox='gallery']", {
    Carousel: {
      Toolbar: {
        display: {
          left: ['counter'],
          middle: [],
          right: ['download', 'thumbs', 'close'],
        },
      },
    },
    on: {
      'Carousel.ready': (fancybox, slide) => {
        const downloadBtn = fancybox.Toolbar?.querySelector('[data-fancybox-download]')
        if (downloadBtn) {
          console.log('downloadBtn', downloadBtn)
          downloadBtn.setAttribute('download', '')
        }
        // console.log('ready,Carousel:', fancybox, slide)
      },
    },
  })
}

onUnmounted(() => {
  Fancybox.destroy()
})

const pageChange = (page) => {
  if (page != currentPage.value) {
    currentPage.value = page
    loadPage()
  }
}
</script>

<style scoped></style>
