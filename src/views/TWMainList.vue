<template>
    <div class="md:flex items-start">
        <div class="md:mr-6 ">
            <!-- 左侧tag列表 -->
            <div class="flex md:flex-col space-y-2 max-md:justify-center">
                <button v-for="tag in tags" :key="tag.id" @click="selecteAct(tag.id)" :class="[
                    'px-4 py-2 rounded transition-colors duration-200',
                    selectedTag === tag.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                ]">
                    {{ tag.name }}
                </button>
            </div>
        </div>
        <div class="flex-1">
            <div class="">
                <!-- 右侧内容列表 -->

                <div v-for="item in dataList" :key="item.id"
                    class="rounded-lg  md:flex shadow-sm hover:shadow-md transition-shadow p-4 gap-4 mb-6">
                    <div class="w-full md:w-1/3 ">
                        <!-- 封面图片 -->
                        <img src="@/assets/default_images_list.svg" alt="封面图片"
                            class="aspect-[4/3] object-cover rounded-lg">

                    </div>
                    <div class="flex flex-col justify-center md:w-2/3 max-md:my-2">
                        <!-- 图片右侧文章概要 -->
                        <h2 class="text-xl font-semibold mb-2 text-gray-800">{{ item.title }}</h2>
                        <p class="text-gray-600 leading-relaxed line-clamp-3">{{ item.content }}</p>
                        <span class="text-sm text-gray-500">标签: {{ item.tag }}</span>
                    </div>


                </div>

            </div>
        </div>

    </div>

</template>
<script setup>
import { ref, computed } from 'vue';
//tag列表data
const tags = ref([
    { id: 1, name: '日常' },
    { id: 2, name: '随记' },
    { id: 3, name: '技术' },
    { id: 4, name: '日语' },
]);

const dataList = ref([{ id: 1, title: '标题1', content: '内容1', tag: '日常' },
{ id: 2, title: '标题2', content: '内容2', tag: '随记' },
{ id: 3, title: '标题3', content: '内容3', tag: '技术' },
{ id: 4, title: '标题4', content: '内容4', tag: '日语' },
{ id: 5, title: '标题5', content: '内容1', tag: '日常' },
{ id: 6, title: '标题6', content: '内容2', tag: '随记' },
{ id: 7, title: '标题7', content: '内容3', tag: '技术' },
{ id: 8, title: '标题8', content: '内容4', tag: '日语' },]);

const selectedTag = ref(0);

const selecteAct = (tagid) => {
    if (selectedTag.value === tagid) {
        return selectedTag.value = 0; // 如果当前选中的tag被点击，则取消选择
    } else {
        return selectedTag.value = tagid; // 否则设置为当前点击的tag
    }

}
</script>