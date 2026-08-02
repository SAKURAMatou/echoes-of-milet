<template>
  <div
    v-if="shouldRender"
    class="echo-async-state"
    :class="`is-${state}`"
    :aria-busy="state === 'loading'"
    role="status"
  >
    <span class="echo-async-state__path" aria-hidden="true"></span>
    <div>
      <p class="font-medium text-slate-700">{{ title }}</p>
      <p v-if="description" class="mt-1 text-sm leading-6 text-slate-500">{{ description }}</p>
    </div>
    <button
      v-if="state !== 'loading' && actionLabel"
      type="button"
      class="echo-focus min-h-11 rounded-full border border-sky-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    state: 'loading' | 'empty' | 'error'
    title: string
    description?: string
    actionLabel?: string
    disabled?: boolean
    loadingDelay?: number
  }>(),
  { description: '', actionLabel: '', disabled: false, loadingDelay: 300 },
)
defineEmits<{ action: [] }>()

const delayedLoadingVisible = ref(props.state !== 'loading')
let loadingTimer: number | null = null

function clearTimer() {
  if (loadingTimer !== null && typeof window !== 'undefined') window.clearTimeout(loadingTimer)
  loadingTimer = null
}

watch(
  () => props.state,
  (state) => {
    clearTimer()
    if (state !== 'loading' || typeof window === 'undefined') {
      delayedLoadingVisible.value = state !== 'loading'
      return
    }
    delayedLoadingVisible.value = false
    loadingTimer = window.setTimeout(() => {
      delayedLoadingVisible.value = true
      loadingTimer = null
    }, props.loadingDelay)
  },
  { immediate: true },
)

const shouldRender = computed(() => props.state !== 'loading' || delayedLoadingVisible.value)
onBeforeUnmount(clearTimer)
</script>

<style scoped>
.echo-async-state { display: flex; min-height: 8rem; align-items: center; justify-content: center; gap: 1rem; border: 1px solid rgba(143,197,223,.28); border-radius: 1rem; background: rgba(255,255,255,.68); padding: 1.5rem; text-align: left; }
.echo-async-state__path { width: 2.5rem; height: 2.5rem; flex: 0 0 auto; border: 1px solid var(--echo-color-sky); border-radius: 9999px; }
.is-loading .echo-async-state__path { border-color: transparent var(--echo-color-teal) var(--echo-color-sky); animation: echo-loading 900ms linear infinite; }
.is-error .echo-async-state__path { border-radius: .35rem; border-color: rgba(190,86,105,.6); transform: rotate(45deg); }
@keyframes echo-loading { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .is-loading .echo-async-state__path { animation-duration: 1600ms; } }
</style>
