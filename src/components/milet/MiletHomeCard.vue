<template>
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
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'

const cardDatas = ref({
  jp: [],
  zh: [
    {
      title: '🤔mielt是谁',
      contents: [
        '以下是官网的介绍',
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
    {
      title: '🎧怎么认识milet',
      contents: [
        '这要从2022年说起，经常看日漫，或多或少都会接触j-pop，但是不是刻意关注j-pop，所以一开始并不知道milet。',
        '这一年工作上在一个比较重要的项目，那段时间整个人处于麻木的状态，没有光。',
        '机缘巧合网上听到了Ordinary days，直接沦陷，',
        '虽然歌的名字是平凡的每天，但是歌声里透露的力量感真的能影响心情，让人向上，平凡的每天也值得好好期待的感觉。',
        '之后找了更多milet的歌，日剧主题曲的Final Call，us，出道曲inside you，who i am,checkmate等，逐渐深陷其中',
        '最开始还只是听歌，并不知道milet长相，也没有买CD，看live的想法。歌听的多了之后便有了看live的想法。',
        '等来日本看了stairs巡演之后（人生第一场live）更是被震惊到，live版比录音室版本更好，哪怕是live的BD也没有现场的体验好，陷得更深了。',
      ],
    },
    { title: '🎤mielt的独特之处', contents: [], bgimg: '/public/milet-img/milet-3.jpg' },
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
</script>
