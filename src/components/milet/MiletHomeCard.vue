<template>
  <div class="m-4 px-4 py-1 font-semibold text-2xl">
    ♥️ {{ $getConfigLang('miletHomeView')['title0'] }}
  </div>
  <div class="max-w-3xl mx-auto p-6 space-y-10">
    <!-- 单个内容块 Start -->
    <div
      v-for="(item, idx) in cardDataL"
      :key="idx"
      class="relative bg-white/70 border shadow-lg rounded-xl p-6"
      :class="getCardClass(idx).tip"
    >
      <!-- 胶带标题 -->
      <div
        class="absolute -top-5 left-4 px-4 py-1 rounded-full text-sm font-semibold shadow"
        :class="getCardClass(idx).title"
      >
        {{ item.title }}
      </div>

      <!-- 正文 -->
      <div
        class="relative mt-4 max-h-[200px] overflow-hidden cursor-pointer transition-[max-height_0.3s_ease] duration-300"
        @click="cardClick"
      >
        <div
          id="card-bg"
          class="absolute inset-0 bg-cover bg-center opacity-12 rounded-sm"
          :style="{ backgroundImage: `url('${initImgUrl(item.img)}')` }"
        ></div>
        <p v-for="text in item.contents" class="mb-4 leading-relaxed">
          {{ text }}
        </p>
        <img v-show="item.img" :src="initImgUrl(item.img)" class="rounded-lg shadow-md mx-auto" />
        <!-- 渐变遮罩层 
         absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-gray-300 via-white to-transparent-->
        <div class="fade-mask flex justify-center items-center pointer-events-none">
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { initImgUrl } from '@/composables/ImgUrlUtil'

const seed = ref(0)

//组件展示的数据从父组传值
const props = defineProps({
  cardDataL: {
    type: Array,
    default: [],
  },
})

onMounted(() => {
  seed.value = Math.floor(Math.random() * 6) + 5
})

const cardClassList = [
  { tip: 'border-yellow-300', title: 'bg-yellow-200 text-yellow-900 -rotate-2' },
  { tip: 'border-blue-300', title: 'bg-blue-200 text-blue-900 rotate-2' },
  { tip: 'border-purple-300', title: 'bg-purple-200 text-purple-900 -rotate-1' },
  { tip: 'border-pink-300', title: 'bg-pink-200 text-pink-900 -rotate-3' },
  { tip: 'border-green-300', title: 'bg-green-200 text-green-900  rotate-3' },
  { tip: 'border-teal-300', title: 'bg-teal-200 text-teal-900 rotate-1' },
]

function getCardClass(idx) {
  return cardClassList[(idx + seed.value) % cardClassList.length]
}

const cardClick = (event) => {
  const dom = event.currentTarget
  dom.classList.toggle('max-h-[200px]')
  dom.classList.toggle('overflow-hidden')
  const mask = dom.querySelector('.fade-mask')
  mask.classList.toggle('hidden')
  dom.querySelector('#card-bg')?.classList.toggle('hidden')
  // if (dom.classList.contains('max-h-[200px]')) {
  //   mask.style.display = 'flex'
  // } else {
  //   mask.style.display = 'none'
  // }
}
</script>

<style scoped>
.fade-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.98),
    rgba(255, 255, 255, 0.027),
    transparent
  );
}
</style>
