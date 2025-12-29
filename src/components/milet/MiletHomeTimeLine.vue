<template>
  <div class="mx-auto max-w-3xl space-y-10 p-6 relative">
    <div
      class="absolute top-4 -left-4 rotate-[-3deg] bg-yellow-200 text-yellow-900 px-4 py-1 rounded-full shadow font-semibold text-sm border border-yellow-400"
    >
      🧷 {{ $getConfigLang('miletHomeView')['title2'] }}
    </div>

    <div class="relative mt-12 border-l-4 border-dashed border-blue-400 pl-6">
      <!-- 上方箭头 -->
      <div
        class="absolute -top-4 left-[-12px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-blue-400"
      ></div>
      <!-- Timeline item 1 -->
      <div
        v-for="(item, index) in timelineDataL"
        :key="index"
        @click="openBlog(item.bloglink)"
        :class="[item.bloglink ? 'cursor-pointer' : '', 'mb-10', 'relative']"
      >
        <div
          :class="timelineClass(index).dot"
          class="absolute left-[-36px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 border-white shadow"
        ></div>
        <h3 class="text-lg font-bold" :class="timelineClass(index).title">{{ item.title }}</h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ item.contents }}
        </p>
      </div>
      <!-- More按钮 -->
    </div>
    <div
      class="mt-8 bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
      @click="goToTimeLine"
    >
      <span class="text-gray-600 font-semibold">More →</span>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
//组件展示的数据从父组传值
const props = defineProps({
  timelineDataL: {
    type: Array,
    default: [],
  },
})

const seed = ref(0)
onMounted(() => {
  seed.value = Math.floor(Math.random() * 6) + 5
})

// timeline样式自动选择

const timelineClassList = [
  { dot: 'bg-blue-400', title: 'text-blue-800' },
  { dot: 'bg-pink-300', title: 'text-pink-800' },
  { dot: 'bg-green-300', title: 'text-green-800' },
  { dot: 'bg-yellow-300', title: 'text-yellow-800' },
  { dot: 'bg-purple-200', title: 'text-purple-900' },
  { dot: 'bg-orange-400', title: 'text-orange-900' },
]
const timelineClass = (index) => {
  return timelineClassList[(index + seed.value) % timelineClassList.length]
}

const openBlog = (bloglink) => {
  // console.log(bloglink)
  if (bloglink && bloglink.endsWith('.html')) {
    // window.open('/blogdetail/' + bloglink, '_blank')
    window.open(router.resolve({ name: 'blogDetail', params: { id: bloglink } }).href, '_blank')
    // router.push({ name: 'blogDetail', params: { id: bloglink } })
  }
}

const goToTimeLine = () => {
  router.push({ name: 'miletTimeLine' })
}
</script>
