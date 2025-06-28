<template>
  <div class="p-6">
    <div class="prose max-w-none prose-slate dark:prose-invert prose-lg">
      <div class="p-2">
        <h1 class="text-center">{{ metaInfo.title }}</h1>
        <div class="flex justify-between items-center">
          <span>TAG: {{ metaInfo.tagName }}</span
          ><span>DATE: {{ metaInfo.date }}</span>
        </div>
      </div>
      <div v-html="blogContent" class="p-4"></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/AxiosUtil'

const route = useRoute()
const blogId = ref(route.params.id)

const blogContent = ref()
const metaInfo = ref({})
const container = document.createElement('div')
onMounted(async () => {
  const resData = await axiosInstance.post(import.meta.env.VITE_URL_STATIC_BLOG_D + blogId.value)
  if (resData) {
    // blogContent.value = resData
    container.innerHTML = resData
    // 找到那个唯一的源信息 <h2>
    const metaH2 = container.querySelector('h2[id^="title"]')
    const meta = {}
    if (metaH2) {
      const lines = metaH2.textContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.includes(':'))
      for (const line of lines) {
        const [key, ...rest] = line.split(':')
        meta[key.trim()] = rest.join(':').trim()
      }
      metaInfo.value = meta
      metaH2.remove()
    }
    blogContent.value = container.innerHTML
  }
  // console.log(metaInfo.value)
  if (metaInfo.value.title) {
    document.title = metaInfo.value.title
  }
})
</script>
