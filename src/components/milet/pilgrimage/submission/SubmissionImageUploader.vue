<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { convertSubmissionPhoto } from '@/utils/submissionWebp'
import {
  imageDigest,
  submissionApi,
  submissionErrorMessage,
} from '@/composables/pilgrimageSubmissions'
import type { ConvertedPhoto } from '@/workers/submissionWebp.worker'
const props = defineProps<{ ja: boolean; disabled: boolean }>()
type Photo = {
  id: string
  file: File
  preview: string
  state: string
  purpose: 'publish' | 'reference'
  caption: string
  creditName: string
  displayCredit: boolean
  rightsAccepted: boolean
  converted?: ConvertedPhoto
  remoteId?: string
  controller: AbortController
  error?: string
}
const photos = ref<Photo[]>([]),
  error = ref('')
let queue = Promise.resolve(),
  disposed = false
let activeSession: { id: string; token: string } | undefined
const t = (zh: string, ja: string) => (props.ja ? ja : zh)
function convert(photo: Photo) {
  photo.state = 'converting'
  photo.error = ''
  queue = queue
    .catch(() => {})
    .then(async () => {
      if (disposed || photo.controller.signal.aborted) return
      try {
        const result = await convertSubmissionPhoto(photo.file, photo.controller.signal)
        if (disposed || photo.controller.signal.aborted) return
        photo.converted = result
        photo.preview = URL.createObjectURL(result.thumb)
        photo.state = 'ready'
      } catch {
        if (!photo.controller.signal.aborted) {
          photo.state = 'failed'
          photo.error = t(
            '转换失败，请重试或选择较小的照片。',
            '変換できません。再試行するか、小さい写真を選んでください。',
          )
        }
      }
    })
}
function add(files: FileList | null) {
  if (!files || props.disabled) return
  for (const file of files) {
    if (photos.value.length >= 6) {
      error.value = t('最多 6 张照片。', '写真は6枚までです。')
      break
    }
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 20 * 1024 * 1024
    ) {
      error.value = t(
        '请选择 20 MiB 以内的 JPG、PNG 或 WebP。',
        '20 MiB 以下の JPG・PNG・WebP を選んでください。',
      )
      continue
    }
    const item: Photo = {
      id: crypto.randomUUID(),
      file,
      preview: '',
      state: 'converting',
      purpose: 'publish',
      caption: '',
      creditName: '',
      displayCredit: false,
      rightsAccepted: false,
      controller: new AbortController(),
    }
    photos.value.push(item)
    convert(photos.value[photos.value.length - 1]!)
  }
}
async function remove(photo: Photo) {
  if (props.disabled) return
  if (photo.remoteId && activeSession) {
    try {
      await submissionApi(
        `/${activeSession.id}/images/${photo.remoteId}/remove`,
        {},
        activeSession.token,
      )
    } catch (e) {
      photo.error = submissionErrorMessage(e, props.ja)
      return
    }
  }
  photo.controller.abort()
  URL.revokeObjectURL(photo.preview)
  photos.value = photos.value.filter((p) => p.id !== photo.id)
}
async function upload(
  submissionId: string,
  token: string,
  signal: AbortSignal,
  onRateLimit?: (waiting: boolean) => void,
) {
  activeSession = { id: submissionId, token }
  await queue
  const ids: string[] = []
  for (const photo of photos.value) {
    if (!photo.converted || (photo.purpose === 'publish' && !photo.rightsAccepted))
      throw new Error('RIGHTS_REQUIRED')
    try {
      photo.state = 'uploading'
      const prepared = await submissionApi<{
        imageId: string
        sealed?: boolean
        urls: { main: string; thumb: string }
      }>(
        `/${submissionId}/images`,
        {
          clientImageId: photo.id,
          purpose: photo.purpose,
          caption: photo.caption,
          creditName: photo.creditName,
          displayCredit: photo.displayCredit,
          rightsAccepted: photo.rightsAccepted,
          main: {
            bytes: photo.converted.main.size,
            sha256: await imageDigest(photo.converted.main),
          },
          thumb: {
            bytes: photo.converted.thumb.size,
            sha256: await imageDigest(photo.converted.thumb),
          },
        },
        token,
        signal,
        onRateLimit,
      )
      photo.remoteId = prepared.imageId
      if (!prepared.sealed) {
        for (const variant of ['main', 'thumb'] as const) {
          const response = await fetch(prepared.urls[variant], {
            method: 'PUT',
            headers: { 'Content-Type': 'image/webp' },
            body: photo.converted[variant],
            signal,
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
          })
          if (!response.ok) {
            const responseBody = await response.text().catch(() => ''),
              r2Code = responseBody.match(/<Code>([^<]+)<\/Code>/)?.[1] || 'UNKNOWN'
            console.warn('Pilgrimage R2 upload failed', { status: response.status, code: r2Code })
            throw new Error(r2Code === 'ExpiredRequest' ? 'UPLOAD_EXPIRED' : 'UPLOAD_FAILED')
          }
        }
        await submissionApi(
          `/${submissionId}/images/${prepared.imageId}/complete`,
          {},
          token,
          signal,
          onRateLimit,
        )
      }
      photo.state = 'uploaded'
      ids.push(prepared.imageId)
    } catch (e) {
      photo.state = 'ready'
      photo.error = submissionErrorMessage(e, props.ja)
      throw e
    }
  }
  return ids
}
function valid() {
  return photos.value.every((p) => p.converted && (p.purpose === 'reference' || p.rightsAccepted))
}
defineExpose({ upload, valid, count: () => photos.value.length })
onBeforeUnmount(() => {
  disposed = true
  for (const photo of photos.value) {
    photo.controller.abort()
    URL.revokeObjectURL(photo.preview)
  }
})
</script>
<template>
  <div class="space-y-4">
    <label
      class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-[#c3dde9] bg-[#f7fcff] p-6 text-center"
      @dragover.prevent
      @drop.prevent="add($event.dataTransfer?.files || null)"
    >
      <span class="text-2xl text-[#8bb8c7]">＋</span
      ><span>{{ t('分享现场照片或补充参考资料', '現地の写真・参考資料を追加') }}</span>
      <span class="text-xs text-[#60717a]"
        >JPG / PNG / WebP ·
        {{ t('最多 6 张，单张原图 20 MiB', '6枚まで、元画像1枚20 MiB以内') }}</span
      >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        :disabled="disabled"
        class="max-w-full text-xs"
        @change="
          add(($event.target as HTMLInputElement).files)
          ;($event.target as HTMLInputElement).value = ''
        "
      />
    </label>
    <p class="text-xs text-[#60717a]">
      {{
        t(
          '仅上传浏览器转换后的 WebP 主图和缩略图，不上传或保存原始文件。动态图仅采纳首帧，参考图片不会公开。',
          '変換後の WebP 本画像とサムネイルのみ送信し、元ファイルは送信・保存しません。動画は最初のフレームのみ使用し、参考資料は公開しません。',
        )
      }}
    </p>
    <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="grid grid-cols-[64px_1fr] gap-4 border-b border-sky-100 pb-4"
    >
      <img
        v-if="photo.preview"
        :src="photo.preview"
        alt=""
        class="h-20 w-16 rounded-lg object-cover"
      /><span v-else class="text-xs">{{ t('转换中…', '変換中…') }}</span>
      <div class="min-w-0 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-xs">{{ photo.file.name }}</span
          ><button
            type="button"
            :disabled="disabled"
            class="min-h-11 px-2 text-xs"
            @click="remove(photo)"
          >
            {{ t('移除', '削除') }}
          </button>
        </div>
        <fieldset :disabled="disabled || !!photo.remoteId" class="space-y-2">
          <select
            v-model="photo.purpose"
            :aria-label="t('照片用途', '写真の用途')"
            class="w-full rounded-lg border border-sky-100 bg-white p-2"
          >
            <option value="publish">{{ t('现场照片，可公开', '現地写真・公開可') }}</option>
            <option value="reference">{{ t('来源参考，不公开', '参考資料・非公開') }}</option>
          </select>
          <input
            v-model="photo.caption"
            maxlength="500"
            :placeholder="t('照片说明（选填）', '写真の説明（任意）')"
            :aria-label="t('照片说明', '写真の説明')"
            class="w-full rounded-lg border border-sky-100 p-2"
          />
          <template v-if="photo.purpose === 'publish'"
            ><input
              v-model="photo.creditName"
              maxlength="80"
              :placeholder="t('署名（选填）', 'クレジット名（任意）')"
              :aria-label="t('署名', 'クレジット名')"
              class="w-full rounded-lg border border-sky-100 p-2"
            /><label class="flex gap-2 text-xs"
              ><input v-model="photo.displayCredit" type="checkbox" />{{
                t('随照片公开署名', '写真にクレジットを表示する')
              }}</label
            ><label class="flex gap-2 text-xs"
              ><input v-model="photo.rightsAccepted" type="checkbox" />{{
                t(
                  '我拥有照片权利，允许本站展示。',
                  '写真の権利を保有し、当サイトでの掲載を許諾します。',
                )
              }}</label
            ></template
          >
        </fieldset>
        <p class="text-xs text-[#60717a]" aria-live="polite">
          {{
            photo.state === 'uploaded'
              ? t('已上传', 'アップロード済み')
              : photo.state === 'uploading'
                ? t('正在上传…', 'アップロード中…')
                : photo.converted
                  ? t('已完成 WebP 转换', 'WebP 変換済み')
                  : t('正在准备照片', '写真を準備中')
          }}
        </p>
        <p v-if="photo.error" role="alert" class="text-xs text-rose-700">{{ photo.error }}</p>
        <button
          v-if="photo.state === 'failed'"
          type="button"
          class="min-h-11 px-2"
          @click="convert(photo)"
        >
          {{ t('重试转换', '再変換') }}
        </button>
      </div>
    </div>
  </div>
</template>
