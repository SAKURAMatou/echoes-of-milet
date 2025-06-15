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
          v-for="item in filteredList"
          :key="item.id"
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
            <p class="text-gray-600 leading-relaxed line-clamp-3">{{ item.content }}</p>
            <span class="text-sm text-gray-500">标签: {{ item.tag }}</span>
          </div>
        </div>
      </div>
      <!-- 分页组件 -->
      <div class="absolute bottom-6 right-0 left-0 w-full mx-auto">
        <div class="max-md:hidden">
          <pagination_long :totalPages="12" :currentPage="1" />
        </div>
        <div class="md:hidden">
          <pagination_short />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import pagination_long from '@/components/Pagination1.vue'
import pagination_short from '@/components/Pagination2.vue'
//tag列表data
const tags = ref([
  { id: 1, name: '日常' },
  { id: 2, name: '随记' },
  { id: 3, name: '技术' },
  { id: 4, name: '日语' },
])

const dataList = ref([
  { id: 1, title: '标题1', content: '内容1', tag: '日常', tagId: 1 },
  { id: 2, title: '标题2', content: '内容2', tag: '随记', tagId: 2 },
  { id: 3, title: '标题3', content: '内容3', tag: '技术', tagId: 3 },
  { id: 4, title: '标题4', content: '内容4', tag: '日语', tagId: 4 },
  { id: 5, title: '标题5', content: '内容1', tag: '日常', tagId: 1 },
  { id: 6, title: '标题6', content: '内容2', tag: '随记', tagId: 2 },
  { id: 7, title: '标题7', content: '内容3', tag: '技术', tagId: 3 },
  { id: 8, title: '标题8', content: '内容4', tag: '日语', tagId: 4 },
])

const selectedTag = ref(0)

const filteredList = computed(() => {
  // 如果没有选中tag，则返回所有数据
  if (selectedTag.value === 0) {
    return dataList.value
  }
  // 否则过滤出选中tag的数据
  return dataList.value.filter((item) => item.tagId === selectedTag.value)
})

const selecteAct = (tagid) => {
  if (selectedTag.value === tagid) {
    return (selectedTag.value = 0) // 如果当前选中的tag被点击，则取消选择
  } else {
    return (selectedTag.value = tagid) // 否则设置为当前点击的tag
  }
}
</script>
