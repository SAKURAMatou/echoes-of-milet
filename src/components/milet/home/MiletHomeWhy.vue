<template>
  <section id="why" class="scroll-mt-24">
    <div class="section-kicker">why milet</div>
    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.title"
        class="rounded-lg border border-white/70 bg-white/70 p-5 shadow-[0_16px_48px_-38px_rgba(31,41,55,0.85)]"
      >
        <div class="text-sm font-semibold text-[#8c4855]">{{ item.title }}</div>
        <div class="mt-3 space-y-1 text-sm leading-7 text-[#4d5b66]">
          <p v-for="line in item.body" :key="line">{{ line }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MiletHomeWhyViewItem } from './types'

defineProps<{
  items: MiletHomeWhyViewItem[]
}>()
</script>

<style scoped>
.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
