<template>
  <div class="mx-auto max-w-3xl space-y-10 p-6 relative">
    <div
      class="absolute top-4 -left-4 rotate-[-3deg] bg-yellow-200 text-yellow-900 px-4 py-1 rounded-full shadow font-semibold text-sm border border-yellow-400"
    >
      🧷 milet活动轨迹
    </div>

    <div class="relative mt-12 border-l-4 border-dashed border-blue-400 pl-6">
      <!-- 上方箭头 -->
      <div
        class="absolute -top-4 left-[-12px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-blue-400"
      ></div>
      <!-- Timeline item 1 -->
      <div v-for="(item, index) in timelineDataL" :key="index" class="mb-10 relative">
        <div
          :class="timelineClass(index).dot"
          class="absolute left-[-36px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 border-white shadow"
        ></div>
        <h3 class="text-lg font-bold" :class="timelineClass(index).title">{{ item.title }}</h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ item.contents }}
        </p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'

const timelineDatas = ref({
  jp: [],
  zh: [
    {
      title: '🦮 2025年7月：5周年live的BD发售',
      contents:
        '虽然还没到发布那一天，但是已经下单了，网传live里发生了很多事，不知道有没有被收录进去。 还有发售日期7.23不是月底也很在意，武道馆BD都是月底发售，莫非要活动再开？',
    },
    {
      title: '🦮 2025年5月：milet正式成为铲屎官',
      contents: '',
    },
    {
      title: '😭 2025年4月：宣布活动暂停',
      contents: '有种天塌了的感觉',
    },
    {
      title: '🎞️ 2025年2月：荧幕女主出道，首次女主演电影上映；同时发布发布双A面单曲',
      contents: '首映当天去看了，故事虽然老套，但milet的演技和音乐都很棒，还有天杀的男主😡',
    },
    {
      title: '🎞️ 2024年12月：日本唱片大奖-最佳歌手',
      contents: '黑子可以闭嘴了',
    },
    {
      title: ' 2024年11月：首次个人亚巡',
      contents:
        '特意回国去了上海场，幸好时间是周六，不然不一定能去。第一次在国内看live，可惜座位不行，完全看不到舞台',
    },
    {
      title: '🪜 2024年下半年：stairs巡演',
      contents:
        'milet自身场次最多的巡演，幸好东京场还有票。在日本拿到信用卡已经是六七月份的事情了，只剩下东京场还有票，但也是天台。人生第一场live给米，milet还的是现场！！',
    },
    {
      title: '🎉 2019年3月6日：主流媒体正式出道',
      contents: '当年刚毕业，正忙毕设，完全不知道milet是谁',
    },
  ],
})

const seed = ref(0)
onMounted(() => {
  seed.value = Math.floor(Math.random() * 6) + 5
})

const timelineDataL = computed(() => {
  return timelineDatas.value.zh
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
</script>
