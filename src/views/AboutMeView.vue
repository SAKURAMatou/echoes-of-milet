<template>
  <div class="min-h-[calc(100vh-88px)] overflow-hidden text-slate-700">
    <section
      id="about-intro"
      class="relative isolate border-b border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.9),transparent_38%),radial-gradient(circle_at_top_right,rgba(244,244,245,0.9),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f0f9ff_48%,#eff6ff_100%)] px-6 pb-14 pt-12 md:px-10"
    >
      <div
        class="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent"
      ></div>
      <div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-1">
        <div>
          <p
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-4 py-1.5 text-xs tracking-[0.26em] text-sky-700 shadow-sm"
          >
            <span class="h-2 w-2 rounded-full bg-sky-400"></span>
            {{ copy.hero.eyebrow }}
          </p>
          <h1
            class="font-['Cormorant_Garamond',serif] text-5xl leading-none text-slate-800 md:text-7xl"
          >
            {{ copy.hero.title }}
          </h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {{ copy.hero.lead }}
          </p>

          <div class="mt-8 space-y-4">
            <div
              v-for="(paragraph, index) in copy.story.paragraphs"
              :key="getParagraphKey(paragraph, index)"
              class="story-line rounded-[24px] border border-white/70 bg-white/75 px-5 py-4 text-[15px] leading-8 text-slate-600 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur"
              :style="{ '--story-delay': `${index * 140}ms` }"
            >
              <template v-if="typeof paragraph === 'string'">
                {{ paragraph }}
              </template>
              <template v-else>
                {{ paragraph.text }}
                <a
                  :href="paragraph.linkUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-900"
                >
                  {{ paragraph.linkLabel }}
                </a>
                {{ paragraph.linkSuffix || '' }}
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="about-feedback" class="px-6 py-12 md:px-10">
      <div
        class="mx-auto grid max-w-6xl gap-8"
        :class="showMessageOwner ? 'lg:grid-cols-[0.82fr_1.18fr]' : 'lg:grid-cols-1'"
      >
        <div v-if="showMessageOwner">
          <div
            class="rounded-[28px] border border-sky-100 bg-white/90 p-6 shadow-[0_24px_60px_rgba(186,230,253,0.14)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs tracking-[0.24em] text-slate-500">{{ copy.feedback.eyebrow }}</p>
                <h2 class="mt-3 font-['Cormorant_Garamond',serif] text-4xl text-slate-800">
                  {{ copy.feedback.title }}
                </h2>
              </div>
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                :aria-label="copy.feedback.closeLabel"
                @click="showMessageOwner = false"
              >
                <span class="text-lg leading-none">x</span>
              </button>
            </div>
            <p class="mt-4 leading-7 text-slate-600">{{ copy.feedback.desc }}</p>
            <ol class="mt-6 space-y-3 text-sm text-slate-500">
              <li
                v-for="(step, index) in copy.feedback.steps"
                :key="step"
                class="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <span
                  class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700"
                >
                  {{ index + 1 }}
                </span>
                <span>{{ step }}</span>
              </li>
            </ol>
          </div>
        </div>

        <div
          class="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_24px_80px_rgba(148,163,184,0.16)] md:p-8"
        >
          <form class="space-y-5" novalidate @submit.prevent="openConfirm">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700" for="email">
                {{ copy.form.emailLabel }}
              </label>
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                class="w-full rounded-2xl border bg-slate-50/60 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                :class="errors.email ? 'border-rose-300' : 'border-slate-200'"
                :placeholder="copy.form.emailPlaceholder"
                @blur="validateField('email')"
              />
              <p v-if="errors.email" class="mt-2 text-sm text-rose-500">{{ errors.email }}</p>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label class="block text-sm font-medium text-slate-700" for="title">
                  {{ copy.form.titleLabel }}
                </label>
                <span class="text-xs text-slate-400">{{ form.title.length }}/120</span>
              </div>
              <input
                id="title"
                v-model.trim="form.title"
                type="text"
                maxlength="120"
                autocomplete="off"
                class="w-full rounded-2xl border bg-slate-50/60 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                :class="errors.title ? 'border-rose-300' : 'border-slate-200'"
                :placeholder="copy.form.titlePlaceholder"
                @blur="validateField('title')"
              />
              <p v-if="errors.title" class="mt-2 text-sm text-rose-500">{{ errors.title }}</p>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label class="block text-sm font-medium text-slate-700" for="content">
                  {{ copy.form.contentLabel }}
                </label>
                <span class="text-xs text-slate-400">{{ form.content.length }}/2000</span>
              </div>
              <textarea
                id="content"
                v-model.trim="form.content"
                rows="7"
                maxlength="2000"
                class="w-full rounded-[24px] border bg-slate-50/60 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                :class="errors.content ? 'border-rose-300' : 'border-slate-200'"
                :placeholder="copy.form.contentPlaceholder"
                @blur="validateField('content')"
              ></textarea>
              <p v-if="errors.content" class="mt-2 text-sm text-rose-500">{{ errors.content }}</p>
            </div>

            <div class="hidden" aria-hidden="true">
              <label for="website">{{ copy.form.honeypotLabel }}</label>
              <input
                id="website"
                v-model.trim="form.website"
                type="text"
                autocomplete="off"
                tabindex="-1"
              />
            </div>

            <div class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <p class="text-sm font-medium text-slate-700">{{ copy.form.turnstileTitle }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-500">{{ copy.form.turnstileDesc }}</p>
              <div
                v-if="turnstileEnabled"
                ref="turnstileRef"
                class="mt-4 min-h-[70px] rounded-2xl border border-dashed border-sky-200 bg-white px-3 py-2"
              ></div>
              <div
                v-else
                class="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
              >
                {{ copy.form.turnstilePending }}
              </div>
              <p v-if="errors.turnstile" class="mt-2 text-sm text-rose-500">
                {{ errors.turnstile }}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p class="text-sm leading-6 text-slate-500">{{ copy.form.submitHint }}</p>
              <button
                type="submit"
                class="inline-flex min-w-[170px] items-center justify-center rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? copy.form.submitting : copy.form.submit }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section id="about-footer" class="px-6 pb-14 md:px-10">
      <div
        class="mx-auto grid max-w-6xl gap-6 rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] p-6 shadow-[0_24px_80px_rgba(186,230,253,0.14)] md:grid-cols-2 md:p-8"
      >
        <div>
          <p class="text-xs tracking-[0.24em] text-slate-500">{{ copy.footer.copyrightTitle }}</p>
          <p class="mt-4 text-sm leading-7 text-slate-600">{{ copy.footer.copyrightBody }}</p>
        </div>
        <div>
          <p class="text-xs tracking-[0.24em] text-slate-500">{{ copy.footer.techInfoTitle }}</p>
          <ul class="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li v-for="item in copy.footer.techInfoItems" :key="item">• {{ item }}</li>
          </ul>
        </div>
      </div>
    </section>

    <teleport to="body">
      <transition name="fade">
        <div
          v-if="showConfirm"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-sm"
          @click.self="showConfirm = false"
        >
          <div
            class="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-[0_32px_100px_rgba(15,23,42,0.28)] md:p-8"
          >
            <p class="text-xs tracking-[0.24em] text-slate-500">{{ copy.confirm.eyebrow }}</p>
            <h3 class="mt-3 font-['Cormorant_Garamond',serif] text-4xl text-slate-800">
              {{ copy.confirm.title }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-slate-500">{{ copy.confirm.desc }}</p>

            <dl class="mt-6 space-y-4">
              <div class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <dt class="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {{ copy.form.emailLabel }}
                </dt>
                <dd class="mt-1 break-all text-sm text-slate-700">{{ form.email }}</dd>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <dt class="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {{ copy.form.titleLabel }}
                </dt>
                <dd class="mt-1 text-sm text-slate-700">{{ form.title }}</dd>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <dt class="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {{ copy.form.contentLabel }}
                </dt>
                <dd class="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {{ form.content }}
                </dd>
              </div>
            </dl>

            <div class="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                class="rounded-full border border-slate-200 px-5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
                :disabled="isSubmitting"
                @click="showConfirm = false"
              >
                {{ copy.confirm.back }}
              </button>
              <button
                type="button"
                class="rounded-full bg-slate-800 px-5 py-2.5 text-sm text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSubmitting"
                @click="submitForm"
              >
                {{ isSubmitting ? copy.form.submitting : copy.confirm.submit }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <teleport to="body">
      <transition name="toast">
        <div
          v-if="toast.visible"
          class="fixed right-4 top-4 z-[140] w-[min(92vw,360px)] rounded-[24px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_60px_rgba(16,185,129,0.18)] backdrop-blur"
        >
          <p class="text-sm font-semibold text-emerald-700">{{ copy.toast.title }}</p>
          <p class="mt-1 text-sm leading-6 text-slate-600">{{ toast.message }}</p>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import axiosInstance from '@/AxiosUtil'

const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

const ABOUT_COPY = {
  zh: {
    hero: {
      eyebrow: 'ABOUT ME',
      title: 'For milet, for miles — a quiet place to stay.',
      lead: '这是一个围绕 milet， 由miles 创造的小小角落。从 2024 年成为 miles 开始，我在这里记录她的音乐、现场与点滴，也记录作为听众逐渐加深的理解与共鸣。',
    },
    story: {
      paragraphs: [
        '我希望这里不是信息的堆砌，而更像一本不断更新的miles的手账：有热爱，有整理，也带着一点执拗的审美。',
        `围绕 milet 的内容，是这个站点最初的起点。
从 2024 年成为 miles 开始，我逐渐了解并记录关于她的作品与现场。
这里不会停留在“资料整理”，而更希望保留作品带来的情绪、现场的感受，以及作为听众的观察。`,
        '这个网站始于 2025 年，所有内容均基于网络公开信息整理，并由我持续维护。- miles DML',
        {
          text: '这里并不是官方信息的发布地，虽然我会尽力确保内容的准确，但难免会有疏漏和错误。如果你发现任何问题，欢迎通过下方的反馈表单联系我。官方网站请参考：',
          linkLabel: 'milet.jp',
          linkUrl: 'https://milet.jp/',
        },
        '关于我：一个追寻milet脚步的普通miles，但至今还没有拿到过签名 ::>_<:: ……果然还是想要一份亲签。',
      ],
    },
    feedback: {
      eyebrow: 'MESSAGE TO THE OWNER',
      title: 'Send a note',
      desc: '如果你想反馈问题、交流内容、纠正资料，或者只是想打个招呼，都可以通过下面的表单留言。',
      closeLabel: '关闭说明',
      steps: [
        '填写邮箱、标题和内容后点击提交。',
        '页面会先进入确认步骤，便于你再次核对内容。',
        '确认无误后正式提交，表单会清空并弹窗提示发送成功。',
      ],
    },
    form: {
      emailLabel: '邮箱',
      emailPlaceholder: 'you@example.com',
      titleLabel: '标题',
      titlePlaceholder: '例如：页面建议、资料勘误、合作沟通',
      contentLabel: '内容',
      contentPlaceholder: '想说的话可以写在这里，建议尽量描述清楚背景与需求。',
      honeypotLabel: '请勿填写此字段',
      turnstileTitle: '安全验证',
      turnstileDesc: '请完成下方的人机验证后再提交。',
      turnstilePending:
        '尚未配置 Turnstile 站点 Key，当前使用前端占位模式。接入后端前，请在环境变量中配置 `VITE_TURNSTILE_SITE_KEY`。',
      submitHint: '提交前会先进入确认步骤，你仍然可以返回修改。',
      submit: '进入确认',
      submitting: '提交中...',
    },
    confirm: {
      eyebrow: 'CONFIRMATION',
      title: 'Check before sending',
      desc: '请确认以下内容无误。正式提交后，表单会被清空。',
      back: '返回修改',
      submit: '确认并发送',
    },
    toast: {
      title: '发送成功',
      message: '留言已经提交，感谢你的反馈。',
    },
    footer: {
      copyrightTitle: 'COPYRIGHT NOTICE',
      copyrightBody:
        '本站为个人非商业站点。除特别说明外，页面设计、文案整理与前端实现均为站点 owner 自行维护；引用内容的原始版权归对应权利方所有，如有不妥请联系删除。',
      techInfoTitle: 'TECH & OPERATION',
      techInfoItems: [
        '前端基于 Vue 3、Vite、Tailwind CSS、Cloudflare 构建。',
        '当前页面内容支持中文与日文切换，后续可继续扩展更多语言。',
      ],
    },
    validation: {
      emailRequired: '请输入邮箱地址。',
      emailInvalid: '请输入有效的邮箱地址。',
      titleRequired: '请输入标题。',
      titleTooLong: '标题不能超过 120 个字符。',
      contentRequired: '请输入留言内容。',
      contentTooLong: '内容不能超过 2000 个字符。',
      turnstileRequired: '请先完成安全验证。',
      honeypotBlocked: '提交未通过安全校验。',
      submitFailed: '提交失败，请稍后重试。',
    },
  },
  jp: {
    hero: {
      eyebrow: 'ABOUT ME',
      title: 'For milet, for miles — a quiet place to stay.',
      lead: 'ここは milet を中心にした、milesにより作った小さな場所です。2024年にmilesになってから、彼女の音楽やライブ、さまざまな瞬間を記録しながら、リスナーとして深まっていく理解や共鳴も残しています。',
    },
    story: {
      paragraphs: [
        `ここを単なる情報の集積ではなく、
書き続けていく「milesの手帳」のような場所にしたいと思っています。
好きという気持ちと整理、そして少しのこだわりを込めて。`,
        `milet を軸としたコンテンツは、このサイトの出発点です。
2024年にmilesになってから、彼女の作品やライブについて少しずつ知り、記録してきました。
単なるアーカイブではなく、音楽から受け取った感情やライブの空気、そして一人のリスナーとしての視点を残していきたいと思っています。`,
        `このサイトは2025年に立ち上げ、公開されている情報をもとに自分で収集・整理し、継続的に更新しています。- miles DMLより`,
        {
          text: 'ここは公式な情報の発信場所ではありません。内容の正確性にはできる限り配慮していますが、誤りや不備が含まれる可能性があります。もし問題やお気づきの点がありましたら、下記のフィードバックフォームよりご連絡ください。公式サイトについては、',
          linkLabel: 'milet公式サイト',
          linkUrl: 'https://milet.jp/',
          linkSuffix: ' をご参照ください。',
        },
        '私について：milet を追いかけている、ただのmilesです。いまだにサインはもらえていなくて ::>_<:: ……いつか直筆サインを手に入れたいと思っています。',
      ],
    },
    feedback: {
      eyebrow: 'MESSAGE TO THE OWNER',
      title: 'Send a note',
      desc: '内容の誤り、ページ改善の提案、感想、ちょっとした挨拶まで、気軽にメッセージを送ってください。',
      closeLabel: '説明を閉じる',
      steps: [
        'メールアドレス、タイトル、本文を入力して送信ボタンを押します。',
        'その後、確認ステップに進み、内容をもう一度確認できます。',
        '問題なければ正式送信し、フォームは空に戻って送信成功のポップアップを表示します。',
      ],
    },
    form: {
      emailLabel: 'メールアドレス',
      emailPlaceholder: 'you@example.com',
      titleLabel: 'タイトル',
      titlePlaceholder: '例: ページ改善、情報修正、コラボ相談',
      contentLabel: '本文',
      contentPlaceholder: '背景や要望が伝わるように、できるだけ具体的に書いてください。',
      honeypotLabel: 'この項目は入力しないでください',
      turnstileTitle: 'セキュリティ認証',
      turnstileDesc: '送信前に下の認証を完了してください。',
      turnstilePending:
        'Turnstile の site key が未設定のため、現在はフロントエンドのプレースホルダー表示です。接続時は `VITE_TURNSTILE_SITE_KEY` を設定してください。',
      submitHint: '送信前に確認ステップへ進むため、まだ修正できます。',
      submit: '確認へ進む',
      submitting: '送信中...',
    },
    confirm: {
      eyebrow: 'CONFIRMATION',
      title: 'Check before sending',
      desc: '以下の内容を確認してください。正式送信後はフォームがリセットされます。',
      back: '修正に戻る',
      submit: '確認して送信',
    },
    toast: {
      title: '送信完了',
      message: 'メッセージを受け取りました。ありがとうございます。',
    },
    footer: {
      copyrightTitle: 'COPYRIGHT NOTICE',
      copyrightBody:
        'このサイトは個人による非商用サイトです。特記のない限り、ページ設計、文章整理、フロントエンド実装は site owner が管理しています。引用物の権利は各権利者に帰属し、問題があれば連絡に応じて対応します。',
      techInfoTitle: 'TECH & OPERATION',
      techInfoItems: [
        'フロントエンドは Vue 3、Vite、Tailwind CSS、CSS、Cloudflare を基盤に構築しています。',
        '現在は中国語と日本語の切り替えに対応し、今後さらに拡張可能です。',
      ],
    },
    validation: {
      emailRequired: 'メールアドレスを入力してください。',
      emailInvalid: '有効なメールアドレスを入力してください。',
      titleRequired: 'タイトルを入力してください。',
      titleTooLong: 'タイトルは 120 文字以内で入力してください。',
      contentRequired: '本文を入力してください。',
      contentTooLong: '本文は 2000 文字以内で入力してください。',
      turnstileRequired: 'セキュリティ認証を完了してください。',
      honeypotBlocked: 'セキュリティチェックに失敗しました。',
      submitFailed: '送信に失敗しました。しばらくしてから再試行してください。',
    },
  },
}

const form = reactive({
  email: '',
  title: '',
  content: '',
  website: '',
})

const errors = reactive({
  email: '',
  title: '',
  content: '',
  turnstile: '',
})

const toast = reactive({
  visible: false,
  message: '',
})

const showMessageOwner = ref(true)
const turnstileRef = ref(null)
const showConfirm = ref(false)
const isSubmitting = ref(false)
const turnstileToken = ref('')
const widgetId = ref(null)
const toastTimer = ref(null)

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
const feedbackApiUrl = import.meta.env.VITE_URL_API_ABOUT_FEEDBACK || ''
const turnstileEnabled = computed(() => Boolean(turnstileSiteKey))
const activeLang = computed(() => (global.$lang?.lang === 'jp' ? 'jp' : 'zh'))
const copy = computed(() => ABOUT_COPY[activeLang.value])

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getParagraphKey(paragraph, index) {
  if (typeof paragraph === 'string') {
    return paragraph
  }

  return `${index}-${paragraph.linkUrl}`
}

function validateField(field) {
  const validation = copy.value.validation

  if (field === 'email') {
    if (!form.email) {
      errors.email = validation.emailRequired
      return false
    }
    if (!emailPattern.test(form.email)) {
      errors.email = validation.emailInvalid
      return false
    }
    errors.email = ''
    return true
  }

  if (field === 'title') {
    if (!form.title) {
      errors.title = validation.titleRequired
      return false
    }
    if (form.title.length > 120) {
      errors.title = validation.titleTooLong
      return false
    }
    errors.title = ''
    return true
  }

  if (field === 'content') {
    if (!form.content) {
      errors.content = validation.contentRequired
      return false
    }
    if (form.content.length > 2000) {
      errors.content = validation.contentTooLong
      return false
    }
    errors.content = ''
    return true
  }

  if (field === 'turnstile') {
    if (turnstileEnabled.value && !turnstileToken.value) {
      errors.turnstile = validation.turnstileRequired
      return false
    }
    errors.turnstile = ''
    return true
  }

  return true
}

function validateForm() {
  const ok =
    validateField('email') &&
    validateField('title') &&
    validateField('content') &&
    validateField('turnstile')

  if (form.website) {
    errors.turnstile = copy.value.validation.honeypotBlocked
    return false
  }

  return ok
}

function openConfirm() {
  if (!validateForm()) {
    return
  }
  showConfirm.value = true
}

function resetForm() {
  form.email = ''
  form.title = ''
  form.content = ''
  form.website = ''
  errors.email = ''
  errors.title = ''
  errors.content = ''
  errors.turnstile = ''
  turnstileToken.value = ''
  showConfirm.value = false
  resetTurnstile()
}

function showToast(message) {
  toast.message = message
  toast.visible = true

  if (toastTimer.value) {
    clearTimeout(toastTimer.value)
  }

  toastTimer.value = window.setTimeout(() => {
    toast.visible = false
  }, 3200)
}

async function submitForm() {
  if (!validateForm()) {
    showConfirm.value = false
    return
  }

  isSubmitting.value = true

  const payload = {
    email: form.email,
    title: form.title,
    content: form.content,
    locale: activeLang.value,
    source: 'about-me',
    turnstileToken: turnstileToken.value || null,
    honeypot: form.website || '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    submittedAt: new Date().toISOString(),
  }

  try {
    if (feedbackApiUrl) {
      await axiosInstance.post(feedbackApiUrl, payload)
    } else {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
    }

    resetForm()
    showToast(copy.value.toast.message)
  } catch (error) {
    console.error('about feedback submit failed', error)
    showToast(copy.value.validation.submitFailed)
  } finally {
    isSubmitting.value = false
  }
}

function resetTurnstile() {
  if (!turnstileEnabled.value) {
    return
  }

  const api = window.turnstile
  if (api && widgetId.value !== null) {
    api.reset(widgetId.value)
  }
}

function ensureTurnstileScript() {
  return new Promise((resolve, reject) => {
    if (!turnstileEnabled.value) {
      resolve(null)
      return
    }

    if (window.turnstile) {
      resolve(window.turnstile)
      return
    }

    const existing = document.querySelector('script[data-turnstile="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    script.onload = () => resolve(window.turnstile)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function renderTurnstile() {
  if (!turnstileEnabled.value || !turnstileRef.value || widgetId.value !== null) {
    return
  }

  try {
    const api = await ensureTurnstileScript()

    if (!api || !turnstileRef.value) {
      return
    }

    widgetId.value = api.render(turnstileRef.value, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      callback(token) {
        turnstileToken.value = token
        errors.turnstile = ''
      },
      'expired-callback'() {
        turnstileToken.value = ''
      },
      'error-callback'() {
        turnstileToken.value = ''
      },
    })
  } catch (error) {
    console.error('turnstile load failed', error)
  }
}

onMounted(() => {
  renderTurnstile()
})

onBeforeUnmount(() => {
  if (toastTimer.value) {
    clearTimeout(toastTimer.value)
  }
})
</script>

<style scoped>
.story-line {
  opacity: 0;
  transform: translateY(18px);
  animation: story-rise 720ms ease forwards;
  animation-delay: var(--story-delay);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes story-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
