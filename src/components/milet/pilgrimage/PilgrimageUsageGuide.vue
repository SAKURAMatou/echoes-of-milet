<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ ja: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const content = ref<HTMLElement>()
const heading = ref<HTMLElement>()
const step = ref(0)
const t = (zh: string, ja: string) => (props.ja ? ja : zh)
const steps = computed(() => [
  {
    label: t('找地点', '探す'),
    title: t('从一座城市开始', '気になるエリアから'),
    description: t(
      '在地图上方选择城市和区域，点击地图中的地点标记，查看 milet 与这里的故事、照片和位置。',
      '地図の上で都市とエリアを選び、スポットのマーカーを押すと、milet にまつわるエピソードや写真、場所を確認できます。',
    ),
    tip: t(
      '手机上，地点详情在地图下方；向下滚动即可查看。',
      'スマートフォンでは、地図の下にスポットの詳細が表示されます。下にスクロールしてご覧ください。',
    ),
    preview: [
      t('选择城市', '都市を選ぶ'),
      t('选择区域', 'エリアを選ぶ'),
      t('点击地点', 'スポットを押す'),
    ],
  },
  {
    label: t('看照片', '写真を見る'),
    title: t('换一种方式，发现足迹', '写真から足跡をたどる'),
    description: t(
      '通过「地图 / 合集」切换浏览方式。在合集中选择感兴趣的主题和地点；点击地点详情中的照片，可以放大浏览。',
      '「地図 / コレクション」で表示を切り替えられます。コレクションから気になるテーマやスポットを選び、詳細の写真を押すと拡大して見ることができます。',
    ),
    tip: t(
      '地点详情中的导航入口，可以在地图应用中打开位置。',
      '詳細のナビゲーションリンクから、地図アプリで場所を開けます。',
    ),
    preview: [
      t('地图 / 合集', '地図 / コレクション'),
      t('地点详情', 'スポット詳細'),
      t('放大照片', '写真を拡大'),
    ],
  },
  {
    label: t('分享发现', '投稿する'),
    title: t('一起补全这份巡礼地图', '一緒にマップを育てよう'),
    description: t(
      '页面上方的「提供新地点」可分享新发现。已有地点可从详情中的补充 / 纠正入口投稿，地点会自动关联，无需重新选择。',
      ' ページ上部の「新しいスポットを投稿」から新しい発見を共有できます。既存スポットの情報追加・修正は詳細から投稿でき、対象のスポットが自動で紐づきます。',
    ),
    tip: t(
      '只想补照片？选择「补充照片」，填写简短照片说明即可，不需要重填地点资料。',
      '写真だけ追加する場合は「写真の追加」を選び、簡単な説明を添えてください。スポット情報の入力は不要です。',
    ),
    preview: [
      t('新地点', '新しいスポット'),
      t('补充 / 纠正', '情報追加・修正'),
      t('补充照片', '写真の追加'),
    ],
  },
  {
    label: t('提交与审核', '確認・審査'),
    title: t('预览确认，再交给管理员', '内容を確認して送信'),
    description: t(
      '按步骤填写资料、添加照片，最后预览确认并完成真人验证。照片会在浏览器内转换成 WebP，审核采纳后才会公开；邮箱选填，用于接收审核结果。',
      '情報入力と写真追加のあと、内容を確認し、人間であることの確認を行って送信します。写真はブラウザ内で WebP に変換され、審査で採用された内容のみ公開されます。任意のメールアドレスには審査結果をお送りします。',
    ),
    tip: t(
      '如因网络等原因无法上传，也可以将地点信息、照片及说明发送至管理邮箱。',
      '通信環境などでアップロードできない場合は、スポット情報・写真・説明を管理者宛てにメールでお送りいただけます。',
    ),
    preview: [t('填写资料', '情報入力'), t('添加照片', '写真追加'), t('预览确认', '確認・送信')],
  },
])
const current = computed(() => steps.value[step.value]!)
let previousOverflow = ''
async function move(index: number) {
  step.value = index
  await nextTick()
  content.value?.scrollTo({ top: 0 })
  heading.value?.focus({ preventScroll: true })
}
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="pilgrimage-guide-title"
    aria-describedby="pilgrimage-guide-description"
    class="usage-guide m-auto max-h-[calc(100dvh-32px)] w-[min(600px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#e4eff4] bg-white p-0 text-[#405665] shadow-[0_28px_90px_-25px_#6e9dac42]"
    @cancel.prevent="emit('close')"
  >
    <div class="flex max-h-[calc(100dvh-32px)] flex-col">
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-[#edf3f6] bg-gradient-to-r from-[#f3fafc] via-white to-[#faf8ff] px-6 py-4 max-sm:px-5"
      >
        <p class="text-sm font-medium text-[#317f8d]">
          {{ t('巡礼地图 · 使用说明', '巡礼マップ · 使い方') }}
        </p>
        <button
          type="button"
          class="min-h-11 rounded-lg px-3 text-sm text-[#60717a] hover:bg-white"
          @click="emit('close')"
        >
          {{ t('关闭', '閉じる') }}
        </button>
      </header>
      <nav
        :aria-label="t('说明步骤', 'ガイドのステップ')"
        class="grid shrink-0 grid-cols-4 gap-1 border-b border-[#edf3f6] px-4 py-3"
      >
        <button
          v-for="(item, index) in steps"
          :key="index"
          type="button"
          :aria-current="index === step ? 'step' : undefined"
          :class="
            index === step ? 'bg-[#eaf6fb] text-[#356f98]' : 'text-[#738995] hover:bg-[#f7fcff]'
          "
          class="min-h-11 rounded-lg px-1 py-2 text-xs leading-5 sm:text-sm"
          @click="move(index)"
        >
          <span class="block text-xs">{{ index + 1 }}</span
          >{{ item.label }}
        </button>
      </nav>
      <div
        ref="content"
        class="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-6 py-6 max-sm:px-5"
      >
        <p class="text-xs tracking-widest text-[#738995]">{{ step + 1 }} / {{ steps.length }}</p>
        <h2
          id="pilgrimage-guide-title"
          ref="heading"
          tabindex="-1"
          class="font-serif text-2xl leading-snug outline-none"
        >
          {{ current.title }}
        </h2>
        <p id="pilgrimage-guide-description" class="text-sm leading-7">{{ current.description }}</p>
        <ol
          class="flex flex-wrap items-center gap-2 rounded-xl border border-[#e4eff4] bg-[#f7fcff] p-4 text-xs leading-6 text-[#356f98]"
        >
          <li
            v-for="(label, index) in current.preview"
            :key="index"
            class="flex items-center gap-2"
          >
            <span v-if="index" aria-hidden="true" class="text-[#8bb8c7]">→</span>
            <span class="rounded-lg border border-[#d3e5ef] bg-white px-3 py-1">{{ label }}</span>
          </li>
        </ol>
        <div class="rounded-xl bg-[#f6faf8] p-4 text-sm leading-7 text-[#517768]">
          <p>{{ current.tip }}</p>
          <a
            v-if="step === 3"
            href="mailto:dml4015@miles-dml.org"
            class="break-all text-[#356f98] underline decoration-[#8bbddd] underline-offset-4"
            >dml4015@miles-dml.org</a
          >
        </div>
      </div>
      <footer
        class="flex shrink-0 items-center justify-between gap-3 border-t border-[#edf3f6] bg-[#fbfdfe] px-6 py-4 max-sm:px-5"
      >
        <button
          type="button"
          class="min-h-11 rounded-lg px-3 text-sm text-[#60717a] hover:bg-white"
          @click="step ? move(step - 1) : emit('close')"
        >
          {{ step ? t('上一步', '戻る') : t('稍后再看', 'あとで見る') }}
        </button>
        <button
          type="button"
          class="min-h-11 rounded-lg border border-[#8bbddd] bg-[#eaf6fb] px-5 text-sm text-[#356f98] hover:bg-white"
          @click="step === steps.length - 1 ? emit('close') : move(step + 1)"
        >
          {{ step === steps.length - 1 ? t('开始探索', 'マップを見る') : t('下一步 →', '次へ →') }}
        </button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.usage-guide::backdrop {
  background: rgb(44 74 88 / 28%);
  backdrop-filter: blur(4px);
}
</style>
