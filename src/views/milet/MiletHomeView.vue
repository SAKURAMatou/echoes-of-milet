<template>
  <h1 class="text-3xl font-bold text-center mb-4">milet</h1>

  <div class="max-w-3xl mx-auto p-6 space-y-10">
    <!-- 单个内容块 Start -->
    <div
      v-for="(item, idx) in cardDataL"
      :key="idx"
      class="relative min-h-[300px] bg-white/70 border shadow-lg rounded-xl p-6"
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
      <div class="mt-4">
        <p v-for="text in item.contents" class="mb-4 leading-relaxed">
          {{ text }}
        </p>
        <img v-show="item.img" :src="item.img" class="rounded-lg shadow-md mx-auto" />
      </div>
    </div>
  </div>
  <!-- <div class="w-32 h-2 mx-auto my-8 bg-yellow-200 rounded-full rotate-[-2deg] shadow-md"></div> -->

  <!-- <div
    class="w-full h-4 bg-gradient-to-r from-blue-100 to-purple-100 shadow-inner my-10 rounded-full"
  ></div> -->
  <Divider1 />

  <div class="relative w-full px-4 my-10">
    <RouterLink :to="{ name: 'miletPicAlbum' }" target="_blank">
      <button
        class="w-full bg-gradient-to-r from-pink-200 via-yellow-100 to-blue-100 text-blue-800 font-semibold py-3 rounded-xl shadow-md border border-yellow-300 transition duration-300 cursor-pointer"
      >
        📸 图集 Album
      </button>
      <div class="absolute top-[-10px] left-3 w-4 h-4 bg-red-300 rotate-45 shadow-sm"></div>
      <!-- 手帐胶带角标 -->
    </RouterLink>
  </div>

  <Divider1 />
  <!-- timeline -->
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
  <Divider1 />
  <!-- milet官方网站连接 -->
  <div class="mx-auto max-w-3xl space-y-10">
    <MiletSite />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import Divider1 from '@/components/Divider1.vue'
import MiletSite from '@/components/MiletSite.vue'

const cardDatas = ref({
  jp: [],
  zh: [
    {
      title: '🤔mielt是谁',
      contents: [
        'milet（ミレイ）・シンガーソングライター・東京出身',
        '思春期をカナダで過ごし、グローバルな存在感を放つソングライティングとハスキーかつ重厚感のある独特の唄声を兼ね揃えた女性シンガーソングライター。',
        '2019年3月6日にメジャーデビュー。Toru(ONE OK ROCK)プロデュースによるデビュー曲「insideyou」はiTunesなど人気音楽配信サイト11サイトで1位を記録。8月21日にはTVドラマ「偽装不倫」主題歌を収録した3rdEP『us』をリリースし、オリコンデジタルランキング初登場1位を記録したほか、AWA・Spotify・dヒッツ・LINEMUSICなど7つのサブスクサービスで1位を記録。',
        '2019年末「レコチョク年間ランキング2019」のダウンロード部門、ストリーミング部門の両方で新人アーティストランキング1位を記録。',
        '2020年6月3日には全18曲を収録した1stフルアルバム『eyes』をリリースし、オリコン週間CDアルバムランキング及びオリコン週間デジタルアルバムランキングにて共に初登場1位を記録。さらにBillboardJAPAN “HOT ALBUMS”では2週連続で1位を獲得し、8週連続でTOP10入りも果たす。',
        '2021年8月東京2020オリンピック閉会式に歌唱出演。',
        '海外での人気も非常に高く、2023年香港で初の海外音楽フェスに出演したのを皮切りに、同年4本の海外フェスに出演。11月末に台北で開催した初の海外単独公演のチケットは2秒で即完売した。',
        '2024年3月には初のアリーナ公演を4daysで開催、8月から自身最多となるホールツアーを開催し5万人を動員、11月から初のアジアツアーでは2.3万人を動員するなど国内外問わず大きな話題となった。2024年「第66回輝く！日本レコード大賞」最優秀歌唱賞を受賞。',
      ],
      img: '/public/milet-img/milet-2.jpg',
    },
    { title: '🎧怎么认识milet', contents: ['milet'] },
    { title: '🎤mielt的独特之处', contents: [], bgimg: '/public/milet-img/milet-3.jpg' },
  ],
})

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

//语言切换时候调整
const cardDataL = computed(() => {
  return cardDatas.value.zh
})
const timelineDataL = computed(() => {
  return timelineDatas.value.zh
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
