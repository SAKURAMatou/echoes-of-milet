<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  submissionApi,
  submissionErrorMessage,
  type SubmissionReceipt,
} from '@/composables/pilgrimageSubmissions'
const props = defineProps<{ receipt: SubmissionReceipt; ja: boolean }>()
const status = ref('pending'),
  error = ref(''),
  reason = ref(''),
  resultSpotId = ref<string | null>(null),
  saved = ref(false),
  busy = ref(false)
const labels: Record<string, [string, string]> = {
  draft: ['尚未提交', '未送信'],
  pending: ['等待审核', '審査待ち'],
  applying: ['正在处理', '処理中'],
  merged: ['已采纳', '採用済み'],
  rejected: ['未采纳', '不採用'],
  expired: ['已过期', '期限切れ'],
}
async function refresh() {
  busy.value = true
  error.value = ''
  try {
    const result = await submissionApi<{
      status: string
      publicReason: string
      resultSpotId: string | null
    }>(`/${props.receipt.id}/status`, undefined, props.receipt.token)
    status.value = result.status
    reason.value = result.publicReason
    resultSpotId.value = result.resultSpotId
  } catch (e) {
    error.value = submissionErrorMessage(e, props.ja)
  } finally {
    busy.value = false
  }
}
function save() {
  try {
    localStorage.setItem('pilgrimage-submission-receipt', JSON.stringify(props.receipt))
    saved.value = true
  } catch {
    error.value = props.ja ? 'この端末に保存できません。' : '无法保存到当前设备。'
  }
}
onMounted(refresh)
</script>
<template>
  <div class="space-y-5 py-6 text-center">
    <div
      class="mx-auto grid size-16 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-2xl text-emerald-700"
    >
      ✓
    </div>
    <h3 class="font-serif text-2xl">{{ labels[status]?.[ja ? 1 : 0] || status }}</h3>
    <p class="break-all text-xs text-[#60717a]">{{ receipt.id }}</p>
    <p v-if="reason" class="whitespace-pre-wrap text-sm">{{ reason }}</p>
    <p v-if="resultSpotId" class="text-sm">
      {{ ja ? '公開スポット ID：' : '公开地点 ID：' }}{{ resultSpotId }}
    </p>
    <p class="text-xs text-[#60717a]">
      {{
        ja
          ? '審査後に公開されます。確認情報はこの端末に任意で保存できます。共有端末では保存しないでください。'
          : '内容审核后才会公开。可自愿将查询凭证保存到本设备；请勿在共享设备上保存。'
      }}
    </p>
    <div class="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        class="min-h-11 rounded-lg border border-sky-200 px-4"
        :disabled="busy"
        @click="refresh"
      >
        {{ ja ? '状態を更新' : '刷新状态' }}</button
      ><button
        type="button"
        class="min-h-11 rounded-lg border border-sky-200 bg-sky-50 px-4"
        :disabled="saved"
        @click="save"
      >
        {{
          saved
            ? ja
              ? '保存済み'
              : '已保存'
            : ja
              ? 'この端末に確認情報を保存'
              : '保存查询凭证到本设备'
        }}
      </button>
    </div>
    <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
  </div>
</template>
