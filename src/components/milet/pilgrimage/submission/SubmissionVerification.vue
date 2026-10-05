<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
const props = defineProps<{ siteKey: string; ja: boolean }>()
const emit = defineEmits<{ token: [value: string] }>()
const container = ref<HTMLElement>(),
  failed = ref(false)
type Api = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
  reset: (id: string) => void
}
const api = () => (window as unknown as { turnstile?: Api }).turnstile
let widget: string | undefined,
  widgetSize: 'compact' | 'flexible' | undefined,
  sizeObserver: ResizeObserver | undefined,
  disposed = false,
  timer: ReturnType<typeof setTimeout> | undefined
function load() {
  failed.value = false
  const started = Date.now()
  const render = () => {
    if (disposed) return
    if (api() && container.value) {
      widgetSize = container.value.clientWidth < 300 ? 'compact' : 'flexible'
      widget = api()!.render(container.value, {
        sitekey: props.siteKey,
        size: widgetSize,
        action: 'pilgrimage_submission',
        language: props.ja ? 'ja' : 'zh-CN',
        callback: (token: string) => emit('token', token),
        'expired-callback': () => emit('token', ''),
        'error-callback': () => {
          emit('token', '')
          failed.value = true
        },
      })
    } else if (Date.now() - started < 15000) timer = setTimeout(render, 150)
    else failed.value = true
  }
  if (!api() && !document.querySelector('script[src*="challenges.cloudflare.com/turnstile/"]')) {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onerror = () => {
      failed.value = true
      script.remove()
    }
    document.head.appendChild(script)
  }
  render()
}
function reset() {
  emit('token', '')
  if (widget) api()?.reset(widget)
  else load()
}
defineExpose({ reset })
onMounted(() => {
  load()
  sizeObserver = new ResizeObserver(() => {
    if (!widget || !container.value) return
    const nextSize = container.value.clientWidth < 300 ? 'compact' : 'flexible'
    if (nextSize === widgetSize) return
    api()?.remove(widget)
    widget = undefined
    emit('token', '')
    load()
  })
  if (container.value) sizeObserver.observe(container.value)
})
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(timer)
  sizeObserver?.disconnect()
  if (widget) api()?.remove(widget)
})
</script>
<template>
  <div class="min-w-0 max-w-full">
    <div ref="container" class="min-h-16 w-full min-w-0" />
    <p v-if="failed" class="text-xs text-rose-700">
      {{ ja ? '認証を読み込めませんでした。' : '验证加载失败。'
      }}<button type="button" class="min-h-11 px-3 underline" @click="reset">
        {{ ja ? '再試行' : '重新加载' }}
      </button>
    </p>
  </div>
</template>
