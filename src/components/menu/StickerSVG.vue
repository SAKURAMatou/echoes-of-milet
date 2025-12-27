<template>
  <div class="relative w-full">
    <!-- SVG 贴纸 -->
    <svg
      class="absolute inset-0 w-full h-full"
      viewBox="0 0 320 96"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <!-- <path
        :d="path"
        fill="var(--sticker-bg)"
        stroke="var(--sticker-border)"
        stroke-width="1.4"
        vector-effect="non-scaling-stroke"
        class="transition-[stroke-width,filter] duration-200"
        :class="active ? 'sticker-active' : ''"
      /> -->
      <!-- <path
        :d="path"
        fill="var(--sticker-bg)"
        stroke="var(--sticker-border)"
        stroke-width="1.2"
        vector-effect="non-scaling-stroke"
      /> -->
      <path
        :d="path"
        fill="var(--sticker-bg)"
        stroke="var(--sticker-border)"
        stroke-width="0.9"
        stroke-opacity="0.4"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <!-- 内容 -->
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  path: string
  active?: boolean
}>()
</script>

<style scoped>
.sticker-active {
  stroke-width: 2.2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
}
</style>
