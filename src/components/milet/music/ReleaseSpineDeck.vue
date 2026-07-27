<template>
  <div
    v-if="works.length > 0"
    class="release-spine-deck pointer-events-none absolute inset-x-0 top-0"
    aria-hidden="true"
  >
    <div
      v-for="(work, index) in works"
      :key="work.id"
      class="release-spine absolute inset-x-0 flex h-9 items-center gap-2 rounded-md border border-white/80 bg-white/94 px-2.5 shadow-[0_12px_30px_-22px_rgba(15,61,99,0.72)] backdrop-blur"
      :style="{ top: `calc(${index} * var(--release-spine-step))` }"
    >
      <img
        v-if="work.coverUrl"
        :src="initImgUrl(work.coverUrl)"
        alt=""
        class="h-7 w-7 shrink-0 rounded object-cover"
        width="28"
        height="28"
      />
      <span class="release-spine-title min-w-0 flex-1 text-xs font-semibold text-[#143d63]">
        {{ work.title }}
      </span>
      <span class="shrink-0 text-[11px] tabular-nums text-slate-500">
        {{ work.releaseDate?.slice(0, 4) || '--' }}
      </span>
    </div>
    <div
      v-if="hiddenCount > 0"
      class="release-spine-summary absolute right-0 w-fit rounded-full border border-sky-100 bg-white/92 px-2 py-0.5 text-[10px] font-semibold text-[#317f8d] shadow-sm"
      :style="{
        top: `calc(2.25rem + ${Math.max(0, works.length - 1)} * var(--release-spine-step) + 0.2rem)`,
      }"
    >
      +{{ hiddenCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { initImgUrl } from '@/composables/ImgUrlUtil'
import type { Work } from '@/composables/releaseType'

defineProps<{
  works: Work[]
  hiddenCount: number
}>()
</script>

<style scoped>
.release-spine {
  animation: release-spine-in 210ms ease-out both;
}

.release-spine-deck {
  --release-spine-step: 0.75rem;
}

.release-spine-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes release-spine-in {
  from {
    opacity: 0;
    transform: translateY(7px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .release-spine {
    animation: none;
  }
}

@media (max-width: 767px) {
  .release-spine-deck {
    --release-spine-step: 0.5rem;
  }
}
</style>
