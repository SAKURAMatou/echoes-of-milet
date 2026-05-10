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
          {{ pageText.tip }}
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
    <!-- 自动翻页的锚点元素 -->
    <div ref="observerTarget" class="w-[100%] p-[20] text-center" v-if="!isLastPage">
      <p>loading...</p>
    </div>
    <!-- 分页组件 -->
    <!-- <div class="absolute bottom-6 right-0 left-0 w-full mx-auto pt-2">
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
    </div> -->
  </div>
</template>
<script setup>
import { computed, onMounted, ref, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'

// import pagination_long from '@/components/Pagination1.vue'
// import pagination_short from '@/components/Pagination2.vue'
import axiosInstance from '@/AxiosUtil'
import LazyImage from '@/components/LazyImage.vue'
import { apiRoutes, buildStaticAssetUrl } from '@/config/api'
import { MILET_PIC_TEXT } from '@/composables/lang/miletPic'
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const route = useRoute()
const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

const pageText = computed(() => {
  const lang = global.$lang?.lang ? global.$lang.lang : 'zh'
  return MILET_PIC_TEXT[lang]
})

const imgList = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const galleryId = ref('')

// const instance = getCurrentInstance()
// const lazyload = instance?.appContext.config.globalProperties.$Lazyload
//页面自动翻页相关参数
const isLastPage = ref(true)
const observerTarget = ref(null)

onMounted(async () => {
  document.title = 'milet photo album'
  // 从路由参数中获取 galleryId
  galleryId.value = route.params.galleryId || ''

  await loadPage()

  //页面自动翻页监听事件
  const observer = new IntersectionObserver((observerTarget) => {
    if (observerTarget[0].isIntersecting) {
      console.log('滚动到页面底部，加载下一页')
      delayfatchData()
    }
  })

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
})

/**
 * 加载数据
 */
const loadPage = async () => {
  const url = `${apiRoutes.miletPiclist}/${currentPage.value}/${galleryId.value}`
  const resData = await axiosInstance.get(url)
  // const resData = res.data

  if (resData.code === 200) {
    const resImgList = Array.isArray(resData.data) ? resData.data : []
    totalPages.value = resData.maxPage
    resImgList.forEach((img) => {
      img.link = buildStaticAssetUrl(img.url_original || img.link)
      img.prelink = buildStaticAssetUrl(img.url_webp || img.prelink || img.link)
    })
    imgList.value.push(...resImgList)
  }
  isLastPage.value = currentPage.value >= totalPages.value
  setupLazyAndLightbox()
  await nextTick()
  // 确保页面滚动到顶部
  // window.scrollTo({ top: 0, behavior: 'smooth' })
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
          // console.log('downloadBtn', downloadBtn)
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

// const pageChange = (page) => {
//   if (page != currentPage.value) {
//     currentPage.value = page
//     loadPage()
//   }
// }

//节流函数,用于自动翻页，限制频繁触发
const throttle = (fn, delay) => {
  let lastCall = 0
  return function () {
    const now = Date.now()
    if (now - lastCall > delay) {
      lastCall = now
      fn.apply(this)
    }
  }
}

const delayfatchData = throttle(() => {
  if (!isLastPage.value) {
    console.log('load more data,page:', currentPage.value + 1)
    currentPage.value += 1
    loadPage()
  }
}, 1500)
</script>

<style scoped></style>
