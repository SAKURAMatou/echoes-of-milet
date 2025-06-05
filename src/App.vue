<template>
  <div class="relative min-h-screen">
    <!-- 背景图片透明化div -->
    <div
      class="fixed inset-0 min-h-screen bg-[url(/background/bg-milet-2.jpg)] bg-cover bg-left opacity-25"
    ></div>
    <!-- 内容容器 -->
    <div class="absolute inset-0 justify-center">
      <div class="sticky top-0 md:max-w-[50%] mx-auto mb-5">
        <Header />
      </div>

      <main class="min-h-screen md:max-w-[50%] mx-auto px-5">
        <h1 class="text-3xl font-bold text-center mb-4">milet</h1>

        <!-- 使用一个父div包裹所有p标签，并统一添加Tailwind样式 -->
        <div class="flex flex-col space-y-4 text-base leading-relaxed mt-4">
          <p>milet（ミレイ）・シンガーソングライター・東京出身</p>
          <p>
            思春期をカナダで過ごし、グローバルな存在感を放つソングライティングとハスキーかつ重厚感のある独特の唄声を兼ね揃えた女性シンガーソングライター。
          </p>
          <p>
            2019年3月6日にメジャーデビュー。Toru(ONE OK ROCK)プロデュースによるデビュー曲「inside
            you」はiTunesなど人気音楽配信サイト11サイトで1位を記録。8月21日にはTVドラマ「偽装不倫」主題歌を収録した3rd
            EP『us』をリリースし、オリコンデジタルランキング初登場1位を記録したほか、AWA・Spotify・dヒッツ・LINE
            MUSICなど7つのサブスクサービスで1位を記録。
          </p>
          <p>
            2019年末「レコチョク年間ランキング2019」のダウンロード部門、ストリーミング部門の両方で新人アーティストランキング1位を記録。
          </p>
          <p>
            2020年6月3日には全18曲を収録した1stフルアルバム『eyes』をリリースし、オリコン週間CDアルバムランキング及びオリコン週間デジタルアルバムランキングにて共に初登場1位を記録。さらにBillboard
            JAPAN “HOT ALBUMS”では2週連続で1位を獲得し、8週連続でTOP10入りも果たす。
          </p>
          <p>2021年8月東京2020オリンピック閉会式に歌唱出演。</p>
          <p>
            海外での人気も非常に高く、2023年香港で初の海外音楽フェスに出演したのを皮切りに、同年4本の海外フェスに出演。11月末に台北で開催した初の海外単独公演のチケットは2秒で即完売した。
          </p>
          <p>
            2024年3月には初のアリーナ公演を4daysで開催、8月から自身最多となるホールツアーを開催し5万人を動員、11月から初のアジアツアーでは2.3万人を動員するなど国内外問わず大きな話題となった。2024年「第66回
            輝く！日本レコード大賞」最優秀歌唱賞を受賞。
          </p>
        </div>
        <br />
        <div>
          <TWMainList />
        </div>
      </main>

      <div class="bottom-10 md:max-w-[50%] mx-auto">
        <Footer />
      </div>
      <div class="fixed bottom-4 right-4 z-50">
        <TWUpToTop />
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/TWHeader.vue'
import Footer from '@/components/TWFooter.vue'
import TWUpToTop from '@/components//TWUpToTop.vue'
import TWMainList from '@/views/TWMainList.vue'
</script>
