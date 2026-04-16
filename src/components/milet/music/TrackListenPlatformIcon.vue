<template>
  <div
    class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border border-slate-200/65 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))] shadow-[0_8px_16px_-16px_rgba(15,23,42,0.2)]"
  >
    <svg
      v-if="iconKey === 'apple-music'"
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.5 4.5V15.2A3.2 3.2 0 1 1 14 12.53V7.72l-5 1.1v8.37a3.2 3.2 0 1 1-1.5-2.68V7.63c0-.7.48-1.31 1.16-1.46l5.5-1.22a1.5 1.5 0 0 1 1.84 1.47Z"
        fill="#FF375F"
      />
      <path
        d="M15.5 4.5V9.9L8.5 11.43V7.63c0-.7.48-1.31 1.16-1.46l5.5-1.22a1.5 1.5 0 0 1 .34-.04Z"
        fill="#FF9F0A"
        opacity="0.9"
      />
    </svg>

    <svg
      v-else-if="iconKey === 'spotify'"
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" fill="#1ED760" />
      <path
        d="M6.1 9.3c3.95-1.1 8.06-.9 11.8.58"
        stroke="#0B0F14"
        stroke-width="1.9"
        stroke-linecap="round"
      />
      <path
        d="M7.2 12.47c3.1-.79 6.3-.63 9.26.48"
        stroke="#0B0F14"
        stroke-width="1.7"
        stroke-linecap="round"
      />
      <path
        d="M8.3 15.46c2.22-.5 4.5-.36 6.63.4"
        stroke="#0B0F14"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>

    <svg
      v-else-if="iconKey === 'youtube-music'"
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.1" fill="#FF0033" opacity="0.14" />
      <circle cx="12" cy="12" r="6.8" stroke="#FF0033" stroke-width="1.8" />
      <path d="M10.2 9.05L15.8 12l-5.6 2.95V9.05Z" fill="#FF0033" />
    </svg>

    <svg
      v-else-if="iconKey === 'line-music'"
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14.8 4.8v8.84a2.85 2.85 0 1 1-1.4-2.45V7.92l-3.48.76v6.2a2.8 2.8 0 1 1-1.4-2.42V7.74c0-.65.44-1.21 1.07-1.35l4.3-.95a1.22 1.22 0 0 1 1.5 1.19Z"
        fill="#06C755"
      />
    </svg>

    <svg
      v-else-if="iconKey === 'qq-music'"
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14.8 4.9v8.95a3 3 0 1 1-1.5-2.6V8.15l-3.9.86v6.08a2.9 2.9 0 1 1-1.5-2.53V7.93c0-.7.48-1.3 1.16-1.45l4.24-.94a1.5 1.5 0 0 1 1.82 1.46Z"
        fill="#1CCB67"
      />
      <circle cx="17.8" cy="7.2" r="1.6" fill="#F6D44A" />
    </svg>

    <svg
      v-else-if="iconKey === 'netease'"
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M13.95 5.2a4.8 4.8 0 1 0 4.85 5.26"
        stroke="#E50914"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M14.2 7.9c1.93 0 3.5 1.57 3.5 3.5 0 1.23-.64 2.31-1.6 2.93"
        stroke="#E50914"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <circle cx="12.35" cy="12.45" r="1.55" fill="#E50914" />
    </svg>

    <svg
      v-else
      viewBox="0 0 24 24"
      class="h-10 w-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.3 4.8v9.1a3 3 0 1 1-1.45-2.57V8l-4.1.9v6.02a2.9 2.9 0 1 1-1.45-2.5V7.86c0-.68.47-1.28 1.13-1.43l4.4-.96A1.45 1.45 0 0 1 15.3 4.8Z"
        fill="#64748B"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  platformCode: string
}>()

const iconKey = computed(() => String(props.platformCode || '').trim())
</script>
