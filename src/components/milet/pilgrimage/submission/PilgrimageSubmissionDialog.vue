<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import SubmissionImageUploader from './SubmissionImageUploader.vue'
import SubmissionVerification from './SubmissionVerification.vue'
import SubmissionResultPanel from './SubmissionResultPanel.vue'
import {
  randomCredential,
  submissionApi,
  submissionErrorMessage,
  type SubmissionConfig,
  type SubmissionReceipt,
} from '@/composables/pilgrimageSubmissions'
const props = defineProps<{
  target?: { id: string; title: string }
  lang: string
  config: SubmissionConfig
  receipt?: SubmissionReceipt
}>()
const emit = defineEmits<{ close: [] }>()
const ja = computed(() => props.lang === 'jp' || props.lang === 'ja'),
  t = (zh: string, jp: string) => (ja.value ? jp : zh)
const dialog = ref<HTMLDialogElement>(),
  closeDialog = ref<HTMLDialogElement>(),
  form = ref<HTMLFormElement>(),
  body = ref<HTMLElement>(),
  uploader = ref<InstanceType<typeof SubmissionImageUploader>>(),
  verification = ref<InstanceType<typeof SubmissionVerification>>()
const step = ref(1),
  busy = ref(false),
  rateLimited = ref(false),
  error = ref(''),
  token = ref(''),
  receipt = ref<SubmissionReceipt | undefined>(props.receipt)
const fields = reactive({
  title: '',
  mapUrl: '',
  address: '',
  workTitle: '',
  description: '',
  sourceUrl: '',
  sourceDescription: '',
  submitterName: '',
  submitterEmail: '',
  rights: false,
  website: '',
})
const selected = ref(['location'])
const choices = computed(() => [
  { key: 'location', label: t('位置 / 地址', '位置・住所') },
  { key: 'title', label: t('地点名称', 'スポット名') },
  { key: 'work', label: t('关联作品', '関連作品') },
  { key: 'description', label: t('地点说明', 'スポットの説明') },
  { key: 'photos', label: t('补充照片', '写真の追加') },
])
const session = ref<{ id: string; writeToken: string; statusToken: string }>()
let initial: Record<string, unknown> | undefined,
  controller: AbortController | undefined,
  originalOverflow = ''
