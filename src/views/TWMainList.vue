<template>
  <div class="md:flex items-start p-6 min-h-screen relative">
    <div class="md:mr-6 max-md:mt-6">
      <!-- 左侧tag列表 -->
      <div class="sticky top-6">
        <div
          class="flex md:flex-col md:space-y-2 max-md:justify-center max-md:items-center max-md:gap-1 max-md:my-4"
        >
          <button
            v-for="tag in tags"
            :key="tag.id"
            @click="selecteAct(tag.id)"
            :class="[
              'px-4 py-2 rounded transition-colors duration-200',
              selectedTag === tag.id ? 'bg-[#187bcd] text-white' : 'bg-gray-100  hover:bg-blue-400',
            ]"
          >
            {{ tag.name }}
          </button>
        </div>
      </div>
    </div>
    <div class="flex-1">
      <div class="h-full pb-8">
        <!-- 右侧内容列表 -->

        <div
          v-for="item in dataList"
          :key="item.fname.replace(".html")"
          class="rounded-lg md:flex shadow-sm hover:shadow-md transition-shadow p-4 gap-4 mb-6"
        >
          <div class="w-full md:w-1/3">
            <!-- 封面图片 -->
            <img
              src="@/assets/default_images_list.svg"
              alt="封面图片"
              class="aspect-[4/3] object-cover rounded-lg"
            />
          </div>
          <div class="flex flex-col justify-center md:w-2/3 max-md:my-2">
            <!-- 图片右侧文章概要 -->
            <h2 class="text-xl font-semibold mb-2 text-gray-800">{{ item.title }}</h2>
            <p class="text-gray-600 leading-relaxed line-clamp-3">{{ item.summery }}</p>
            <span class="text-sm text-gray-500">{{ item.tagName }}</span> <span class="text-sm text-gray-500"> {{ item.date }}</span>
          </div>
        </div>
      </div>
      <!-- 分页组件 -->
      <div class="absolute bottom-6 right-0 left-0 w-full mx-auto">
        <div class="max-md:hidden">
          <pagination_long :totalPages="totalPages" :currentPage="currentPage" @pageChange="pageChange" />
        </div>
        <div class="md:hidden">
          <pagination_short :totalPages="totalPages" :currentPage="currentPage" @pageChange="pageChange"/>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import pagination_long from '@/components/Pagination1.vue'
import pagination_short from '@/components/Pagination2.vue'
import axiosInstance from '@/AxiosUtil'
//tag列表data
const tags = ref([
  { id: 'TAG_1', name: '技术' },
  { id: 'TAG_2', name: '随记' },
  { id: 'TAG_3', name: '日语' },
  { id: 'TAG_4', name: '其他' },
])

const dataList = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const selectedTag = ref('0')

const loadPage = async () => {
  let url
  //根据是选择了标签，请求不同的连接
  if (selectedTag.value === '0') {
    url = import.meta.env.VITE_URL_API_BLOG_LIST + currentPage.value
  } else {
    url = `${import.meta.env.VITE_URL_API_BLOG_PAGE}${selectedTag.value}/current/${currentPage.value}`
  }
  const resData = await axiosInstance.post(url)
  // const resData = res.data
  if (resData.code === 200) {
    dataList.value = resData.data
    totalPages.value=resData.maxPage
  }
}

const selecteAct = (tagid) => {
  if (selectedTag.value === tagid) {
     selectedTag.value = '0' // 如果当前选中的tag被点击，则取消选择
  } else {
     selectedTag.value = tagid// 否则设置为当前点击的tag
  }
  loadPage()
}

const pageChange=(page)=>{
if (page != currentPage.value) {
    currentPage.value = page
    loadPage()
  }
}

onMounted(()=>{
  loadPage()
})
</script>
