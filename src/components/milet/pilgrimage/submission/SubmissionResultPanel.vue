<script setup lang="ts">
defineProps<{ submissionId: string; ja: boolean; hasEmail: boolean }>()
</script>

<template>
  <div class="space-y-5 py-6 text-center">
    <div
      class="mx-auto grid size-16 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-2xl text-emerald-700"
      aria-hidden="true"
    >
      ✓
    </div>
    <h3 class="font-serif text-2xl">{{ ja ? '投稿完了・審査待ち' : '已提交，等待审核' }}</h3>
    <p class="text-sm leading-6 text-[#60717a]">
      {{
        ja
          ? '投稿ありがとうございます。内容は管理者の確認後に公開されます。'
          : '感谢分享！管理员核实并采纳后，内容才会公开。'
      }}
    </p>
    <p class="break-all text-xs text-[#60717a]">
      {{ ja ? '投稿番号：' : '投稿编号：' }}{{ submissionId }}
    </p>
    <p class="text-sm leading-6 text-[#60717a]">
      {{
        hasEmail
          ? ja
            ? '審査結果は入力したメールアドレスにお送りします。この画面を閉じても大丈夫です。'
            : '审核结果会发送至你填写的邮箱，可以关闭此窗口。'
          : ja
            ? 'メールアドレス未入力のため、結果の個別通知はありません。この画面を閉じても大丈夫です。'
            : '本次未填写邮箱，将不单独通知审核结果，可以关闭此窗口。'
      }}
    </p>
  </div>
</template>