const payload = () => ({
  type: props.target ? 'update_spot' : 'new_spot',
  targetSpotId: props.target?.id,
  language: ja.value ? 'ja' : 'zh',
  title: !props.target || selected.value.includes('title') ? fields.title : '',
  mapUrl: !props.target || selected.value.includes('location') ? fields.mapUrl : '',
  address: !props.target || selected.value.includes('location') ? fields.address : '',
  workTitle: !props.target || selected.value.includes('work') ? fields.workTitle : '',
  description: fields.description,
  sourceUrl: fields.sourceUrl,
  sourceDescription: fields.sourceDescription,
  submitterName: fields.submitterName,
  submitterEmail: fields.submitterEmail,
  rights: { accepted: fields.rights, version: props.config.rightsVersion },
})
function toggle(key: string) {
  selected.value = selected.value.includes(key)
    ? selected.value.filter((k) => k !== key)
    : [...selected.value, key]
}
async function move(value: number) {
  step.value = value
  error.value = ''
  await nextTick()
  body.value?.scrollTo(0, 0)
  body.value?.focus()
}
async function next() {
  if (!form.value?.reportValidity()) return
  if (step.value === 1 && !props.target && !fields.mapUrl && !fields.address) {
    error.value = t('请填写地图链接或位置说明。', '地図リンクまたは場所の説明を入力してください。')
    return
  }
  if (step.value === 1 && props.target && !selected.value.length) {
    error.value = t('请选择至少一个纠正项目。', '修正する項目を選んでください。')
    return
  }
  if (step.value === 2 && !uploader.value?.valid()) {
    error.value = t(
      '请等待照片转换完成，并确认公开照片的使用授权。',
      '写真の変換完了と公開写真の使用許諾を確認してください。',
    )
    return
  }
  if (step.value < 3) {
    await move(step.value + 1)
    return
  }
  if (!fields.rights || (!session.value && !token.value)) {
    error.value = t('请确认声明并完成人机验证。', '同意事項と認証を確認してください。')
    return
  }
  busy.value = true
  error.value = ''
  controller = new AbortController()
  try {
    if (!session.value) {
      initial ||= {
        ...payload(),
        requestId: crypto.randomUUID(),
        writeToken: randomCredential(),
        statusToken: randomCredential(),
        website: fields.website,
      }
      const result = await submissionApi<{ id: string }>(
        '',
        { ...initial, turnstileToken: token.value },
        undefined,
        controller.signal,
        (waiting) => {
          rateLimited.value = waiting
        },
      )
      session.value = {
        id: result.id,
        writeToken: initial.writeToken as string,
        statusToken: initial.statusToken as string,
      }
    }
    const ids = await uploader.value!.upload(
      session.value.id,
      session.value.writeToken,
      controller.signal,
      (waiting) => {
        rateLimited.value = waiting
      },
    )
    await submissionApi(
      `/${session.value.id}/submit`,
      { ...payload(), imageIds: ids },
      session.value.writeToken,
      controller.signal,
      (waiting) => {
        rateLimited.value = waiting
      },
    )
    receipt.value = { id: session.value.id, token: session.value.statusToken }
  } catch (e) {
    error.value = submissionErrorMessage(e, ja.value)
    if (!session.value) verification.value?.reset()
    if (e instanceof Error && e.message === 'SESSION_EXPIRED') {
      session.value = undefined
      initial = undefined
      verification.value?.reset()
    }
  } finally {
    busy.value = false
  }
}
function askClose() {
  if (receipt.value) close()
  else closeDialog.value?.showModal()
}
function close() {
  controller?.abort()
  closeDialog.value?.close()
  dialog.value?.close()
  emit('close')
}
onMounted(() => {
  originalOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
})
onBeforeUnmount(() => {
  controller?.abort()
  document.body.style.overflow = originalOverflow
  closeDialog.value?.close()
  dialog.value?.close()
})
</script>
<template>
  <dialog
    ref="dialog"
    aria-labelledby="submission-title"
    class="submission-dialog m-auto w-[min(790px,calc(100vw-48px))] max-h-[calc(100dvh-64px)] rounded-2xl border border-[#e4eff4] bg-white p-0 text-[#405665] shadow-[0_28px_90px_-25px_#6e9dac42] max-sm:m-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
    @cancel.prevent="askClose"
  >
    <form
      ref="form"
      class="flex max-h-[calc(100dvh-66px)] flex-col max-sm:h-dvh max-sm:max-h-dvh"
      @submit.prevent="next"
    >
      <header
        class="flex shrink-0 justify-between gap-4 bg-gradient-to-r from-[#f1faff] via-white to-[#faf6fc] px-8 pb-5 pt-6 max-sm:px-5"
      >
        <div>
          <p class="text-[10px] tracking-[.2em] text-[#87729e]">PILGRIMAGE · WITH MILET</p>
          <h2
            id="submission-title"
            class="my-2 font-serif text-[28px] font-normal leading-snug max-sm:text-2xl"
          >
            {{
              receipt
                ? t('投稿记录', '投稿状況')
                : target
                  ? t('补充 / 纠正地点信息', 'スポット情報の補足・修正')
                  : t('提供新的巡礼地点', '新しい巡礼スポットを投稿')
            }}
          </h2>
          <p class="text-[13px] text-[#657b88]">
            {{
              t(
                '用你熟悉的语言分享，整理与核实交给我们。',
                '使い慣れた言葉で。情報の整理と確認は私たちにお任せください。',
              )
            }}
          </p>
        </div>
        <button
          type="button"
          class="grid size-11 shrink-0 place-items-center rounded-lg border border-[#d9e7e4] bg-white/90 text-xl text-[#60717a]"
          :aria-label="t('关闭', '閉じる')"
          @click="askClose"
        >
          ×
        </button>
      </header>
      <ol
        v-if="!receipt"
        class="flex shrink-0 gap-4 border-b border-[#edf3f6] px-8 pb-5 pt-1 text-xs max-sm:gap-2 max-sm:px-5"
      >
        <li
          v-for="(label, index) in [
            target ? t('选择纠正项目', '修正する項目') : t('地点与线索', '場所と手がかり'),
            t('照片与补充', '写真・補足'),
            t('预览确认', '確認'),
          ]"
          :key="label"
          class="flex flex-1 items-center gap-2"
          :aria-current="step === index + 1 ? 'step' : undefined"
        >
          <span
            class="grid size-6 shrink-0 place-items-center rounded-full border"
            :class="
              step === index + 1
                ? 'border-[#c8e5ef] bg-[#e4f4fa] text-[#39788d]'
                : 'border-sky-100 text-[#718592]'
            "
            >{{ index + 1 }}</span
          ><span>{{ label }}</span>
        </li>
      </ol>
      <div
        ref="body"
        tabindex="-1"
        class="min-h-0 overflow-y-auto overscroll-contain px-8 py-6 outline-none max-sm:flex-1 max-sm:px-5"
      >
        <SubmissionResultPanel v-if="receipt" :receipt="receipt" :ja="ja" />
        <fieldset v-else :disabled="busy" class="min-w-0">
          <div v-show="step === 1" class="space-y-5">
            <div
              v-if="target"
              class="rounded-lg border border-[#e5e5f1] bg-gradient-to-r from-[#f4fafc] to-[#faf7fc] p-4"
            >
              <p class="text-xs text-[#877a99]">
                {{ t('正在补充的地点 · 已关联', '対象スポット・関連付け済み') }}
              </p>
              <strong class="font-serif text-lg font-normal">{{ target.title }}</strong>
            </div>
            <div v-if="target">
              <p>{{ t('你想补充或纠正什么？', 'どの情報を補足・修正しますか？') }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="choice in choices"
                  :key="choice.key"
                  type="button"
                  class="min-h-11 rounded-lg border px-3 text-sm"
                  :class="
                    selected.includes(choice.key)
                      ? 'border-[#badfce] bg-[#eef9f5] text-[#497c6b]'
                      : 'border-[#e0eaf0] bg-white'
                  "
                  :aria-pressed="selected.includes(choice.key)"
                  @click="toggle(choice.key)"
                >
                  {{ selected.includes(choice.key) ? '✓' : '＋' }} {{ choice.label }}
                </button>
              </div>
            </div>
            <label v-if="!target || selected.includes('title')" class="submission-field"
              >{{ t('地点名称', 'スポット名')
              }}<input
                v-model="fields.title"
                maxlength="200"
                :required="!target && step === 1"
                :placeholder="t('例如：河边的步道、某家咖啡店', '例：川沿いの遊歩道、カフェ')"
            /></label>
            <template v-if="!target || selected.includes('location')"
              ><label class="submission-field"
                >{{ t('地图分享链接（选填）', '地図の共有リンク（任意）')
                }}<input
                  v-model="fields.mapUrl"
                  type="url"
                  maxlength="2048"
                  placeholder="https://…"
                /><span class="text-xs text-[#718793]">{{
                  t(
                    '在地图中打开地点 → 分享 → 复制链接。不需要填写经纬度。',
                    '地図で場所を開く → 共有 → リンクをコピー。緯度・経度の入力は不要です。',
                  )
                }}</span></label
              ><label class="submission-field"
                >{{ t('地址或位置说明（选填）', '住所・場所の説明（任意）')
                }}<input v-model="fields.address" maxlength="500" /></label
            ></template>
            <label v-if="!target || selected.includes('work')" class="submission-field"
              >{{ t('关联作品（选填）', '関連作品（任意）')
              }}<input v-model="fields.workTitle" maxlength="200"
            /></label>
            <label class="submission-field"
              >{{
                target
                  ? t('补充 / 纠正说明（必填）', '補足・修正の説明（必須）')
                  : t('你发现了什么？（必填）', '見つけた情報を教えてください（必須）')
              }}<textarea
                v-model="fields.description"
                maxlength="4000"
                rows="4"
                :required="step === 1"
              />
            </label>
          </div>
          <div v-show="step === 2" class="space-y-5">
            <SubmissionImageUploader ref="uploader" :ja="ja" :disabled="busy" />
            <label class="submission-field"
              >{{ t('来源链接（选填）', '出典リンク（任意）')
              }}<input v-model="fields.sourceUrl" type="url" maxlength="2048" /></label
            ><label class="submission-field"
              >{{ t('来源说明（选填）', '出典の説明（任意）')
              }}<textarea v-model="fields.sourceDescription" maxlength="2000" rows="3" />
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="submission-field"
                >{{ t('昵称（选填）', 'ニックネーム（任意）')
                }}<input v-model="fields.submitterName" maxlength="80" /></label
              ><label class="submission-field"
                >{{ t('邮箱（选填，不公开）', 'メール（任意・非公開）')
                }}<input v-model="fields.submitterEmail" type="email" maxlength="254"
              /></label>
            </div>
          </div>
          <div v-if="step === 3" class="space-y-5">
            <p class="rounded-lg border border-sky-100 bg-[#f3fafc] p-4 text-sm">
              {{
                t(
                  '请检查以下内容。我们只会在核实后发布采纳的信息。',
                  '内容をご確認ください。確認できた情報のみ公開します。',
                )
              }}
            </p>
            <dl class="divide-y divide-sky-100 text-sm">
              <div
                v-for="(value, key) in {
                  [t('地点', 'スポット')]: target?.title || fields.title,
                  [t('地图 / 地址', '地図・住所')]: [fields.mapUrl, fields.address]
                    .filter(Boolean)
                    .join('\n'),
                  [t('说明', '説明')]: fields.description,
                  [t('来源', '出典')]: [fields.sourceUrl, fields.sourceDescription]
                    .filter(Boolean)
                    .join('\n'),
                  [t('照片', '写真')]: `${uploader?.count() || 0}`,
                }"
                :key="key"
                class="grid grid-cols-[80px_1fr] gap-4 py-3"
              >
                <dt class="text-[#657b88]">{{ key }}</dt>
                <dd class="whitespace-pre-wrap break-words">{{ value || '—' }}</dd>
              </div>
            </dl>
            <label class="flex items-start gap-2 text-sm"
              ><input
                v-model="fields.rights"
                type="checkbox"
                :required="step === 3"
                class="mt-1"
              />{{
                t(
                  '我确认信息真实，具有提交材料的权利，同意管理员核实、整理并公开采纳的内容。',
                  '情報が正確であり、資料を投稿する権利があることを確認します。管理者による確認・編集と、採用内容の公開に同意します。',
                )
              }}</label
            >
            <p class="text-xs text-[#657b88]">
              {{
                t(
                  '待审核资料最长保留 90 天；处理后清理临时照片，邮箱 90 天后清除。首版不发送邮件通知。',
                  '審査資料は最長90日間保持します。処理後に一時画像を削除し、メールは90日後に消去します。メール通知は行いません。',
                )
              }}
            </p>
            <SubmissionVerification
              v-if="!session"
              ref="verification"
              :site-key="config.siteKey"
              :ja="ja"
              @token="token = $event"
            />
          </div>
          <input
            v-model="fields.website"
            type="text"
            name="website"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
            class="hidden"
          />
        </fieldset>
        <p v-if="error" role="alert" class="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
          {{ error }}
        </p>
      </div>
      <footer
        class="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-[#edf3f6] bg-[#fbfdfe] px-8 py-4 max-sm:px-5"
      >
        <span class="text-xs text-[#738995]" aria-live="polite">{{
          busy
            ? rateLimited
              ? t(
                  '图片处理中，请稍后重试；本页将自动继续，请勿关闭。',
                  '画像を処理中です。しばらくお待ちください。自動で再試行します。',
                )
              : t('正在安全提交，请稍候…', '送信中です…')
            : t('投稿内容经审核后才会公开', '投稿内容は審査後に公開されます')
        }}</span>
        <div class="flex gap-2 max-sm:w-full">
          <button
            type="button"
            class="min-h-11 rounded-lg px-4 text-sm max-sm:flex-1"
            :disabled="busy"
            @click="!receipt && step > 1 ? move(step - 1) : askClose()"
          >
            {{ !receipt && step > 1 ? t('上一步', '戻る') : t('关闭', '閉じる') }}</button
          ><button
            v-if="!receipt"
            type="submit"
            :disabled="busy"
            class="min-h-11 rounded-lg border border-[#8bbddd] bg-[#eaf6fb] px-5 text-sm text-[#356f98] hover:bg-white disabled:opacity-50 max-sm:flex-1"
          >
            {{ step === 3 ? t('确认投稿', '投稿する') : t('下一步 →', '次へ →') }}
          </button>
        </div>
      </footer>
    </form>
  </dialog>
  <dialog
    ref="closeDialog"
    aria-labelledby="submission-leave-title"
    class="m-auto w-[min(400px,calc(100vw-40px))] rounded-2xl border border-sky-100 bg-white p-6 text-[#405665]"
    @cancel.prevent="closeDialog?.close()"
  >
    <h2 id="submission-leave-title" class="font-serif text-xl">
      {{ t('离开本次投稿？', '投稿を閉じますか？') }}
    </h2>
    <p class="my-4 text-sm">
      {{
        t(
          '关闭将丢弃本页填写内容。已经上传的临时照片会自动过期清理。',
          '入力内容は破棄されます。アップロード済みの一時画像は期限後に削除されます。',
        )
      }}
    </p>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="min-h-11 rounded-lg border border-sky-100 px-4"
        @click="closeDialog?.close()"
      >
        {{ t('继续填写', '入力を続ける') }}</button
      ><button
        type="button"
        class="min-h-11 rounded-lg border border-sky-200 bg-sky-50 px-4"
        @click="close"
      >
        {{ t('离开', '閉じる') }}
      </button>
    </div>
  </dialog>
</template>
<style scoped>
dialog::backdrop {
  background: #b1cbd840;
  backdrop-filter: blur(4px);
}
.submission-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #526b78;
}
.submission-field input,
.submission-field textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid #dce9ef;
  border-radius: 8px;
  background: #fbfdfe;
  padding: 12px 14px;
  color: #405665;
}
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid #b9dfe9;
  outline-offset: 2px;
}
</style>
